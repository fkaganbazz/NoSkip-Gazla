-- pgTAP: data the screens need (Madde 2) — poke quota, personal reminder time, "friends" visibility
-- and joining without an invitation, day-end grace 0/1/2 h, badges, declining a rescue,
-- NumberEntry stats, the "finished" screen once, challenge status / day index, mutual friends,
-- short titles in friends_today, template popularity.
--
-- Time is driven through the p_at parameter of the app.* functions (run as postgres); now()-based
-- RPCs get data built relative to now(). Everything is rolled back.
--
-- Run:  supabase test db   (or the local testbed: ./test.sh supabase/tests/06_screen_data.test.sql)
begin;
select plan(136);
-- This file tests behaviour, not privileges (01_rls_privileges does).
grant execute on all functions in schema app to authenticated;

create function pg_temp.mk_user(p_ident text, p_grace integer default 2, p_tz text default 'Europe/Istanbul')
returns uuid
language plpgsql as $$
declare
  v uuid := tests.create_supabase_user(p_ident);
begin
  insert into public.profiles (id, username, display_name) values (v, p_ident, initcap(p_ident));
  insert into public.user_settings (user_id, birth_year, timezone, day_end_grace_hours)
  values (v, 1995, p_tz, p_grace);
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
                                   p_role public.member_role default 'member',
                                   p_joined_at timestamptz default null) returns integer
language sql as $$
  insert into public.challenge_members (challenge_id, user_id, role, status, joined_at, joined_on)
  values (p_ch, p_user, p_role, 'active', coalesce(p_joined_at, p_joined_on::timestamptz), p_joined_on)
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

create function pg_temp.has_badge(p_user uuid, p_key text) returns boolean
language sql as $$
  select exists (select 1 from public.user_badges b where b.user_id = p_user and b.badge_key = p_key)
$$;

select app.local_date(tests.create_supabase_user('clock'), now()) as today \gset

-- ================================================================================================
-- 1. Poke quota (poke_status): sent today and remaining, harsh mode
-- ================================================================================================

select pg_temp.mk_user('p_ali') as ali \gset
select pg_temp.mk_user('p_ayse') as ayse \gset
select pg_temp.mk_user('p_bul') as bul \gset
select pg_temp.mk_user('p_cem') as cem \gset
select pg_temp.mk_user('p_dun') as dun \gset
update public.profiles set harsh_mode = true where id = :'ayse';
select pg_temp.befriend(:'ali', :'ayse') as _x \gset
select pg_temp.befriend(:'ali', :'dun') as _x \gset
insert into public.blocks (blocker_id, blocked_id) values (:'ali', :'dun');
select pg_temp.mk_ch('Dürt grubu', :'today'::date - 1, 10) as ch_p \gset
select pg_temp.add_member(:'ch_p', :'ali', :'today'::date - 1) as _x \gset
select pg_temp.add_member(:'ch_p', :'cem', :'today'::date - 1) as _x \gset

select tests.authenticate_as('p_ali');
select results_eq(format($$select harsh_mode, sent_today, daily_limit, remaining from public.poke_status(%L)$$, :'ayse'),
  $$values (true, 0, 3, 3)$$, 'poke_status: nothing sent today yet, the friend''s harsh mode is on');
select (public.send_poke(:'ayse', 'roast', 'cactus_faster')).id as pk1 \gset
select lives_ok(format($$select public.send_poke(%L, 'hype', 'almost_there')$$, :'ayse'), 'second poke of the day');
select results_eq(format($$select sent_today, remaining from public.poke_status(%L)$$, :'ayse'),
  $$values (2, 1)$$, 'poke_status: two sent, one left');
select results_eq(format($$delete from public.pokes where id = %L returning 1$$, :'pk1'), $$values (1)$$,
  'the first poke is undone within 30 seconds');
select results_eq(format($$select sent_today, remaining from public.poke_status(%L)$$, :'ayse'),
  $$values (2, 1)$$, 'poke_status: an undone poke still counts (like send_poke)');
select lives_ok(format($$select public.send_poke(%L, 'hype', 'take_five')$$, :'ayse'), 'third poke of the day');
select results_eq(format($$select sent_today, remaining from public.poke_status(%L)$$, :'ayse'),
  $$values (3, 0)$$, 'poke_status: limit reached, nothing left (the send button is disabled)');
select results_eq(format($$select harsh_mode, sent_today, remaining from public.poke_status(%L)$$, :'cem'),
  $$values (false, 0, 3)$$, 'poke_status: an active co-member of a running challenge (not a friend)');
select throws_ok(format($$select * from public.poke_status(%L)$$, :'bul'),
  'P0001', 'Bu kişiyi dürtemezsin', 'poke_status: not for a stranger');
select throws_ok(format($$select * from public.poke_status(%L)$$, :'dun'),
  'P0001', 'Bu kişiyi dürtemezsin', 'poke_status: not for a blocked user (same answer as a stranger)');
select throws_ok($$select * from public.poke_status(auth.uid())$$,
  'P0001', 'Kendini dürtemezsin', 'poke_status: not for yourself');
reset role;

-- ================================================================================================
-- 2. Personal reminder time (set_my_reminder, my_membership)
-- ================================================================================================

select pg_temp.mk_ch('Hatırlatma', :'today', 7) as ch_r \gset
update public.challenges set reminder_time = '21:00' where id = :'ch_r';
select pg_temp.add_member(:'ch_r', :'ali', :'today') as _x \gset
insert into public.challenge_members (challenge_id, user_id, status, invited_by) values (:'ch_r', :'ayse', 'invited', :'ali');

select tests.authenticate_as('p_ali');
select results_eq(format($$select m ->> 'reminder_time', m ->> 'personal_reminder_time' from public.my_membership(%L) m$$, :'ch_r'),
  $$values ('21:00:00'::text, null::text)$$, 'my_membership: without a personal time the group time applies');
select is(public.set_my_reminder(:'ch_r', '07:30') ->> 'reminder_time', '07:30:00',
  'set_my_reminder: the personal time becomes the effective reminder');
select is(public.my_membership(:'ch_r') ->> 'personal_reminder_time', '07:30:00', 'my_membership: personal time');
reset role;
select is(app.member_reminder_time(:'ali', :'ch_r'), '07:30'::time, 'the reminder job reads the personal time');
select tests.authenticate_as('p_ali');
select results_eq(format($$select m ->> 'reminder_time', m ->> 'personal_reminder_time' from public.set_my_reminder(%L, null) m$$, :'ch_r'),
  $$values ('21:00:00'::text, null::text)$$, 'set_my_reminder(null): back to the group time');
select tests.authenticate_as('p_ayse');
select throws_ok(format($$select public.set_my_reminder(%L, '08:00')$$, :'ch_r'),
  '42501', 'Bu challenge''da değilsin', 'set_my_reminder: an invited (not active) member cannot set one');
select tests.authenticate_as('p_bul');
select throws_ok(format($$select public.set_my_reminder(%L, '08:00')$$, :'ch_r'),
  '42501', 'Bu challenge''da değilsin', 'set_my_reminder: a stranger cannot set one');
select is(public.my_membership(:'ch_r'), null, 'my_membership: null for a non-member');
reset role;

-- ================================================================================================
-- 3. Visibility "friends": read, friend_profile.joinable_challenges, join_friend_challenge
-- ================================================================================================

select pg_temp.mk_user('v_fatma') as fatma \gset
select pg_temp.mk_user('v_gul') as gul \gset
select pg_temp.mk_user('v_hakan') as hakan \gset
select pg_temp.mk_user('v_ilk') as ilk \gset
select pg_temp.mk_user('v_jale') as jale \gset
select pg_temp.mk_user('v_kemal') as kemal \gset
select pg_temp.befriend(:'fatma', :'gul') as _x \gset
select pg_temp.befriend(:'ilk', :'fatma') as _x \gset
select pg_temp.befriend(:'fatma', :'jale') as _x \gset

select tests.authenticate_as('v_fatma');
select (public.create_challenge(p_title => 'Arkadaşlara açık', p_task_type => 'check', p_duration_days => 7,
                                p_visibility => 'friends')).id as ch_f \gset
select (public.create_challenge(p_title => 'Sadece davetli', p_task_type => 'check', p_duration_days => 7)).id as ch_i \gset
select results_eq(format($$select visibility::text from public.challenges where id in (%L, %L) order by title$$, :'ch_f', :'ch_i'),
  array['friends', 'invited'], 'create_challenge stores the visibility (default: invited only)');
reset role;
select pg_temp.add_member(:'ch_i', :'hakan', :'today') as _x \gset

select tests.authenticate_as('v_gul');
select results_eq(
  format($$select e ->> 'challenge_id', e ->> 'title', (e ->> 'member_count')::int, (e ->> 'day_index')::int
           from jsonb_array_elements(public.friend_profile(%L) -> 'joinable_challenges') e$$, :'fatma'),
  format($$values (%L::text, 'Arkadaşlara açık'::text, 1, 1)$$, :'ch_f'),
  'friend_profile: the friend''s "friends" challenge is joinable (not her invite-only one)');
select is((public.challenge_detail(:'ch_f') ->> 'status'), 'active', 'challenge_detail works before joining');
select is((public.join_friend_challenge(:'ch_f')).status::text, 'active',
  'join_friend_challenge: a friend of the creator joins without an invitation');
select is(jsonb_array_length(public.friend_profile(:'fatma') -> 'joinable_challenges'), 0,
  'once joined it is no longer listed as joinable');
select is((public.join_friend_challenge(:'ch_f')).status::text, 'active', 'joining again is a no-op');
select throws_ok(format($$select public.join_friend_challenge(%L)$$, :'ch_i'),
  'P0002', 'Challenge bulunamadı', 'join_friend_challenge: an invite-only challenge cannot be joined this way');

select tests.authenticate_as('v_hakan');
select throws_ok(format($$select public.join_friend_challenge(%L)$$, :'ch_f'),
  'P0002', 'Challenge bulunamadı', 'join_friend_challenge: not without being the creator''s friend');
select is(jsonb_array_length(public.friend_profile(:'fatma') -> 'joinable_challenges'), 0,
  'friend_profile: a co-member who is not a friend sees no joinable challenges');

reset role;
insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on, left_on)
values (:'ch_f', :'ilk', 'left', now(), :'today', :'today');
select tests.authenticate_as('v_ilk');
select throws_ok(format($$select public.join_friend_challenge(%L)$$, :'ch_f'),
  'P0001', 'Ayrıldığın challenge''a tekrar katılamazsın', 'join_friend_challenge: leaving is permanent');
select is(jsonb_array_length(public.friend_profile(:'fatma') -> 'joinable_challenges'), 0,
  'friend_profile: a challenge you left is not joinable');

reset role;
create temp table vfill on commit drop as
select pg_temp.mk_user('vfill' || i) as id from generate_series(1, 18) as i;
insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on)
select :'ch_f', f.id, 'active', now(), :'today' from vfill f;
select tests.authenticate_as('v_jale');
select throws_ok(format($$select public.join_friend_challenge(%L)$$, :'ch_f'),
  'P0001', 'Grup dolu', 'join_friend_challenge: at most 20 active members');
select is(jsonb_array_length(public.friend_profile(:'fatma') -> 'joinable_challenges'), 0,
  'friend_profile: a full group is not joinable');

reset role;
select pg_temp.mk_ch('Bitmiş', :'today'::date - 20, 7, 'check', :'fatma') as ch_old \gset
update public.challenges set visibility = 'friends' where id = :'ch_old';
select pg_temp.add_member(:'ch_old', :'fatma', :'today'::date - 20, 'owner') as _x \gset
select tests.authenticate_as('v_jale');
select throws_ok(format($$select public.join_friend_challenge(%L)$$, :'ch_old'),
  'P0001', 'Bu challenge bitti', 'join_friend_challenge: not an ended challenge');

reset role;
select pg_temp.mk_ch('Sahibi ayrıldı', :'today', 7, 'check', :'fatma') as ch_cl \gset
update public.challenges set visibility = 'friends' where id = :'ch_cl';
select pg_temp.add_member(:'ch_cl', :'fatma', :'today', 'owner', now() - interval '1 hour') as _x \gset
select pg_temp.add_member(:'ch_cl', :'kemal', :'today') as _x \gset
update public.challenge_members set status = 'left', left_on = :'today' where challenge_id = :'ch_cl' and user_id = :'fatma';
select tests.authenticate_as('v_jale');
select throws_ok(format($$select public.join_friend_challenge(%L)$$, :'ch_cl'),
  'P0002', 'Challenge bulunamadı', 'join_friend_challenge: not after the creator left');
select is_empty(format($$select 1 from public.challenges where id = %L$$, :'ch_cl'),
  'a friend no longer reads the challenge once its creator left');
reset role;

-- ================================================================================================
-- 4. Day-end grace 0 / 1 / 2 hours (user_settings.day_end_grace_hours)
-- ================================================================================================

select pg_temp.mk_user('g_zero', 0) as gz \gset
select pg_temp.mk_user('g_one', 1) as g1 \gset
select pg_temp.mk_user('g_two') as g2 \gset
select pg_temp.mk_ch('Tolerans', '2026-09-01', 30) as ch_g \gset
select pg_temp.add_member(:'ch_g', :'gz', '2026-09-01') as _x \gset
select pg_temp.add_member(:'ch_g', :'g1', '2026-09-01') as _x \gset
select pg_temp.add_member(:'ch_g', :'g2', '2026-09-01') as _x \gset

select is(app.user_grace_period(:'g2'), interval '2 hours', 'the default grace stays 2 hours');
select is(app.open_dates(:'gz', '2026-09-11 00:30+03'), array['2026-09-11']::date[],
  'grace 0: right after midnight yesterday is already closed');
select is(app.day_closes_at(:'gz', '2026-09-10'), '2026-09-11 00:00+03'::timestamptz,
  'grace 0: a day closes at local midnight');
select is(app.open_dates(:'g1', '2026-09-11 00:30+03'), array['2026-09-11', '2026-09-10']::date[],
  'grace 1: yesterday is still open at 00:30');
select is(app.open_dates(:'g1', '2026-09-11 01:30+03'), array['2026-09-11']::date[],
  'grace 1: yesterday is closed at 01:30');
select is(app.day_closes_at(:'g1', '2026-09-10'), '2026-09-11 01:00+03'::timestamptz,
  'grace 1: a day closes one hour after local midnight');
select is(app.open_dates(:'g2', '2026-09-11 01:30+03'), array['2026-09-11', '2026-09-10']::date[],
  'grace 2: yesterday is still open at 01:30');

select throws_ok(format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-10', '2026-09-11 00:30+03')$$, :'gz', :'ch_g'),
  'P0001', 'Bu gün artık işaretlenemez', 'grace 0: yesterday cannot be checked in after midnight');
select lives_ok(format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-10', '2026-09-11 00:30+03')$$, :'g1', :'ch_g'),
  'grace 1: yesterday can be checked in at 00:30');
select throws_ok(format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-11', '2026-09-12 01:30+03')$$, :'g1', :'ch_g'),
  'P0001', 'Bu gün artık işaretlenemez', 'grace 1: not after the first hour');
select is((select array_agg(local_date order by local_date) from app.today_tasks(:'gz', '2026-09-11 00:30+03')),
  array['2026-09-11']::date[], 'grace 0: Today lists only today''s task after midnight');
select is((select array_agg(local_date order by local_date) from app.today_tasks(:'g1', '2026-09-11 00:30+03')),
  array['2026-09-10', '2026-09-11']::date[], 'grace 1: Today lists yesterday''s task too at 00:30');

-- Streaks: 09-01..09-09 covered, 09-10 missed
select pg_temp.ci(:'gz', :'ch_g', '2026-09-01', '2026-09-09') as _x \gset
select pg_temp.ci(:'g2', :'ch_g', '2026-09-01', '2026-09-09') as _x \gset
select is(app.user_streak(:'gz', '2026-09-11 00:30+03'), 0,
  'grace 0: a missed yesterday breaks the streak right after midnight');
select is(app.user_streak(:'g2', '2026-09-11 00:30+03'), 9,
  'grace 2: the same missed yesterday is still open and does not break it yet');
select results_eq(format($$select missed_date, expires_at from app.pending_rescues(%L, '2026-09-11 00:30+03')$$, :'gz'),
  $$values ('2026-09-10'::date, '2026-09-12 00:00+03'::timestamptz)$$,
  'grace 0: the rescue opens at midnight and lasts 24 hours');
select is_empty(format($$select 1 from app.pending_rescues(%L, '2026-09-11 00:30+03')$$, :'g2'),
  'grace 2: no rescue while yesterday is still open');

-- Raising the grace cannot reopen a day the old setting closed
select pg_temp.mk_user('g_up', 0) as gup \gset
select (now() at time zone 'Europe/Istanbul')::date as ist_today \gset
update public.user_settings set day_end_grace_hours = 2 where user_id = :'gup';
select is((select checkin_floor from public.user_settings where user_id = :'gup'), :'ist_today'::date,
  'raising the grace sets the floor to the earliest day still open under the old setting');
select is(app.checkin_dates(:'gup', app.local_day_start('Europe/Istanbul', :'ist_today') + interval '1 hour'),
  array[:'ist_today']::date[], 'so yesterday (closed with grace 0) stays closed although 2 h would keep it open');

select tests.authenticate_as('g_one');
select results_eq($$update public.user_settings set day_end_grace_hours = 0 returning day_end_grace_hours::int$$,
  array[0], 'the user changes her grace in Settings');
select throws_ok($$update public.user_settings set day_end_grace_hours = 3$$,
  '23514', null, 'the grace is 0, 1 or 2 hours');
reset role;

-- ================================================================================================
-- 5. Badges (rules run on the server, at the moment of the event)
-- ================================================================================================

select results_eq($$select key from public.badges order by sort_order limit 3$$,
  array['ilk_30_gun', 'laf_ustasi', 'erkenci'], 'catalog: the three badges of Garden.dc.html come first');
select results_eq($$select count(*)::int from public.badges where is_active$$, array[12], 'catalog: 12 badges');

-- İlk 30 gün: 29 covered days, then the 30th check-in
select pg_temp.mk_user('b_streak') as bs \gset
select pg_temp.mk_ch('Uzun', '2026-08-01', 60) as ch_long \gset
select pg_temp.add_member(:'ch_long', :'bs', '2026-08-01') as _x \gset
select pg_temp.ci(:'bs', :'ch_long', '2026-08-01', '2026-08-29') as _x \gset
select ok(not pg_temp.has_badge(:'bs', 'ilk_30_gun'), 'İlk 30 gün: not with 29 days');
select lives_ok(format($$select app.do_checkin(%L, %L, null, null, null, null, '2026-08-30 12:00+03')$$, :'bs', :'ch_long'),
  'the 30th day is checked in');
select results_eq(format($$select earned_at from public.user_badges where user_id = %L and badge_key = 'ilk_30_gun'$$, :'bs'),
  $$values ('2026-08-30 12:00+03'::timestamptz)$$, 'İlk 30 gün: earned when the overall streak reaches 30');

-- Yüz gün: 99 days over two challenges, then the 100th
select pg_temp.mk_user('b_hundred') as bh \gset
select pg_temp.mk_ch('Bir', '2026-05-01', 60) as ch_a \gset
select pg_temp.mk_ch('İki', '2026-06-30', 60) as ch_b \gset
select pg_temp.add_member(:'ch_a', :'bh', '2026-05-01') as _x \gset
select pg_temp.add_member(:'ch_b', :'bh', '2026-06-30') as _x \gset
select pg_temp.ci(:'bh', :'ch_a', '2026-05-01', '2026-06-29') as _x \gset
select pg_temp.ci(:'bh', :'ch_b', '2026-06-30', '2026-08-06') as _x \gset
select ok(not pg_temp.has_badge(:'bh', 'yuz_gun'), 'Yüz gün: not with 98 days (written earlier, no live streak)');
select lives_ok(format($$select app.do_checkin(%L, %L, null, null, null, '2026-08-06', '2026-08-07 01:00+03')$$, :'bh', :'ch_b'),
  'a grace re-check of the 98th day changes nothing');
select lives_ok(format($$select app.do_checkin(%L, %L, null, null, null, null, '2026-08-07 12:00+03')$$, :'bh', :'ch_b'),
  'the 99th day');
select ok(not pg_temp.has_badge(:'bh', 'yuz_gun') and pg_temp.has_badge(:'bh', 'ilk_30_gun'),
  'Yüz gün: not at 99 (İlk 30 gün already)');
select lives_ok(format($$select app.do_checkin(%L, %L, null, null, null, null, '2026-08-08 12:00+03')$$, :'bh', :'ch_b'),
  'the 100th day');
select ok(pg_temp.has_badge(:'bh', 'yuz_gun'), 'Yüz gün: earned at an overall streak of 100');

-- Laf ustası (10 roasts) and Gaz pedalı (25 hypes); an undo does not take a badge back
select pg_temp.mk_user('b_poker') as bp \gset
select pg_temp.mk_user('b_target') as bt \gset
insert into public.pokes (sender_id, recipient_id, tone, message_key, created_at)
select :'bp', :'bt', 'roast', 'i_did_it', now() - make_interval(days => i) from generate_series(1, 9) as i;
select ok(not pg_temp.has_badge(:'bp', 'laf_ustasi'), 'Laf ustası: not with 9 roasts');
insert into public.pokes (sender_id, recipient_id, tone, message_key) values (:'bp', :'bt', 'roast', 'i_did_it');
select ok(pg_temp.has_badge(:'bp', 'laf_ustasi'), 'Laf ustası: earned with the 10th roast');
delete from public.pokes where sender_id = :'bp' and created_at > now() - interval '1 minute';
select ok(pg_temp.has_badge(:'bp', 'laf_ustasi'), 'an undone poke does not take the badge back');
insert into public.pokes (sender_id, recipient_id, tone, message_key, created_at)
select :'bp', :'bt', 'hype', 'almost_there', now() - make_interval(days => i) from generate_series(1, 24) as i;
select ok(not pg_temp.has_badge(:'bp', 'gaz_pedali'), 'Gaz pedalı: not with 24 hypes (roasts do not count)');
insert into public.pokes (sender_id, recipient_id, tone, message_key) values (:'bp', :'bt', 'hype', 'almost_there');
select ok(pg_temp.has_badge(:'bp', 'gaz_pedali'), 'Gaz pedalı: earned with the 25th hype');

-- Erkenci: 5 different days checked in between 05:00 and 08:00 local
select pg_temp.mk_user('b_early') as be \gset
select pg_temp.mk_ch('Sabah', '2026-09-01', 30) as ch_e \gset
select pg_temp.add_member(:'ch_e', :'be', '2026-09-01') as _x \gset
insert into public.checkins (user_id, challenge_id, local_date, created_at)
select :'be', :'ch_e', d::date, (d::date + time '06:30') at time zone 'Europe/Istanbul'
from generate_series('2026-09-01'::date, '2026-09-04', interval '1 day') as d;
insert into public.checkins (user_id, challenge_id, local_date, created_at)
values (:'be', :'ch_e', '2026-09-05', '2026-09-05 04:30+03');
select ok(not pg_temp.has_badge(:'be', 'erkenci'), 'Erkenci: 4 early days and one at 04:30 are not enough');
select lives_ok(format($$select app.do_checkin(%L, %L, null, null, null, null, '2026-09-06 07:59+03')$$, :'be', :'ch_e'),
  'the 5th early day (07:59)');
select ok(pg_temp.has_badge(:'be', 'erkenci'), 'Erkenci: earned on the 5th early day');

-- Gece kuşu: yesterday's task after midnight, inside the grace
select pg_temp.mk_user('b_owl') as bo \gset
select pg_temp.add_member(:'ch_e', :'bo', '2026-09-01') as _x \gset
select lives_ok(format($$select app.do_checkin(%L, %L, null, null, null, null, '2026-09-10 23:50+03')$$, :'bo', :'ch_e'),
  'a late check-in before midnight');
select ok(not pg_temp.has_badge(:'bo', 'gece_kusu'), 'Gece kuşu: not before midnight');
select lives_ok(format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-11', '2026-09-12 01:10+03')$$, :'bo', :'ch_e'),
  'yesterday checked in at 01:10');
select ok(pg_temp.has_badge(:'bo', 'gece_kusu'), 'Gece kuşu: earned');

-- Objektif: 30 photo proofs
select pg_temp.mk_user('b_photo') as bph \gset
select pg_temp.mk_ch('Foto', '2026-08-01', 60, 'photo') as ch_ph \gset
select pg_temp.add_member(:'ch_ph', :'bph', '2026-08-01') as _x \gset
insert into public.checkins (user_id, challenge_id, local_date, photo_path)
select :'bph', :'ch_ph', '2026-08-01'::date + i, :'bph' || '/' || :'ch_ph' || '/d' || i || '.jpg'
from generate_series(0, 28) as i;
select ok(not pg_temp.has_badge(:'bph', 'objektif'), 'Objektif: not with 29 photos');
insert into public.checkins (user_id, challenge_id, local_date, photo_path)
values (:'bph', :'ch_ph', '2026-08-30', :'bph' || '/' || :'ch_ph' || '/d29.jpg');
select ok(pg_temp.has_badge(:'bph', 'objektif'), 'Objektif: earned with the 30th photo proof');

-- Son dakika: a rescue in the last hour of the 24 h window
select pg_temp.mk_user('b_late') as bl \gset
select pg_temp.mk_user('b_calm') as bc \gset
select pg_temp.mk_ch('Kurtar', '2026-09-01', 30) as ch_k \gset
select pg_temp.add_member(:'ch_k', :'bl', '2026-09-01') as _x \gset
select pg_temp.add_member(:'ch_k', :'bc', '2026-09-01') as _x \gset
select pg_temp.ci(:'bl', :'ch_k', '2026-09-01', '2026-09-09') as _x \gset
select pg_temp.ci(:'bc', :'ch_k', '2026-09-01', '2026-09-09') as _x \gset
select lives_ok(format($$select app.apply_rescue(%L, %L, '2026-09-10', 'free', null, '2026-09-11 12:00+03')$$, :'bc', :'ch_k'),
  'a rescue early in the window');
select ok(not pg_temp.has_badge(:'bc', 'son_dakika'), 'Son dakika: not for an early rescue');
select lives_ok(format($$select app.apply_rescue(%L, %L, '2026-09-10', 'free', null, '2026-09-12 01:30+03')$$, :'bl', :'ch_k'),
  'a rescue 30 minutes before the window closes');
select ok(pg_temp.has_badge(:'bl', 'son_dakika'), 'Son dakika: earned');

-- Sosyal kaktüs: 10 accepted friends (the 10th through accepting a request)
select pg_temp.mk_user('b_social') as bso \gset
create temp table bfr on commit drop as
select i, pg_temp.mk_user('bfr' || i) as id from generate_series(1, 10) as i;
insert into public.friendships (requester_id, addressee_id, status, accepted_at)
select :'bso', f.id, 'accepted', now() from bfr f where f.i <= 9;
insert into public.friendships (requester_id, addressee_id)
select f.id, :'bso' from bfr f where f.i = 10;
select ok(not pg_temp.has_badge(:'bso', 'sosyal_kaktus'), 'Sosyal kaktüs: not with 9 friends and a pending request');
update public.friendships set status = 'accepted', accepted_at = now()
where addressee_id = :'bso' and status = 'pending';
select ok(pg_temp.has_badge(:'bso', 'sosyal_kaktus') and not pg_temp.has_badge((select id from bfr where i = 10), 'sosyal_kaktus'),
  'Sosyal kaktüs: earned when the 10th request is accepted (only by the one with 10 friends)');

-- Bahçıvan (10 completed challenges) and Maratoncu (3 completed with 30+ own days)
select pg_temp.mk_user('b_garden') as bg \gset
create temp table bgc on commit drop as
select i, pg_temp.mk_ch('Bahçe ' || i, '2026-03-01'::date + i * 10, case when i <= 3 then 30 else 7 end) as id
from generate_series(1, 10) as i;
insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on)
select c.id, :'bg', 'active', now(), '2026-03-01'::date + c.i * 10 from bgc c;
update public.challenge_members m
set finished_at = now(), final_days_done = case when c.i <= 3 then 30 else 7 end,
    final_required_days = case when c.i <= 3 then 30 else 7 end, final_rescues = 0, final_rank = 1
from bgc c where m.challenge_id = c.id and m.user_id = :'bg' and c.i between 2 and 9;
select ok(not pg_temp.has_badge(:'bg', 'bahcivan') and not pg_temp.has_badge(:'bg', 'maratoncu'),
  'Bahçıvan / Maratoncu: not with 8 completed, two of them 30 days long');
update public.challenge_members m
set finished_at = now(), final_days_done = 29, final_required_days = 30, final_rescues = 0, final_rank = 2
from bgc c where m.challenge_id = c.id and m.user_id = :'bg' and c.i = 1;
select ok(not pg_temp.has_badge(:'bg', 'maratoncu'), 'Maratoncu: a 30-day challenge with a missed day does not count');
reset role;
update public.challenge_members m
set finished_at = now(), final_days_done = 7, final_required_days = 7, final_rescues = 0, final_rank = 1
from bgc c where m.challenge_id = c.id and m.user_id = :'bg' and c.i = 10;
select ok(not pg_temp.has_badge(:'bg', 'bahcivan'), 'Bahçıvan: 9 completed (one finished incomplete) are not enough');
select pg_temp.mk_ch('Bahçe 11', '2026-03-01', 30) as ch_b11 \gset
select pg_temp.mk_ch('Bahçe 12', '2026-04-01', 7) as ch_b12 \gset
insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on, finished_at,
                                      final_days_done, final_required_days, final_rescues, final_rank)
values (:'ch_b11', :'bg', 'active', now(), '2026-03-01', null, null, null, null, null);
update public.challenge_members set finished_at = now(), final_days_done = 30, final_required_days = 30,
                                    final_rescues = 1, final_rank = 1
where challenge_id = :'ch_b11' and user_id = :'bg';
select ok(pg_temp.has_badge(:'bg', 'bahcivan') and pg_temp.has_badge(:'bg', 'maratoncu'),
  'Bahçıvan and Maratoncu: earned with the 10th completed challenge, the 3rd of 30 days');

-- Şampiyon: first of a group of 3 once every result is recorded (the real finalisation)
select pg_temp.mk_user('s_ada') as sa \gset
select pg_temp.mk_user('s_bek') as sb \gset
select pg_temp.mk_user('s_can') as sc \gset
select pg_temp.mk_ch('Final', '2026-09-01', 7) as ch_s \gset
select pg_temp.add_member(:'ch_s', :'sa', '2026-09-01', 'owner', '2026-09-01 08:00+03') as _x \gset
select pg_temp.add_member(:'ch_s', :'sb', '2026-09-01', 'member', '2026-09-01 09:00+03') as _x \gset
select pg_temp.add_member(:'ch_s', :'sc', '2026-09-01', 'member', '2026-09-01 10:00+03') as _x \gset
select pg_temp.ci(:'sa', :'ch_s', '2026-09-01', '2026-09-07') as _x \gset
select pg_temp.ci(:'sb', :'ch_s', '2026-09-01', '2026-09-02') + pg_temp.ci(:'sb', :'ch_s', '2026-09-04', '2026-09-07') as _x \gset
select pg_temp.ci(:'sc', :'ch_s', '2026-09-01', '2026-09-07') as _x \gset
select ok(app.finalize_member(:'sc', :'ch_s', '2026-09-09 12:00+03'), 'first result recorded');
select ok(app.finalize_member(:'sb', :'ch_s', '2026-09-09 12:00+03'), 'second result recorded');
select ok(not pg_temp.has_badge(:'sa', 'sampiyon') and not pg_temp.has_badge(:'sc', 'sampiyon'),
  'Şampiyon: not while a member''s result is still open (provisional ranks)');
select ok(app.finalize_member(:'sa', :'ch_s', '2026-09-09 12:00+03'), 'the last result is recorded');
select results_eq(format($$select user_id from public.user_badges where badge_key = 'sampiyon' and user_id in (%L, %L, %L)$$, :'sa', :'sb', :'sc'),
  array[:'sa'::uuid], 'Şampiyon: the first (most days, then earliest to join) of a group of 3');
select results_eq(format($$select final_rank::int from public.challenge_members where challenge_id = %L and user_id = %L$$, :'ch_s', :'sa'),
  array[1], 'and she is 1st in the recorded ranking too');

select pg_temp.mk_user('s_duo') as sd \gset
select pg_temp.mk_ch('İkili', '2026-09-01', 7) as ch_duo \gset
select pg_temp.add_member(:'ch_duo', :'sd', '2026-09-01', 'owner', '2026-09-01 08:00+03') as _x \gset
select pg_temp.add_member(:'ch_duo', :'sb', '2026-09-01', 'member', '2026-09-01 09:00+03') as _x \gset
select pg_temp.ci(:'sd', :'ch_duo', '2026-09-01', '2026-09-07') as _x \gset
select pg_temp.ci(:'sb', :'ch_duo', '2026-09-01', '2026-09-07') as _x \gset
select ok(app.finalize_member(:'sd', :'ch_duo', '2026-09-09 12:00+03'), 'duo: first result recorded');
select ok(app.finalize_member(:'sb', :'ch_duo', '2026-09-09 12:00+03'), 'duo: last result recorded');
select ok(not pg_temp.has_badge(:'sd', 'sampiyon'), 'Şampiyon: not in a group of two');

-- my_badges
select tests.authenticate_as('b_poker');
select results_eq($$select key, sort_order, title, icon, tint from public.my_badges() where earned_at is not null order by sort_order$$,
  $$values ('laf_ustasi'::text, 2, 'Laf ustası'::text, 'speech'::text, 'orange'::text),
           ('gaz_pedali'::text, 8, 'Gaz pedalı'::text, 'hand'::text, 'orange'::text)$$,
  'my_badges: the earned badges with title, icon and tint keys');
select results_eq($$select count(*)::int, count(earned_at)::int, min(sort_order), max(sort_order) from public.my_badges()$$,
  $$values (12, 2, 1, 12)$$, 'my_badges: all 12 in catalog order, locked ones without earned_at');
reset role;

-- ================================================================================================
-- 6. Declining a rescue ("Baştan başla")
-- ================================================================================================

select pg_temp.mk_user('d_dec') as dd \gset
select pg_temp.mk_ch('Vazgeç', '2026-09-01', 30) as ch_d \gset
select pg_temp.add_member(:'ch_d', :'dd', '2026-09-01') as _x \gset
select pg_temp.ci(:'dd', :'ch_d', '2026-09-01', '2026-09-09') as _x \gset
select results_eq(format($$select missed_date, streak_before from app.pending_rescues(%L, '2026-09-11 12:00+03')$$, :'dd'),
  $$values ('2026-09-10'::date, 9)$$, 'the missed day can be rescued');
select ok(app.do_decline_rescue(:'dd', :'ch_d', '2026-09-10', '2026-09-11 12:00+03'), 'decline_rescue: declined');
select is_empty(format($$select 1 from app.pending_rescues(%L, '2026-09-11 12:00+03')$$, :'dd'),
  'a declined day is no longer pending');
select is((select wilted from app.streak_summary(:'dd', '2026-09-11 12:00+03')), false, 'Diken is no longer wilted');
select throws_ok(format($$select app.apply_rescue(%L, %L, '2026-09-10', 'free', null, '2026-09-11 13:00+03')$$, :'dd', :'ch_d'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'a declined day cannot be rescued later');
select throws_ok(format($$select app.do_decline_rescue(%L, %L, '2026-09-10', '2026-09-11 13:00+03')$$, :'dd', :'ch_d'),
  'P0002', 'Bekleyen bir kurtarma yok', 'decline_rescue: nothing pending any more');
select throws_ok(format($$select app.do_decline_rescue(%L, %L, '2026-09-05', '2026-09-11 13:00+03')$$, :'dd', :'ch_d'),
  'P0002', 'Bekleyen bir kurtarma yok', 'decline_rescue: not a covered day');
select lives_ok(format($$select app.do_checkin(%L, %L, null, null, null, null, '2026-09-11 14:00+03')$$, :'dd', :'ch_d'),
  'today is checked in');
select is(app.user_streak(:'dd', '2026-09-11 14:00+03'), 1, 'the streak starts again from zero');

-- Through the RPC (now()): with grace 0 yesterday is closed all day long, so it is always pending
select pg_temp.mk_user('d_rpc', 0) as dr \gset
select pg_temp.mk_ch('Vazgeç RPC', :'today'::date - 3, 10) as ch_dr \gset
select pg_temp.add_member(:'ch_dr', :'dr', :'today'::date - 3) as _x \gset
select pg_temp.ci(:'dr', :'ch_dr', :'today'::date - 3, :'today'::date - 2) as _x \gset
select tests.authenticate_as('d_rpc');
select results_eq($$select missed_date from public.my_pending_rescues()$$, array[:'today'::date - 1],
  'my_pending_rescues: yesterday');
select ok(public.decline_rescue(:'ch_dr', :'today'::date - 1), 'decline_rescue (RPC)');
select is_empty($$select 1 from public.my_pending_rescues()$$, 'my_pending_rescues no longer returns it');
select is((select wilted from public.my_streak()), false, 'my_streak: not wilted');
reset role;

-- ================================================================================================
-- 7. NumberEntry stats (number_stats): yesterday, own best, best of the group today
-- ================================================================================================

select pg_temp.mk_user('n_me') as nme \gset
select pg_temp.mk_user('n_can') as ncan \gset
select pg_temp.mk_user('n_blk') as nblk \gset
select pg_temp.mk_user('n_left') as nleft \gset
insert into public.challenges (title, task_type, duration_days, start_date, number_unit, number_base_target,
                               number_daily_increment, number_step, number_max)
values ('Plank', 'number', 10, '2026-09-01', 'sn', 60, 5, 5, 600) returning id as ch_n \gset
select pg_temp.add_member(:'ch_n', :'nme', '2026-09-01') as _x \gset
select pg_temp.add_member(:'ch_n', :'ncan', '2026-09-01') as _x \gset
select pg_temp.add_member(:'ch_n', :'nblk', '2026-09-01') as _x \gset
insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on, left_on)
values (:'ch_n', :'nleft', 'left', '2026-09-01', '2026-09-01', '2026-09-04');
insert into public.checkins (user_id, challenge_id, local_date, value) values
  (:'nme', :'ch_n', '2026-09-01', 60), (:'nme', :'ch_n', '2026-09-02', 65),
  (:'ncan', :'ch_n', '2026-09-02', 70), (:'ncan', :'ch_n', '2026-09-03', 90),
  (:'nblk', :'ch_n', '2026-09-03', 120), (:'nleft', :'ch_n', '2026-09-03', 200);
insert into public.blocks (blocker_id, blocked_id) values (:'nme', :'nblk');

select results_eq(
  format($$select (s ->> 'day_index')::int, (s ->> 'target')::numeric, s ->> 'unit', s ->> 'my_value',
                  (s ->> 'yesterday_value')::numeric, (s ->> 'best_value')::numeric,
                  (s #>> '{group_best,value}')::numeric, (s #>> '{group_best,user_id}')::uuid
           from app.number_stats(%L, %L, null, '2026-09-03 12:00+03') s$$, :'nme', :'ch_n'),
  format($$values (3, 70::numeric, 'sn'::text, null::text, 65::numeric, 65::numeric, 90::numeric, %L::uuid)$$, :'ncan'),
  'number_stats: day 3, target 70; yesterday 65, best 65; best of the group 90 (blocked and former members ignored)');
select lives_ok(format($$select app.do_checkin(%L, %L, 95, null, null, null, '2026-09-03 18:00+03')$$, :'nme', :'ch_n'),
  'today''s number is saved');
select results_eq(
  format($$select (s ->> 'my_value')::numeric, (s ->> 'best_value')::numeric, (s #>> '{group_best,value}')::numeric,
                  s #>> '{group_best,display_name}'
           from app.number_stats(%L, %L, null, '2026-09-03 19:00+03') s$$, :'nme', :'ch_n'),
  $$values (95::numeric, 65::numeric, 95::numeric, 'N_Me'::text)$$,
  'number_stats: own value counts for the group; own best excludes the day being entered');
select is((app.number_stats(:'nme', :'ch_n', '2026-09-02', '2026-09-03 01:00+03') ->> 'my_value')::numeric, 65::numeric,
  'number_stats: the still-open yesterday through p_local_date');
select tests.authenticate_as('n_me');
select throws_ok(format($$select public.number_stats(%L)$$, :'ch_g'),
  '42501', 'Bu challenge''da değilsin', 'number_stats: members only');
reset role;
select pg_temp.add_member(:'ch_g', :'nme', '2026-09-01') as _x \gset
select tests.authenticate_as('n_me');
select throws_ok(format($$select public.number_stats(%L)$$, :'ch_g'),
  '22023', 'Bu görev sayı ile işaretlenmiyor', 'number_stats: number tasks only');
reset role;

-- ================================================================================================
-- 8. Challenge status / day index from the server; the "finished" screen once
-- ================================================================================================

select pg_temp.mk_ch('Durum', '2026-09-10', 7) as ch_st \gset
select pg_temp.add_member(:'ch_st', :'g2', '2026-09-10') as _x \gset
select results_eq(
  format($$select app.challenge_status(%L, %L, t), app.challenge_day_index(%L, %L, t)
           from unnest(array['2026-09-05 12:00+03', '2026-09-12 12:00+03', '2026-09-17 01:00+03',
                             '2026-09-17 03:00+03']::timestamptz[]) with ordinality as x(t, n) order by n$$,
         :'g2', :'ch_st', :'g2', :'ch_st'),
  $$values ('upcoming'::text, 0), ('active', 3), ('active', 7), ('finished', 7)$$,
  'status / day index: upcoming (0), active (3), last day still open in the grace (7), finished');

select pg_temp.mk_user('f_one') as f1 \gset
select pg_temp.mk_user('f_two') as f2 \gset
select pg_temp.mk_ch('Bitti', :'today'::date - 10, 7) as ch_fin \gset
select pg_temp.add_member(:'ch_fin', :'f1', :'today'::date - 10, 'owner', now() - interval '10 days') as _x \gset
select pg_temp.add_member(:'ch_fin', :'f2', :'today'::date - 10, 'member', now() - interval '9 days') as _x \gset
select pg_temp.ci(:'f1', :'ch_fin', :'today'::date - 10, :'today'::date - 4) as _x \gset
select pg_temp.ci(:'f2', :'ch_fin', :'today'::date - 10, :'today'::date - 6) as _x \gset
select pg_temp.mk_ch('Sürüyor', :'today', 7) as ch_run \gset
select pg_temp.add_member(:'ch_run', :'f1', :'today') as _x \gset

select tests.authenticate_as('f_one');
select results_eq(
  format($$select challenge_id, days_done, required_days, rescues, rank, completed, stage::text
           from public.my_unseen_finished()$$),
  format($$values (%L::uuid, 7, 7, 0, 1, true, 'genc'::text)$$, :'ch_fin'),
  'my_unseen_finished: records the ended challenge and returns it once with its result');
select results_eq(format($$select c ->> 'status', (c ->> 'day_index')::int, (c ->> 'member_count')::int from public.challenge_detail(%L) c$$, :'ch_fin'),
  $$values ('finished'::text, 7, 2)$$, 'challenge_detail: finished, day 7 of 7, 2 members');
select is(public.challenge_detail(:'ch_run') ->> 'status', 'active', 'challenge_detail: a running challenge is active');
select ok(public.mark_finish_seen(:'ch_fin'), 'mark_finish_seen');
select is_empty($$select 1 from public.my_unseen_finished()$$, 'shown once: not returned again (on any device)');
select isnt(public.my_membership(:'ch_fin') ->> 'finish_seen_at', null, 'my_membership: finish_seen_at is set');
select is(public.mark_finish_seen(:'ch_run'), false, 'mark_finish_seen: false for a challenge that has not finished');
select tests.authenticate_as('f_two');
select results_eq($$select completed, days_done, required_days from public.my_unseen_finished()$$,
  $$values (false, 5, 7)$$, 'my_unseen_finished: an incomplete finish is returned too (completed = false)');
reset role;

-- ================================================================================================
-- 9. Friends: mutual friends in requests and search, short challenge title in friends_today
-- ================================================================================================

select pg_temp.mk_user('m_aa') as ma \gset
select pg_temp.mk_user('m_bb') as mb \gset
select pg_temp.mk_user('m_cc') as mc \gset
select pg_temp.mk_user('m_dd') as md \gset
select pg_temp.befriend(:'ma', :'mc') + pg_temp.befriend(:'md', :'ma') + pg_temp.befriend(:'mb', :'mc')
       + pg_temp.befriend(:'mb', :'md') as _x \gset
insert into public.friendships (requester_id, addressee_id) values (:'mb', :'ma');
select is(app.mutual_friend_count(:'ma', :'mb'), 2, 'mutual_friend_count: two friends in common');

select tests.authenticate_as('m_aa');
select results_eq($$select direction, user_id, mutual_count from public.friend_requests()$$,
  format($$values ('incoming'::text, %L::uuid, 2)$$, :'mb'), 'friend_requests: incoming with "2 ortak"');
select results_eq($$select username, mutual_count, request_pending from public.search_profiles('m_bb')$$,
  $$values ('m_bb'::text, 2, true)$$, 'search_profiles: mutual friend count');
select tests.authenticate_as('m_bb');
select results_eq($$select direction, mutual_count from public.friend_requests()$$,
  $$values ('outgoing'::text, 2)$$, 'friend_requests: outgoing too');

reset role;
select pg_temp.mk_ch('Uzun ad', :'today', 7) as ch_sh \gset
update public.challenges set short_title = 'kısa ad' where id = :'ch_sh';
select pg_temp.add_member(:'ch_sh', :'ma', :'today') + pg_temp.add_member(:'ch_sh', :'mc', :'today') as _x \gset
select tests.authenticate_as('m_aa');
select results_eq(format($$select shared_challenge_id, shared_challenge_title, shared_challenge_short_title
                           from public.friends_today() where user_id = %L$$, :'mc'),
  format($$values (%L::uuid, 'Uzun ad'::text, 'kısa ad'::text)$$, :'ch_sh'),
  'friends_today: the shared challenge with its short title');
reset role;

-- ================================================================================================
-- 10. Explore popularity (template_popularity)
-- ================================================================================================

select pg_temp.mk_user('t_one') as t1 \gset
select pg_temp.mk_user('t_two') as t2 \gset
select (app.do_create_challenge(:'t1', (select id from public.challenge_templates where slug = 'plank'),
        null, null, null, null, null, null, null, null, 0, null, null, '{}', now())).id as ch_tp \gset
select pg_temp.add_member(:'ch_tp', :'t2', :'today') as _x \gset
select (app.do_create_challenge(:'t2', (select id from public.challenge_templates where slug = 'kahvesiz'),
        null, null, null, null, null, null, null, null, 0, null, null, '{}', now())).id as ch_tk \gset
select results_eq(
  $$select t.slug, p.active_count, p.popularity
    from public.template_popularity() p join public.challenge_templates t on t.id = p.template_id
    order by p.popularity$$,
  $$values ('plank'::text, 2, 1), ('kahvesiz', 1, 2), ('telefonsuz-sabah', 0, 3), ('iltifat', 0, 4),
           ('20-sayfa', 0, 5), ('harcamasiz', 0, 6), ('sekersiz', 0, 7), ('ters-el', 0, 8)$$,
  'template_popularity: by people doing it now, then onboarding order, then slug');
select is((public.template_stats((select id from public.challenge_templates where slug = 'plank')) ->> 'active_count')::int, 2,
  'template_stats uses the same "doing it now" count');

select * from finish();
rollback;
