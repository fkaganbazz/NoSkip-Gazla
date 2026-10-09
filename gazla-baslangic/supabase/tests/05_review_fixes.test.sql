-- pgTAP: rules added after the security / business-logic review of the schema.
--
-- Timezone change cannot reopen closed days, rescue for a missed first day, late joiners finishing,
-- finalization waiting for other members, friend request rate limit, reports (blocked, invite link,
-- evidence), Diken push claim, active challenge cap, friend profile and recent days, finished
-- memberships, invite links, account deletion.
--
-- Time is driven through the p_at parameter of the app.* functions (run as postgres); now()-based
-- RPCs get data built relative to now(). Everything is rolled back.
--
-- Run:  supabase test db   (or the local testbed: ./test.sh supabase/tests/05_review_fixes.test.sql)
begin;
select plan(95);
-- This file tests behaviour, not privileges (01_rls_privileges does).
grant execute on all functions in schema app to authenticated;

create function pg_temp.mk_user(p_ident text, p_tz text default 'Europe/Istanbul') returns uuid
language plpgsql as $$
declare
  v uuid := tests.create_supabase_user(p_ident);
begin
  insert into public.profiles (id, username, display_name) values (v, p_ident, initcap(p_ident));
  insert into public.user_settings (user_id, birth_year, timezone) values (v, 1995, p_tz);
  return v;
end
$$;

create function pg_temp.mk_ch(p_title text, p_start date, p_days integer,
                              p_type public.task_type default 'check', p_owner uuid default null)
returns uuid
language sql as $$
  insert into public.challenges (title, task_type, duration_days, start_date, created_by)
  values (p_title, p_type, p_days, p_start, p_owner)
  returning id
$$;

create function pg_temp.add_member(p_ch uuid, p_user uuid, p_joined_on date,
                                   p_role public.member_role default 'member') returns integer
language sql as $$
  insert into public.challenge_members (challenge_id, user_id, role, status, joined_at, joined_on)
  values (p_ch, p_user, p_role, 'active', p_joined_on::timestamptz, p_joined_on)
  returning 1
$$;

create function pg_temp.ci(p_user uuid, p_ch uuid, p_from date, p_to date) returns integer
language sql as $$
  with ins as (
    insert into public.checkins (user_id, challenge_id, local_date)
    select p_user, p_ch, g::date from generate_series(p_from, p_to, interval '1 day') as g
    returning 1
  )
  select count(*)::int from ins
$$;

create function pg_temp.befriend(p_a uuid, p_b uuid) returns integer
language sql as $$
  insert into public.friendships (requester_id, addressee_id, status, accepted_at)
  values (p_a, p_b, 'accepted', now())
  returning 1
$$;

select app.local_date(tests.create_supabase_user('clock'), now()) as today \gset

-- ================================================================================================
-- 1. A timezone change cannot reopen days that were closed in the old timezone
-- ================================================================================================

select pg_temp.mk_user('tz_user') as tz \gset
select pg_temp.mk_ch('Saat dilimi', '2026-09-01', 30) as ch_tz \gset
select pg_temp.add_member(:'ch_tz', :'tz', '2026-09-01') as _x \gset

select tests.authenticate_as('tz_user');
update public.user_settings set timezone = 'America/Los_Angeles';
reset role;
select is((select checkin_floor from public.user_settings where user_id = :'tz'),
          ((now() - interval '2 hours') at time zone 'Europe/Istanbul')::date,
          'changing the timezone sets the floor to the earliest day still open in the old timezone');
select tests.authenticate_as('tz_user');
update public.user_settings set timezone = 'Asia/Tokyo';
reset role;
select is((select checkin_floor from public.user_settings where user_id = :'tz'),
          ((now() - interval '2 hours') at time zone 'Europe/Istanbul')::date,
          'a second change never lowers the floor (Los Angeles is behind Istanbul)');
select tests.authenticate_as('tz_user');
select throws_ok($$update public.user_settings set checkin_floor = null$$, '42501', null,
                 'the client cannot clear the floor');
reset role;

-- Simulate a change made on 2026-09-11 (floor 09-11) and look at 09-11 01:00 Istanbul
update public.user_settings set timezone = 'Europe/Istanbul' where user_id = :'tz';
update public.user_settings set checkin_floor = '2026-09-11' where user_id = :'tz';
select is(app.open_dates(:'tz', '2026-09-11 01:00+03'), array['2026-09-11', '2026-09-10']::date[],
          'the streak engine still sees yesterday as open inside the grace period');
select is(app.checkin_dates(:'tz', '2026-09-11 01:00+03'), array['2026-09-11']::date[],
          'but yesterday is below the floor, so it cannot be checked in');
select throws_ok(
  format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-10', '2026-09-11 01:00+03')$$, :'tz', :'ch_tz'),
  'P0001', 'Bu gün artık işaretlenemez', 'check-in below the floor is refused');
select throws_ok(
  format($$select app.do_undo_checkin(%L, %L, '2026-09-10', '2026-09-11 01:00+03')$$, :'tz', :'ch_tz'),
  'P0001', 'Geçmiş günler değiştirilemez', 'undo below the floor is refused');
select lives_ok(
  format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-11', '2026-09-11 01:00+03')$$, :'tz', :'ch_tz'),
  'today (on the floor) can still be checked in');

-- ================================================================================================
-- 2. A missed first day in a new challenge can be rescued while the overall streak is alive
-- ================================================================================================

select pg_temp.mk_user('first_day') as fd \gset
select pg_temp.mk_ch('Eski', '2026-09-01', 30) as ch_fa \gset
select pg_temp.mk_ch('Yeni', '2026-09-06', 7) as ch_fb \gset
select pg_temp.add_member(:'ch_fa', :'fd', '2026-09-01') + pg_temp.add_member(:'ch_fb', :'fd', '2026-09-06') as _x \gset
select pg_temp.ci(:'fd', :'ch_fa', '2026-09-01', '2026-09-06') as _x \gset

select is(app.user_streak(:'fd', '2026-09-07 03:00+03'), 0,
          'the missed first day of the new challenge breaks the overall streak');
select results_eq(
  format($$select challenge_id, missed_date, streak_before, expires_at
           from app.pending_rescues(%L, '2026-09-07 03:00+03')$$, :'fd'),
  format($$values (%L::uuid, '2026-09-06'::date, 5, '2026-09-08 02:00+03'::timestamptz)$$, :'ch_fb'),
  'the first day is offered for rescue with the overall streak at risk (5)');
select lives_ok(
  format($$select app.apply_rescue(%L, %L, '2026-09-06', 'free', null, '2026-09-07 03:00+03')$$, :'fd', :'ch_fb'),
  'the free rescue is accepted');
select is(app.user_streak(:'fd', '2026-09-07 03:00+03'), 6, 'after the rescue the overall streak is back (6)');

-- ================================================================================================
-- 3. Finalization: late joiners can finish; results wait until nobody can change theirs
-- ================================================================================================

select pg_temp.mk_user('fin_owner') as fo \gset
select pg_temp.mk_user('fin_late') as fl \gset
select pg_temp.mk_user('fin_friend') as ff \gset
select pg_temp.befriend(:'fl', :'ff') as _x \gset
select pg_temp.mk_ch('Bitiş', '2026-09-01', 7, 'check', :'fo') as ch_fin \gset
select pg_temp.add_member(:'ch_fin', :'fo', '2026-09-01', 'owner') + pg_temp.add_member(:'ch_fin', :'fl', '2026-09-03') as _x \gset
select pg_temp.ci(:'fo', :'ch_fin', '2026-09-01', '2026-09-07') + pg_temp.ci(:'fl', :'ch_fin', '2026-09-03', '2026-09-07') as _x \gset

select ok(not app.finalize_member(:'fl', :'ch_fin', '2026-09-08 01:59+03'), 'no result before the last day closes');
select ok(app.finalize_member(:'fl', :'ch_fin', '2026-09-08 03:00+03'), 'the late joiner is finalized after the close');
select results_eq(
  format($$select final_days_done::int, final_required_days::int, final_rank::int
           from public.challenge_members where challenge_id = %L and user_id = %L$$, :'ch_fin', :'fl'),
  $$values (5, 5, 2)$$, 'late joiner: 5 of her 5 days, ranked after the member with 7');
select results_eq(
  format($$select required_days, stage::text from app.completed_challenges(%L)$$, :'fl'),
  $$values (5, 'filiz'::text)$$, 'the late joiner finished: a garden plant sized by her own days');
select is((select count(*)::int from public.notifications
           where recipient_id = :'ff' and kind = 'friend_finished_challenge' and actor_id = :'fl'), 1,
          'her friend is told she finished');
select ok(app.finalize_member(:'fo', :'ch_fin', '2026-09-08 03:00+03'), 'the owner is finalized too');
select is((select final_rank::int from public.challenge_members where challenge_id = :'ch_fin' and user_id = :'fo'), 1,
          'ranks are consistent: owner 1st');

select tests.authenticate_as('fin_owner');
select throws_ok(format($$select public.leave_challenge(%L)$$, :'ch_fin'),
  'P0001', 'Bu challenge bitti', 'a challenge past its last day cannot be left (the result stays)');
reset role;

-- Another member still has a pending rescue for the last day -> nobody is ranked yet
select pg_temp.mk_user('wait_a') as wa \gset
select pg_temp.mk_user('wait_b') as wb \gset
select pg_temp.mk_ch('Bekle', '2026-09-01', 7) as ch_wait \gset
select pg_temp.add_member(:'ch_wait', :'wa', '2026-09-01') + pg_temp.add_member(:'ch_wait', :'wb', '2026-09-01') as _x \gset
select pg_temp.ci(:'wa', :'ch_wait', '2026-09-01', '2026-09-07') + pg_temp.ci(:'wb', :'ch_wait', '2026-09-01', '2026-09-06') as _x \gset
select ok(not app.finalize_member(:'wa', :'ch_wait', '2026-09-08 03:00+03'),
          'a complete member waits while another can still rescue the last day');
select ok(app.finalize_member(:'wa', :'ch_wait', '2026-09-09 02:00+03'),
          'once the rescue window has passed the result is taken');

-- A far-west member joins on her own last day after someone was already finalized: when the last
-- active member is finalized all ranks are rewritten, so nobody shares 1st place
select pg_temp.mk_user('rank_a') as rka \gset
select pg_temp.mk_user('rank_d', 'Pacific/Pago_Pago') as rkd \gset
select pg_temp.mk_ch('Sıra', '2026-09-01', 3) as ch_rank \gset
select pg_temp.add_member(:'ch_rank', :'rka', '2026-09-01') as _x \gset
select ok(app.finalize_member(:'rka', :'ch_rank', '2026-09-04 03:00+03'), 'the only member (0 days) is finalized');
insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on)
values (:'ch_rank', :'rkd', 'active', '2026-09-04 00:30+00', '2026-09-03');
select pg_temp.ci(:'rkd', :'ch_rank', '2026-09-03', '2026-09-03') as _x \gset
select ok(app.finalize_member(:'rkd', :'ch_rank', '2026-09-04 14:00+00'), 'the late joiner is finalized after her own close');
select results_eq(
  format($$select user_id, final_rank::int from public.challenge_members where challenge_id = %L order by final_rank$$, :'ch_rank'),
  format($$values (%L::uuid, 1), (%L::uuid, 2)$$, :'rkd', :'rka'),
  'ranks are rewritten from the saved results: no shared 1st place');

-- ================================================================================================
-- 4. Friend requests: at most 3 per pair in 24 hours (cancel + resend included)
-- ================================================================================================

select pg_temp.mk_user('req_a') as ra \gset
select pg_temp.mk_user('req_b') as rb \gset
select tests.authenticate_as('req_a');
select lives_ok(format($$select public.send_friend_request(%L)$$, :'rb'), 'request 1');
delete from public.friendships where requester_id = :'ra';
select lives_ok(format($$select public.send_friend_request(%L)$$, :'rb'), 'request 2 after cancelling');
delete from public.friendships where requester_id = :'ra';
select lives_ok(format($$select public.send_friend_request(%L)$$, :'rb'), 'request 3 after cancelling');
delete from public.friendships where requester_id = :'ra';
select throws_ok(format($$select public.send_friend_request(%L)$$, :'rb'),
  'P0001', 'Bu kişiye bugün yeterince istek gönderdin', 'a 4th request within 24 hours is refused');
reset role;
select is((select count(*)::int from app.friend_request_log where requester_id = :'ra' and addressee_id = :'rb'), 3,
          'the log keeps the 3 requests although they were cancelled');

-- ================================================================================================
-- 5. Reports: a block does not stop a report, invite links can be reported, evidence is kept
-- ================================================================================================

select pg_temp.mk_user('rep_victim') as rv \gset
select pg_temp.mk_user('rep_harasser') as rh \gset
select pg_temp.befriend(:'rv', :'rh') as _x \gset
insert into public.blocks (blocker_id, blocked_id) values (:'rh', :'rv');
select tests.authenticate_as('rep_victim');
select lives_ok(format($$select public.submit_report(%L, 'harassment', 'laf soktu', false)$$, :'rh'),
  'the victim can report the harasser who blocked her first');
reset role;
select is((select evidence ->> 'username' from public.reports where reported_user_id = :'rh'), 'rep_harasser',
          'a user report keeps a snapshot of the profile');

select pg_temp.mk_user('rep_inviter') as ri \gset
select pg_temp.mk_user('rep_stranger') as rs \gset
select id as ch_rep from app.do_create_challenge(:'ri', null, 'Tehlikeli', 'check', 7, null, null, 'Gel', null, null, 0,
                                                 null, null, '{}', now()) \gset
insert into public.challenge_invites (code, challenge_id, inviter_id) values ('RepCode123', :'ch_rep', :'ri');
select tests.authenticate_as('rep_stranger');
select throws_ok(format($$select public.submit_report(%L, 'dangerous_challenge', null, false, 'challenge', null, %L)$$, :'ri', :'ch_rep'),
  'P0002', 'Challenge bulunamadı', 'without the invite code a stranger cannot report the challenge');
select lives_ok(format($$select public.submit_report(%L, 'dangerous_challenge', null, false, 'challenge', null, %L, 'RepCode123')$$, :'ri', :'ch_rep'),
  'with the invite code (InviteLanding) the challenge can be reported');
reset role;
select results_eq(
  format($$select target_type::text, challenge_id, evidence ->> 'title' from public.reports where reporter_id = %L$$, :'rs'),
  format($$values ('challenge'::text, %L::uuid, 'Tehlikeli'::text)$$, :'ch_rep'),
  'the challenge report keeps the title as it was');

-- Photo evidence survives undo and cannot be deleted from storage while the report is open
select pg_temp.mk_user('rep_m1') as m1 \gset
select pg_temp.mk_user('rep_m2') as m2 \gset
select pg_temp.mk_ch('Kanıt', :'today'::date - 1, 7, 'photo') as ch_ph \gset
select pg_temp.add_member(:'ch_ph', :'m1', :'today'::date - 1) + pg_temp.add_member(:'ch_ph', :'m2', :'today'::date - 1) as _x \gset
select :'m2' || '/' || :'ch_ph' || '/bugun.jpg' as m2_path \gset
select tests.authenticate_as('rep_m2');
insert into storage.objects (bucket_id, name, owner_id) values ('proofs', :'m2_path', auth.uid()::text);
select id as m2_checkin from public.checkin(:'ch_ph', p_photo_path => :'m2_path') \gset
select tests.authenticate_as('rep_m1');
select results_eq($$select name from storage.objects where bucket_id = 'proofs'$$, array[:'m2_path'],
                  'a group member sees the photo of the check-in');
select lives_ok(format($$select public.submit_report(%L, 'inappropriate_photo', null, false, 'photo', %L)$$, :'m2', :'m2_checkin'),
  'the photo is reported');
select tests.authenticate_as('rep_m2');
select ok(public.undo_checkin(:'ch_ph'), 'the reported user undoes today''s check-in');
select is_empty(format($$delete from storage.objects where name = %L returning 1$$, :'m2_path'),
  'but cannot delete the reported photo while the report is open');
reset role;
select is((select evidence ->> 'photo_path' from public.reports where reporter_id = :'m1'), :'m2_path',
          'the report still points to the photo');

-- A photo is the proof of one day only
select pg_temp.mk_user('photo_u') as phu \gset
select pg_temp.mk_ch('Foto', '2026-09-01', 7, 'photo') as ch_pu \gset
select pg_temp.add_member(:'ch_pu', :'phu', '2026-09-01') as _x \gset
select :'phu' || '/' || :'ch_pu' || '/gun1.jpg' as pu_path \gset
insert into storage.objects (bucket_id, name, owner_id) values ('proofs', :'pu_path', :'phu');
select lives_ok(format($$select app.do_checkin(%L, %L, null, %L, null, null, '2026-09-01 20:00+03')$$, :'phu', :'ch_pu', :'pu_path'),
  'day 1 is checked in with the photo');
select lives_ok(format($$select app.do_checkin(%L, %L, null, %L, 'düzeltme', null, '2026-09-01 21:00+03')$$, :'phu', :'ch_pu', :'pu_path'),
  're-sending the same day with the same photo is fine');
select throws_ok(format($$select app.do_checkin(%L, %L, null, %L, null, null, '2026-09-02 20:00+03')$$, :'phu', :'ch_pu', :'pu_path'),
  '22023', 'Bu fotoğraf başka bir gün için gönderildi', 'the same photo cannot prove another day');

-- ================================================================================================
-- 6. Diken push: at most 2 per local day (counted when pushed), never in quiet hours, atomic claim
-- ================================================================================================

select pg_temp.mk_user('diken_u') as dk \gset
insert into public.notifications (recipient_id, kind, local_date)
select :'dk', 'daily_reminder', '2026-09-10' from generate_series(1, 6);
select array_agg(id order by id) as dn from public.notifications where recipient_id = :'dk' \gset
select ok(app.claim_diken_push((:'dn'::uuid[])[1], '2026-09-10 10:00+03'), 'first push of the day is allowed');
select ok(not app.claim_diken_push((:'dn'::uuid[])[1], '2026-09-10 10:05+03'), 'the same notification cannot be pushed twice');
select ok(app.claim_diken_push((:'dn'::uuid[])[2], '2026-09-10 12:00+03'), 'second push of the day is allowed');
select ok(not app.claim_diken_push((:'dn'::uuid[])[3], '2026-09-10 21:00+03'), 'a third push the same day is refused');
select ok(not app.can_send_diken_push(:'dk', '2026-09-10 21:00+03'), 'the read-only check agrees');
select ok(not app.claim_diken_push((:'dn'::uuid[])[3], '2026-09-11 07:59+03'), 'quiet hours (before 08:00) refuse');
select ok(not app.claim_diken_push((:'dn'::uuid[])[3], '2026-09-10 23:30+03'), 'quiet hours (from 23:30) refuse');
select ok(app.claim_diken_push((:'dn'::uuid[])[3], '2026-09-11 09:00+03'),
          'a message created yesterday and pushed today counts for today');
select ok(app.claim_diken_push((:'dn'::uuid[])[4], '2026-09-11 12:00+03'), 'second push on the new day');
select ok(not app.claim_diken_push((:'dn'::uuid[])[5], '2026-09-11 13:00+03'), 'third push on the new day is refused');
select is((select count(*)::int from public.notifications where recipient_id = :'dk' and pushed_at is not null), 4,
          'exactly the claimed notifications are marked pushed');

-- ================================================================================================
-- 7. At most 20 running challenges per user
-- ================================================================================================

select pg_temp.mk_user('cap_u') as cu \gset
with chs as (
  insert into public.challenges (title, task_type, duration_days, start_date)
  select 'Dolu ' || g, 'check', 7, :'today'::date from generate_series(1, 20) g
  returning id
)
insert into public.challenge_members (challenge_id, user_id, role, status, joined_at, joined_on)
select chs.id, :'cu', 'owner', 'active', now(), :'today'::date from chs;
select tests.authenticate_as('cap_u');
select throws_ok($$select public.create_challenge(p_title => 'Bir tane daha', p_task_type => 'check', p_duration_days => 7)$$,
  'P0001', 'Aynı anda en fazla 20 challenge sürdürebilirsin', 'the 21st running challenge is refused');
reset role;
update public.challenges set start_date = :'today'::date - 30
where id = (select challenge_id from public.challenge_members where user_id = :'cu' limit 1);
select tests.authenticate_as('cap_u');
select lives_ok($$select public.create_challenge(p_title => 'Bir tane daha', p_task_type => 'check', p_duration_days => 7)$$,
  'an ended challenge does not count');
reset role;

-- ================================================================================================
-- 8. Friend profile and recent days
-- ================================================================================================

select pg_temp.mk_user('fp_a') as fa \gset
select pg_temp.mk_user('fp_b') as fb \gset
select pg_temp.mk_user('fp_c') as fc \gset
select pg_temp.befriend(:'fa', :'fb') as _x \gset
select pg_temp.mk_ch('Ortak', :'today'::date - 2, 10) as ch_fp \gset
select pg_temp.add_member(:'ch_fp', :'fa', :'today'::date - 2) + pg_temp.add_member(:'ch_fp', :'fb', :'today'::date - 2) as _x \gset
select pg_temp.ci(:'fb', :'ch_fp', :'today'::date - 2, :'today'::date - 1) as _x \gset
select tests.authenticate_as('fp_a');
select results_eq(
  format($$select (j ->> 'is_friend')::boolean, (j ->> 'streak')::int, (j ->> 'completed_count')::int,
                  jsonb_array_length(j -> 'shared_challenges'), (j -> 'shared_challenges' -> 0 ->> 'days_done')::int,
                  (j -> 'shared_challenges' -> 0 ->> 'day_index')::int
           from public.friend_profile(%L) as j$$, :'fb'),
  $$values (true, 2, 0, 1, 2, 3)$$, 'friend profile: friend, 2-day streak, one shared challenge on day 3 with 2 done');
select tests.authenticate_as('fp_c');
select is(public.friend_profile(:'fb'), null, 'a stranger gets nothing');
select tests.authenticate_as('fp_b');
select results_eq(
  $$select count(*)::int, max(day), bool_and(required = 1), sum(covered)::int from public.my_recent_days()$$,
  format($$values (3, %L::date, true, 2)$$, :'today'),
  'recent days: one row per day since the first challenge day, up to today');
insert into public.blocks (blocker_id, blocked_id) values (:'fb', :'fa');
select tests.authenticate_as('fp_a');
select is(public.friend_profile(:'fb'), null, 'after a block there is no profile');
reset role;

-- ================================================================================================
-- 9. Invite links: idempotent create, the owner can revoke any member's link
-- ================================================================================================

select pg_temp.mk_user('inv_o') as io \gset
select pg_temp.mk_user('inv_m') as im \gset
select pg_temp.mk_user('inv_n') as inn \gset
select id as ch_inv from app.do_create_challenge(:'io', null, 'Linkler', 'check', 7, null, null, null, null, null, 0,
                                                 null, null, '{}', now()) \gset
select pg_temp.add_member(:'ch_inv', :'im', :'today') + pg_temp.add_member(:'ch_inv', :'inn', :'today') as _x \gset
select tests.authenticate_as('inv_m');
select public.create_invite(:'ch_inv') as code_m \gset
select is(public.create_invite(:'ch_inv'), :'code_m', 'create_invite returns the same open link');
select tests.authenticate_as('inv_n');
select throws_ok(format($$select public.revoke_invite(%L, %L)$$, :'ch_inv', :'code_m'),
  'P0002', 'Davet linki bulunamadı', 'a member cannot revoke another member''s link');
select tests.authenticate_as('inv_o');
select lives_ok(format($$select public.revoke_invite(%L, %L)$$, :'ch_inv', :'code_m'), 'the owner can');
reset role;
select isnt((select revoked_at from public.challenge_invites where code = :'code_m'), null, 'the link is revoked');

-- ================================================================================================
-- 10. Account deletion (in-app, mandatory): nothing blocks it, history stays consistent
-- ================================================================================================

select pg_temp.mk_user('del_owner') as dow \gset
select pg_temp.mk_user('del_member') as dme \gset
select pg_temp.befriend(:'dow', :'dme') as _x \gset
select id as ch_del from app.do_create_challenge(:'dow', null, 'Silinecek', 'check', 7, null, null, null, null, null, 0,
                                                 null, null, '{}', now() - interval '1 day') \gset
select pg_temp.add_member(:'ch_del', :'dme', :'today'::date - 1) as _x \gset
select pg_temp.ci(:'dow', :'ch_del', :'today'::date - 1, :'today'::date)
     + pg_temp.ci(:'dme', :'ch_del', :'today'::date - 1, :'today'::date) as _x \gset
insert into public.pokes (sender_id, recipient_id, tone, message_key) values (:'dow', :'dme', 'hype', 'almost_there');
insert into public.reports (reporter_id, reported_user_id, reason) values (:'dme', :'dow', 'other');
insert into app.friend_request_log (requester_id, addressee_id) values (:'dow', :'dme');
select lives_ok(format($$delete from auth.users where id = %L$$, :'dow'), 'deleting the owner account succeeds');
select results_eq(
  format($$select user_id, role::text from public.challenge_members where challenge_id = %L$$, :'ch_del'),
  format($$values (%L::uuid, 'owner'::text)$$, :'dme'),
  'the challenge continues with the remaining member as owner');
select results_eq(
  format($$select reporter_id, reported_user_id from public.reports where reporter_id = %L$$, :'dme'),
  format($$values (%L::uuid, null::uuid)$$, :'dme'),
  'reports stay for moderation with the deleted user anonymized');
select lives_ok(format($$delete from auth.users where id = %L$$, :'dme'), 'deleting the last member succeeds');
select is_empty(format($$select 1 from public.challenges where id = %L$$, :'ch_del'),
  'a challenge with no members left at all is deleted');

-- ================================================================================================
-- 11. Second review: blocks, reports, invites, display names, rescue chains
-- ================================================================================================

-- Blocking a random uuid does not open the profile; blocking back does not undo someone's block
select pg_temp.mk_user('blk_eve') as be \gset
select pg_temp.mk_user('blk_bob') as bb \gset
update public.user_settings set discoverability = 'nobody' where user_id = :'bb';
select tests.authenticate_as('blk_eve');
select lives_ok(format($$insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), %L)$$, :'bb'),
  'any user can be blocked');
select is_empty(format($$select 1 from public.profiles where id = %L$$, :'bb'),
  'blocking a stranger who is not discoverable does not reveal the profile');
reset role;
select pg_temp.mk_user('blk_alice') as bal \gset
select pg_temp.befriend(:'bal', :'bb') as _x \gset
insert into public.blocks (blocker_id, blocked_id) values (:'bb', :'bal');
select tests.authenticate_as('blk_alice');
select lives_ok(format($$insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), %L)$$, :'bb'),
  'the blocked friend blocks back');
select is_empty(format($$select 1 from public.profiles where id = %L$$, :'bb'),
  'blocking back does not bring the blocker''s profile back');
select tests.authenticate_as('blk_bob');
select is_empty(format($$select 1 from public.profiles where id = %L$$, :'bal'),
  'after a mutual block neither side sees the other''s profile');
select isnt_empty(format($$select 1 from public.blocks where blocked_id = %L$$, :'bal'),
  'the block stays in the blocked users list (it can still be lifted)');
reset role;

-- A pending friend request shows the profile row, not the activity
select pg_temp.mk_user('pend_x') as px \gset
select pg_temp.mk_user('pend_y') as py \gset
insert into public.friendships (requester_id, addressee_id) values (:'px', :'py');
select tests.authenticate_as('pend_x');
select is(public.friend_profile(:'py'), null, 'friend_profile: nothing for a pending requester');
reset role;

-- Reports: one open report per target (repeat returns it), at most 10 new ones in 24 hours
select id as rs_report from public.reports where reporter_id = :'rs' \gset
select tests.authenticate_as('rep_stranger');
select is(public.submit_report(null, 'dangerous_challenge', null, false, 'challenge', null, null, 'RepCode123'),
          :'rs_report'::uuid,
  'the invite code alone identifies challenge and inviter; a repeat returns the open report');
reset role;
select pg_temp.mk_user('rep_spam') as rsp \gset
select array_agg(pg_temp.mk_user('rep_t' || g) order by g) as rts from generate_series(1, 11) g \gset
select tests.authenticate_as('rep_spam');
select is((select count(*)::int from unnest(:'rts'::uuid[]) with ordinality as t(u, n)
           where n <= 10 and public.submit_report(t.u, 'spam_or_fake', null, false) is not null), 10,
  '10 reports in a day are accepted');
select throws_ok(format($$select public.submit_report(%L, 'spam_or_fake', null, false)$$, (:'rts'::uuid[])[11]),
  'P0001', 'Bugün çok fazla şikayet gönderdin', 'the 11th new report in 24 hours is refused');
reset role;

-- A declined invite can be repeated at most 3 times a day per challenge
select pg_temp.mk_user('rinv_o') as ro \gset
select pg_temp.mk_user('rinv_f') as rf \gset
select pg_temp.befriend(:'ro', :'rf') as _x \gset
select id as ch_ri from app.do_create_challenge(:'ro', null, 'Davet', 'check', 7, null, null, null, null, null, 0,
                                                null, null, '{}', now()) \gset
select is(app.do_invite(:'ro', :'ch_ri', array[:'rf']::uuid[], now())
          + (select 0 from app.do_respond_to_invite(:'rf', :'ch_ri', false, now()))
          + app.do_invite(:'ro', :'ch_ri', array[:'rf']::uuid[], now())
          + (select 0 from app.do_respond_to_invite(:'rf', :'ch_ri', false, now()))
          + app.do_invite(:'ro', :'ch_ri', array[:'rf']::uuid[], now())
          + (select 0 from app.do_respond_to_invite(:'rf', :'ch_ri', false, now())), 3,
  'invite, decline, re-invite twice: 3 invites');
select is(app.do_invite(:'ro', :'ch_ri', array[:'rf']::uuid[], now()), 0, 'a 4th invite the same day is skipped');

-- Deleting the reported account removes personal data from the evidence
delete from auth.users where id = :'m2';
select results_eq(
  format($$select reported_user_id, evidence ? 'photo_path', evidence ? 'note', evidence ? 'local_date'
           from public.reports where reporter_id = %L and target_type = 'photo'$$, :'m1'),
  $$values (null::uuid, false, false, true)$$,
  'after the reported user deleted the account: no identity, no photo path or note, the day stays');

-- Display names cannot pass for the mascot, the brand or support
select tests.create_supabase_user('fake_support') as fs \gset
select tests.authenticate_as('fake_support');
select throws_ok($$select public.complete_profile('gazla.fan', 'Gazla Destek', 1995)$$,
  '23514', 'Bu görünen ad kullanılamaz', '"Gazla Destek" is refused as a display name');
select lives_ok($$select public.complete_profile('diken.ali', 'Diken Ali', 1995)$$, '"Diken Ali" is a normal name');
select throws_ok($$update public.profiles set display_name = 'D İ K E N' where id = auth.uid()$$,
  '23514', 'Bu görünen ad kullanılamaz', 'spacing and Turkish letters do not get around it');
reset role;

-- A rescued day cannot be followed by another rescue (no completing a challenge with ads alone)
select pg_temp.mk_user('chain_u') as chu \gset
select pg_temp.mk_ch('Zincir', '2026-09-01', 30) as ch_chain \gset
select pg_temp.add_member(:'ch_chain', :'chu', '2026-09-01') as _x \gset
select pg_temp.ci(:'chu', :'ch_chain', '2026-09-01', '2026-09-04') as _x \gset
select lives_ok(format($$select app.apply_rescue(%L, %L, '2026-09-05', 'ad', 'reward-chain-1', '2026-09-06 03:00+03')$$,
                       :'chu', :'ch_chain'), 'the first missed day is rescued with an ad');
select is_empty(format($$select 1 from app.pending_rescues(%L, '2026-09-07 03:00+03')$$, :'chu'),
  'the next missed day is not offered: a rescued day cannot be chained');

-- ================================================================================================
-- 12. Second review: orphans, client numbers, file names, the 2-hour grace in Today
-- ================================================================================================

-- The last remaining (left) member deletes the account -> the ownerless challenge goes too
select pg_temp.mk_user('orph_a') as ora \gset
select id as ch_orph from app.do_create_challenge(:'ora', null, 'Yetim', 'check', 7, null, null, null, null, null, 0,
                                                  null, null, '{}', now()) \gset
select app.do_leave_challenge(:'ora', :'ch_orph', now()) as _l \gset
select isnt_empty(format($$select 1 from public.challenges where id = %L$$, :'ch_orph'),
  'after the only member left, the challenge stays for history');
delete from auth.users where id = :'ora';
select is_empty(format($$select 1 from public.challenges where id = %L$$, :'ch_orph'),
  'when that member deletes the account, the challenge with no members is deleted');

-- JavaScript float noise is rounded, not rejected
select pg_temp.mk_user('num_u') as nu \gset
select tests.authenticate_as('num_u');
select id as ch_numf from public.create_challenge(p_title => 'Koşu', p_task_type => 'number', p_duration_days => 7,
  p_number_unit => 'km', p_number_base_target => 0.30000000000000004, p_number_step => 0.1) \gset
select is((select value from public.checkin(:'ch_numf', p_value => 0.30000000000000004)), 0.3::numeric,
  'a value like 0.1 + 0.2 from the app is stored as 0.3');
reset role;
select is((select number_base_target from public.challenges where id = :'ch_numf'), 0.3::numeric,
  'challenge number settings are rounded the same way');

-- Upload names the check-in would reject are refused at upload time
select tests.authenticate_as('num_u');
select throws_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('proofs', %L, auth.uid()::text)$$,
                        :'nu' || '/' || :'ch_numf' || '/fotoğraf (1).jpg'),
  '42501', null, 'a proof named like a gallery file is refused (the app generates the name)');
select throws_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('avatars', %L, auth.uid()::text)$$,
                        :'nu' || '/klasör/ben.jpg'),
  '42501', null, 'an avatar in a sub-folder is refused');
reset role;

-- Inside the 2-hour grace, Today lists yesterday's still-open tasks too
select pg_temp.mk_user('grace_u') as gu \gset
select pg_temp.mk_ch('Gece', '2026-09-01', 30) as ch_grace \gset
select pg_temp.add_member(:'ch_grace', :'gu', '2026-09-01') as _x \gset
select results_eq(
  format($$select local_date, done from app.today_tasks(%L, '2026-09-11 01:00+03')$$, :'gu'),
  $$values ('2026-09-11'::date, false), ('2026-09-10'::date, false)$$,
  'at 01:00 both today and yesterday are listed (yesterday can still be checked in)');
select results_eq(
  format($$select local_date from app.today_tasks(%L, '2026-09-11 02:00+03')$$, :'gu'),
  $$values ('2026-09-11'::date)$$,
  'from 02:00 only today');

select * from finish();
rollback;
