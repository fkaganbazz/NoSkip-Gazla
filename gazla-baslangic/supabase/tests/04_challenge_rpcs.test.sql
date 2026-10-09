-- pgTAP: challenge lifecycle RPCs (migrations 300 / 600 / 700).
--
--   create_challenge (template copy in the caller's locale, custom validation), invite_to_challenge,
--   respond_to_invite, create_invite / revoke_invite, get_invite_preview (anon), join_challenge_by_invite,
--   leave_challenge (ownership transfer / delete), checkin, undo_checkin, rescue_streak,
--   grant_ad_rescue (service role only), challenge_board, friends_today, template_stats,
--   finish_due_challenges.
--
-- Public RPCs use now()/auth.uid(), so their fixtures are built relative to the caller's local today.
-- Date-sensitive rules (2 h grace, member range, finalisation vs. rescue window) use the app.* variants
-- with an explicit p_at, called as postgres. Everything is created inside the transaction and rolled
-- back. Only basejump-compatible helpers are used (create_supabase_user, authenticate_as,
-- authenticate_as_service_role, clear_authentication); going back to postgres is a plain RESET ROLE.
--
-- Run:  supabase test db   (or the local testbed: ./test.sh supabase/tests/04_challenge_rpcs.test.sql)
begin;
select plan(224);
-- This file tests behaviour, not privileges (01_rls_privileges does). Expected values are computed
-- with app.* helpers, sometimes while signed in, so the helpers are opened inside this transaction.
grant execute on all functions in schema app to authenticated;

-- ------------------------------------------------------------------------------------------------
-- Helpers (pg_temp; only called as postgres)
-- ------------------------------------------------------------------------------------------------

create function pg_temp.mk_user(p_ident text, p_locale text default 'tr', p_tz text default 'Europe/Istanbul')
returns uuid
language plpgsql as $$
declare
  v uuid := tests.create_supabase_user(p_ident);
begin
  insert into public.profiles (id, username, display_name) values (v, p_ident, initcap(p_ident));
  insert into public.user_settings (user_id, birth_year, timezone, locale) values (v, 1995, p_tz, p_locale);
  return v;
end
$$;

create function pg_temp.befriend(p_a uuid, p_b uuid) returns integer
language sql as $$
  insert into public.friendships (requester_id, addressee_id, status, accepted_at)
  values (p_a, p_b, 'accepted', now())
  returning 1
$$;

-- A challenge row plus its owner (active, joined on the start day)
create function pg_temp.mk_ch(
  p_title text, p_start date, p_days integer, p_owner uuid, p_template uuid default null,
  p_owner_joined_at timestamptz default null
) returns uuid
language plpgsql as $$
declare
  v uuid;
begin
  insert into public.challenges (template_id, created_by, title, task_type, duration_days, start_date)
  values (p_template, p_owner, p_title, 'check', p_days, p_start)
  returning id into v;
  insert into public.challenge_members (challenge_id, user_id, role, status, joined_at, joined_on)
  values (v, p_owner, 'owner', 'active', coalesce(p_owner_joined_at, p_start::timestamptz), p_start);
  return v;
end
$$;

create function pg_temp.add_member(
  p_ch uuid, p_user uuid, p_status public.member_status default 'active',
  p_joined_at timestamptz default null, p_joined_on date default null, p_left_on date default null,
  p_invited_by uuid default null
) returns integer
language sql as $$
  insert into public.challenge_members (challenge_id, user_id, status, invited_by, joined_at, joined_on, left_on)
  values (p_ch, p_user, p_status, p_invited_by,
          case when p_status in ('active', 'left') then coalesce(p_joined_at, now()) end,
          case when p_status in ('active', 'left')
               then coalesce(p_joined_on, (select c.start_date from public.challenges c where c.id = p_ch)) end,
          p_left_on)
  returning 1
$$;

-- Check-ins for every day in [p_from, p_to] (direct insert, as if done on time)
create function pg_temp.ci(p_user uuid, p_ch uuid, p_from date, p_to date) returns integer
language sql as $$
  with ins as (
    insert into public.checkins (user_id, challenge_id, local_date)
    select p_user, p_ch, g::date from generate_series(p_from, p_to, interval '1 day') as g
    returning 1
  )
  select count(*)::int from ins
$$;

-- ------------------------------------------------------------------------------------------------
-- Fixture: users (Europe/Istanbul unless stated), friendships
-- ------------------------------------------------------------------------------------------------

select pg_temp.mk_user('olcay')      as o \gset
select pg_temp.mk_user('mert')       as m \gset
select pg_temp.mk_user('ece')        as e \gset
select pg_temp.mk_user('can')        as c \gset
-- stranger to olcay
select pg_temp.mk_user('selin')      as s \gset
-- olcay sent him a request (pending)
select pg_temp.mk_user('bora')       as b \gset
-- olcay's friend, later blocks olcay
select pg_temp.mk_user('kaan')       as k \gset
-- English locale
select pg_temp.mk_user('lale', 'en') as l \gset
-- mert's friend, not olcay's
select pg_temp.mk_user('nil')        as n \gset
-- olcay's friend
select pg_temp.mk_user('zeynep')     as z \gset
select pg_temp.mk_user('nyc', 'tr', 'America/New_York') as ny \gset
select tests.create_supabase_user('noprofile') as np \gset
select array_agg(pg_temp.mk_user('dolgu' || g) order by g)::text as fillers from generate_series(1, 19) g \gset

update public.profiles set avatar_path = :'o' || '/avatar.jpg' where id = :'o';

select pg_temp.befriend(:'o', :'m') + pg_temp.befriend(:'o', :'e') + pg_temp.befriend(:'c', :'o')
     + pg_temp.befriend(:'o', :'k') + pg_temp.befriend(:'o', :'z') + pg_temp.befriend(:'m', :'n') as friendships \gset
insert into public.friendships (requester_id, addressee_id) values (:'o', :'b');

select app.local_date(:'o', now()) as today \gset
select id as t_kahve   from public.challenge_templates where slug = 'kahvesiz' \gset
select id as t_iltifat from public.challenge_templates where slug = 'iltifat' \gset
select id as t_plank   from public.challenge_templates where slug = 'plank' \gset
select id as t_tersel  from public.challenge_templates where slug = 'ters-el' \gset

-- ch_old: olcay's challenge that ended 7 days ago; ch_full: olcay + 19 active fillers = 20
select pg_temp.mk_ch('Bitmiş', :'today'::date - 13, 7, :'o') as ch_old \gset
select pg_temp.mk_ch('Kalabalık', :'today'::date, 7, :'o') as ch_full \gset
insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on)
select :'ch_full', f, 'active', now(), :'today' from unnest(:'fillers'::uuid[]) as f;

-- ================================================================================================
-- 1. create_challenge from a template
-- ================================================================================================

select tests.authenticate_as('olcay');
select id as ch_tpl from public.create_challenge(p_template => :'t_kahve') \gset
select id as ch_tpl30 from public.create_challenge(p_template => :'t_kahve', p_duration_days => 30) \gset
select id as ch_plank from public.create_challenge(p_template => :'t_plank') \gset

select throws_ok(
  format($$select public.create_challenge(p_template => %L, p_duration_days => 14)$$, :'t_kahve'),
  '23514', 'new row for relation "challenges" violates check constraint "challenges_template_duration"',
  'template challenge: only 7/10/30 days (14 rejected)');
select throws_ok(
  format($$select public.create_challenge(p_template => %L, p_duration_days => 3)$$, :'t_kahve'),
  '23514', 'new row for relation "challenges" violates check constraint "challenges_template_duration"',
  'template challenge: the custom-only 3 days is rejected');
select throws_ok(
  format($$select public.create_challenge(p_template => %L)$$, gen_random_uuid()),
  'P0002', 'Şablon bulunamadı', 'unknown template id is rejected');
reset role;
update public.challenge_templates set is_active = false where id = :'t_tersel';
select tests.authenticate_as('olcay');
select throws_ok(
  format($$select public.create_challenge(p_template => %L)$$, :'t_tersel'),
  'P0002', 'Şablon bulunamadı', 'inactive template cannot be started');
reset role;

select results_eq(
  format($$select title, short_title, task_type::text, duration_days::int, start_date, end_date, icon, tint,
                  category::text, template_id, created_by
           from public.challenges where id = %L$$, :'ch_tpl'),
  format($$values ('7 gün kahvesiz'::text, 'kahvesiz'::text, 'check'::text, 7, %L::date, %L::date + 6,
                   'coffee'::text, 'butter'::text, 'food_drink'::text, %L::uuid, %L::uuid)$$,
         :'today', :'today', :'t_kahve', :'o'),
  'template: title/short title (tr), task type, default duration, icon, tint, category copied; starts today');
select results_eq(
  format($$select role::text, status::text, joined_on, joined_at is not null
           from public.challenge_members where challenge_id = %L and user_id = %L$$, :'ch_tpl', :'o'),
  format($$values ('owner'::text, 'active'::text, %L::date, true)$$, :'today'),
  'creator becomes the active owner, joined today');
select results_eq(
  format($$select duration_days::int, end_date from public.challenges where id = %L$$, :'ch_tpl30'),
  format($$values (30, %L::date + 29)$$, :'today'),
  'template with a picked duration (30 instead of the default 7)');
select results_eq(
  format($$select task_type::text, duration_days::int, number_unit, number_base_target, number_daily_increment,
                  number_step, number_max
           from public.challenges where id = %L$$, :'ch_plank'),
  $$values ('number'::text, 10, 'sn'::text, 60::numeric, 5::numeric, 5::numeric, 600::numeric)$$,
  'number template: unit, base target, daily increment, step and max are copied');

-- English locale: English text when the template has it, Turkish fallback otherwise
update public.challenge_templates set title_en = '7 days without coffee', short_title_en = 'no coffee'
where id = :'t_kahve';
select tests.authenticate_as('lale');
select id as ch_en  from public.create_challenge(p_template => :'t_kahve') \gset
select id as ch_en2 from public.create_challenge(p_template => :'t_iltifat') \gset
reset role;
select results_eq(
  format($$select title, short_title from public.challenges where id = %L$$, :'ch_en'),
  $$values ('7 days without coffee'::text, 'no coffee'::text)$$,
  'template: an en user gets the English title and short title');
select results_eq(
  format($$select title, short_title from public.challenges where id = %L$$, :'ch_en2'),
  $$values ('Her gün birine iltifat et'::text, 'iltifat'::text)$$,
  'template: an en user falls back to Turkish when the template has no English text');

-- A later catalog edit does not change a running challenge
update public.challenge_templates set title_tr = 'Kahve yasak', icon = 'cup' where id = :'t_kahve';
select results_eq(
  format($$select title, icon from public.challenges where id = %L$$, :'ch_tpl'),
  $$values ('7 gün kahvesiz'::text, 'coffee'::text)$$,
  'template fields are a snapshot: editing the catalog does not change the challenge');

-- ================================================================================================
-- 2. create_challenge: custom
-- ================================================================================================

select tests.authenticate_as('olcay');
select id as ch_main from public.create_challenge(
  p_title => '  Akşam 20 dakika yürüyüş  ', p_task_type => 'check', p_duration_days => 10,
  p_reminder_time => '20:00', p_invite_message => 'Kaçıran baklava ısmarlar.',
  p_invitees => array[:'m']::uuid[]) \gset
select id as ch_num from public.create_challenge(
  p_title => 'Plank', p_task_type => 'number', p_duration_days => 10, p_number_unit => 'sn',
  p_number_base_target => 60, p_number_daily_increment => 5, p_number_step => 5, p_number_max => 600) \gset
select id as ch_num2 from public.create_challenge(
  p_title => 'Sayfa', p_task_type => 'number', p_duration_days => 7, p_number_unit => 'sayfa',
  p_number_base_target => 20, p_number_step => 1) \gset
select id as ch_photo from public.create_challenge(p_title => 'Kitap', p_task_type => 'photo', p_duration_days => 7) \gset
select id as ch_future from public.create_challenge(
  p_title => 'Yarın başlıyor', p_task_type => 'check', p_duration_days => 7, p_start_date => :'today'::date + 1) \gset

select throws_ok($$select public.create_challenge(p_task_type => 'check', p_duration_days => 10)$$,
  '22023', 'Ad, süre ve tamamlama şekli gerekli', 'custom: title is required');
select throws_ok($$select public.create_challenge(p_title => 'Tipsiz', p_duration_days => 10)$$,
  '22023', 'Ad, süre ve tamamlama şekli gerekli', 'custom: task type is required');
select throws_ok($$select public.create_challenge(p_title => 'Süresiz', p_task_type => 'check')$$,
  '22023', 'Ad, süre ve tamamlama şekli gerekli', 'custom: duration is required');
select throws_ok($$select public.create_challenge(p_title => '    ', p_task_type => 'check', p_duration_days => 10)$$,
  '23514', 'new row for relation "challenges" violates check constraint "challenges_title"',
  'custom: a blank title is rejected');
select throws_ok(
  format($$select public.create_challenge(p_title => %L, p_task_type => 'check', p_duration_days => 10)$$, repeat('a', 61)),
  '23514', 'new row for relation "challenges" violates check constraint "challenges_title"',
  'custom: title longer than 60 characters is rejected');
select lives_ok(
  format($$select public.create_challenge(p_title => %L, p_task_type => 'check', p_duration_days => 10)$$, repeat('a', 60)),
  'custom: a 60-character title is accepted');
select throws_ok($$select public.create_challenge(p_title => 'İki gün', p_task_type => 'check', p_duration_days => 2)$$,
  '23514', 'new row for relation "challenges" violates check constraint "challenges_duration"',
  'custom: 2 days is below the 3-day minimum');
select lives_ok($$select public.create_challenge(p_title => 'Üç gün', p_task_type => 'check', p_duration_days => 3)$$,
  'custom: 3 days is accepted');
select lives_ok($$select public.create_challenge(p_title => 'Altmış gün', p_task_type => 'check', p_duration_days => 60)$$,
  'custom: 60 days is accepted');
select throws_ok($$select public.create_challenge(p_title => 'Altmış bir', p_task_type => 'check', p_duration_days => 61)$$,
  '23514', 'new row for relation "challenges" violates check constraint "challenges_duration"',
  'custom: 61 days is above the 60-day maximum');
select throws_ok(
  format($$select public.create_challenge(p_title => 'Dün', p_task_type => 'check', p_duration_days => 7, p_start_date => %L)$$,
         :'today'::date - 1),
  '22023', 'Başlangıç günü bugün ile 7 gün sonrası arasında olmalı', 'start date cannot be in the past');
select throws_ok(
  format($$select public.create_challenge(p_title => 'Uzak', p_task_type => 'check', p_duration_days => 7, p_start_date => %L)$$,
         :'today'::date + 8),
  '22023', 'Başlangıç günü bugün ile 7 gün sonrası arasında olmalı', 'start date cannot be more than 7 days ahead');
select lives_ok(
  format($$select public.create_challenge(p_title => 'Haftaya', p_task_type => 'check', p_duration_days => 7, p_start_date => %L)$$,
         :'today'::date + 7),
  'start date exactly 7 days ahead is accepted');
select throws_ok($$select public.create_challenge(p_title => 'Birimsiz', p_task_type => 'number', p_duration_days => 7,
                                                   p_number_base_target => 10, p_number_step => 1)$$,
  '23514', 'new row for relation "challenges" violates check constraint "challenges_number"',
  'custom number: unit is required');
select throws_ok($$select public.create_challenge(p_title => 'Adımsız', p_task_type => 'number', p_duration_days => 7,
                                                   p_number_unit => 'dk', p_number_base_target => 10, p_number_step => 0)$$,
  '23514', 'new row for relation "challenges" violates check constraint "challenges_number"',
  'custom number: step must be > 0');
select throws_ok($$select public.create_challenge(p_title => 'Eksi', p_task_type => 'number', p_duration_days => 7,
                                                   p_number_unit => 'dk', p_number_base_target => -1, p_number_step => 1)$$,
  '23514', 'new row for relation "challenges" violates check constraint "challenges_number"',
  'custom number: base target must be >= 0');
select throws_ok($$select public.create_challenge(p_title => 'Tavan', p_task_type => 'number', p_duration_days => 7,
                                                   p_number_unit => 'dk', p_number_base_target => 30, p_number_step => 1,
                                                   p_number_max => 20)$$,
  '23514', 'new row for relation "challenges" violates check constraint "challenges_number"',
  'custom number: max must be >= base target');
select throws_ok($$select public.create_challenge(p_title => 'Azalan', p_task_type => 'number', p_duration_days => 7,
                                                   p_number_unit => 'dk', p_number_base_target => 30, p_number_step => 1,
                                                   p_number_daily_increment => -5)$$,
  '23514', 'new row for relation "challenges" violates check constraint "challenges_number"',
  'custom number: daily increment cannot be negative');
select throws_ok($$select public.create_challenge(p_title => 'Karışık', p_task_type => 'check', p_duration_days => 7,
                                                   p_number_unit => 'dk')$$,
  '23514', 'new row for relation "challenges" violates check constraint "challenges_number"',
  'custom check challenge cannot carry number fields');
select throws_ok($$select public.create_challenge(p_title => 'NaN hedef', p_task_type => 'number', p_duration_days => 7,
                                                   p_number_unit => 'dk', p_number_base_target => 'NaN', p_number_step => 1)$$,
  null, null, 'custom number: NaN base target is rejected');
select throws_ok($$select public.create_challenge(p_title => 'Sonsuz adım', p_task_type => 'number', p_duration_days => 7,
                                                   p_number_unit => 'dk', p_number_base_target => 10, p_number_step => 'Infinity')$$,
  null, null, 'custom number: infinite step is rejected');
select throws_ok(
  format($$select public.create_challenge(p_title => 'Uzun mesaj', p_task_type => 'check', p_duration_days => 7,
                                          p_invite_message => %L)$$, repeat('m', 141)),
  '23514', 'new row for relation "challenges" violates check constraint "challenges_invite_message"',
  'invite message longer than 140 characters is rejected');
select is((select invite_message from public.create_challenge(p_title => 'Boş mesaj', p_task_type => 'check',
                                                               p_duration_days => 7, p_invite_message => '   ')),
  null, 'a blank invite message is stored as null');
select throws_ok(
  format($$select public.create_challenge(p_title => 'Atomik', p_task_type => 'check', p_duration_days => 7,
                                          p_invitees => array[%L, %L]::uuid[])$$, :'e', :'s'),
  'P0001', 'Yalnızca arkadaşlarını davet edebilirsin', 'create with a non-friend invitee fails');
reset role;

select is_empty($$select 1 from public.challenges where title = 'Atomik'$$,
  'failed create is atomic: no challenge row is left behind');
select is_empty(format($$select 1 from public.challenge_members where user_id = %L$$, :'e'),
  'failed create is atomic: the friend in the same invitee list was not invited');
select results_eq(
  format($$select template_id, title, icon, tint, category::text, duration_days::int, reminder_time, invite_message, created_by
           from public.challenges where id = %L$$, :'ch_main'),
  format($$values (null::uuid, 'Akşam 20 dakika yürüyüş'::text, 'check'::text, 'green'::text, null::text, 10,
                   '20:00'::time, 'Kaçıran baklava ısmarlar.'::text, %L::uuid)$$, :'o'),
  'custom: title trimmed, default icon/tint, no template or category, reminder and message stored');
select results_eq(
  format($$select status::text, role::text, invited_by, joined_at from public.challenge_members
           where challenge_id = %L and user_id = %L$$, :'ch_main', :'m'),
  format($$values ('invited'::text, 'member'::text, %L::uuid, null::timestamptz)$$, :'o'),
  'create with invitees: the friend is invited (not active) by the creator');
select results_eq(
  format($$select actor_id, challenge_id from public.notifications where recipient_id = %L and kind = 'challenge_invite'$$, :'m'),
  format($$values (%L::uuid, %L::uuid)$$, :'o', :'ch_main'),
  'create with invitees: the invitee gets one challenge_invite notification from the creator');
select results_eq(
  format($$select c.start_date, c.end_date, m.joined_on from public.challenges c
           join public.challenge_members m on m.challenge_id = c.id and m.role = 'owner' where c.id = %L$$, :'ch_future'),
  format($$values (%L::date + 1, %L::date + 7, %L::date)$$, :'today', :'today', :'today'),
  'challenge starting tomorrow: end date follows the start date');

select tests.authenticate_as('noprofile');
select throws_ok($$select public.create_challenge(p_title => 'Profilsiz', p_task_type => 'check', p_duration_days => 7)$$,
  'P0001', 'Önce profilini tamamla', 'a user without a profile cannot create a challenge');
select tests.clear_authentication();
select throws_ok($$select public.create_challenge(p_title => 'Anonim', p_task_type => 'check', p_duration_days => 7)$$,
  '42501', null, 'anon cannot call create_challenge');
set local role authenticated;
set local request.jwt.claims to '{"role": "authenticated"}';
select throws_ok($$select public.create_challenge(p_title => 'Kimsiz', p_task_type => 'check', p_duration_days => 7)$$,
  '42501', 'Oturum açman gerekiyor', 'authenticated role without a user id (sub) is refused');
reset role;

-- ================================================================================================
-- 3/4. invite_to_challenge and respond_to_invite
-- ================================================================================================

select tests.authenticate_as('olcay');
select is(public.invite_to_challenge(:'ch_main', array[:'e', :'c']::uuid[]), 2, 'owner invites two friends');
select is(public.invite_to_challenge(:'ch_main', array[:'e', :'m']::uuid[]), 0,
  'already invited users are skipped (count 0)');
select is(public.invite_to_challenge(:'ch_main', null), 0, 'null invitee list invites nobody');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'ch_main', :'s'),
  'P0001', 'Yalnızca arkadaşlarını davet edebilirsin', 'cannot invite a stranger');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'ch_main', :'b'),
  'P0001', 'Yalnızca arkadaşlarını davet edebilirsin', 'cannot invite someone whose friend request is still pending');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'ch_main', :'o'),
  'P0001', 'Yalnızca arkadaşlarını davet edebilirsin', 'cannot invite yourself');
reset role;
insert into public.blocks (blocker_id, blocked_id) values (:'k', :'o');
select tests.authenticate_as('olcay');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'ch_main', :'k'),
  'P0001', 'Yalnızca arkadaşlarını davet edebilirsin', 'cannot invite a (former) friend who blocked you');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'ch_old', :'z'),
  'P0001', 'Bu challenge bitti', 'cannot invite into a challenge that has ended');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'ch_full', :'z'),
  'P0001', 'Grup dolu', 'cannot invite when the group already has 20 members');
select tests.authenticate_as('mert');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'ch_main', :'n'),
  '42501', 'Bu challenge''a davet edemezsin', 'an invited (not yet joined) member cannot invite');
select tests.authenticate_as('selin');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'ch_main', :'o'),
  '42501', 'Bu challenge''a davet edemezsin', 'a non-member cannot invite');

-- respond_to_invite
select tests.authenticate_as('mert');
select lives_ok(format($$select public.respond_to_invite(%L, true)$$, :'ch_main'), 'mert accepts the invite');
select tests.authenticate_as('ece');
select lives_ok(format($$select public.respond_to_invite(%L, false)$$, :'ch_main'), 'ece declines the invite');
select throws_ok(format($$select public.respond_to_invite(%L, true)$$, :'ch_main'),
  'P0002', 'Davet bulunamadı', 'a declined invite cannot be answered again');
select tests.authenticate_as('selin');
select throws_ok(format($$select public.respond_to_invite(%L, true)$$, :'ch_main'),
  'P0002', 'Davet bulunamadı', 'cannot accept without an invite');
reset role;
select results_eq(
  format($$select user_id, status::text, joined_on, joined_at is not null, left_on from public.challenge_members
           where challenge_id = %L and user_id in (%L, %L) order by status$$, :'ch_main', :'m', :'e'),
  format($$values (%L::uuid, 'active'::text, %L::date, true, null::date), (%L::uuid, 'declined'::text, null::date, false, null::date)$$,
         :'m', :'today', :'e'),
  'accept -> active, joined today; decline -> declined');

-- An active non-owner member may invite their own friends
select tests.authenticate_as('mert');
select is(public.invite_to_challenge(:'ch_main', array[:'n']::uuid[]), 1, 'an active non-owner member can invite a friend');
-- Re-invite after decline
select tests.authenticate_as('olcay');
select is(public.invite_to_challenge(:'ch_main', array[:'e']::uuid[]), 1, 'a declined friend can be invited again');
reset role;
select results_eq(
  format($$select status::text, invited_by,
                  (select count(*)::int from public.notifications x where x.recipient_id = %L
                     and x.kind = 'challenge_invite' and x.challenge_id = %L)
           from public.challenge_members where challenge_id = %L and user_id = %L$$, :'e', :'ch_main', :'ch_main', :'e'),
  format($$values ('invited'::text, %L::uuid, 2)$$, :'o'),
  're-invite after decline: back to invited, and a second invite notification');
select is((select invited_by from public.challenge_members where challenge_id = :'ch_main' and user_id = :'n'), :'m'::uuid,
  'invite by a member records that member as inviter');
select tests.authenticate_as('ece');
select lives_ok(format($$select public.respond_to_invite(%L, true)$$, :'ch_main'), 'ece accepts the second invite');

-- Re-invite after leaving
select tests.authenticate_as('can');
select lives_ok(format($$select public.respond_to_invite(%L, true)$$, :'ch_main'), 'can accepts');
select lives_ok(format($$select public.leave_challenge(%L)$$, :'ch_main'), 'can leaves');
select tests.authenticate_as('olcay');
select is(public.invite_to_challenge(:'ch_main', array[:'c']::uuid[]), 0,
  'a member who left is not invited again (leaving is final)');
reset role;
select results_eq(
  format($$select status::text, left_on,
                  (select count(*)::int from public.notifications x where x.recipient_id = %L
                     and x.kind = 'challenge_invite' and x.challenge_id = %L)
           from public.challenge_members where challenge_id = %L and user_id = %L$$, :'c', :'ch_main', :'ch_main', :'c'),
  format($$values ('left'::text, %L::date, 1)$$, :'today'),
  're-invite after leaving: the row stays left with its left_on, no new invite notification');

-- Accept is refused on an ended or full challenge; decline always works
select pg_temp.add_member(:'ch_old', :'m', 'invited', p_invited_by => :'o') as x1 \gset
select pg_temp.add_member(:'ch_old', :'z', 'invited', p_invited_by => :'o') as x2 \gset
select pg_temp.add_member(:'ch_full', :'z', 'invited', p_invited_by => :'o') as x3 \gset
select tests.authenticate_as('mert');
select throws_ok(format($$select public.respond_to_invite(%L, true)$$, :'ch_old'),
  'P0001', 'Bu challenge bitti', 'cannot accept an invite to a challenge that has ended');
select lives_ok(format($$select public.respond_to_invite(%L, false)$$, :'ch_old'),
  'an invite to an ended challenge can still be declined');
select tests.authenticate_as('zeynep');
select throws_ok(format($$select public.respond_to_invite(%L, true)$$, :'ch_full'),
  'P0001', 'Grup dolu', 'cannot accept when the group already has 20 active members');
reset role;
select is((select status::text from public.challenge_members where challenge_id = :'ch_full' and user_id = :'z'), 'invited',
  'refused accept leaves the invite pending');

-- A pending invite must not survive a block between inviter and invitee (the link path refuses too)
select pg_temp.mk_user('kemal') as km \gset
select pg_temp.mk_user('lara') as lr \gset
select pg_temp.befriend(:'km', :'lr') as x_kl \gset
select pg_temp.mk_ch('Kemal grup', :'today', 7, :'km') as ch_km \gset
select tests.authenticate_as('kemal');
select is(public.invite_to_challenge(:'ch_km', array[:'lr']::uuid[]), 1, 'kemal invites his friend lara');
reset role;
insert into public.blocks (blocker_id, blocked_id) values (:'km', :'lr');
select tests.authenticate_as('lara');
select throws_ok(format($$select public.respond_to_invite(%L, true)$$, :'ch_km'), null, null,
  'after the inviter blocks the invitee, the pending invite can no longer be accepted');
reset role;

-- ================================================================================================
-- 5. create_invite / revoke_invite
-- ================================================================================================

select tests.authenticate_as('olcay');
select public.create_invite(:'ch_main') as code_o \gset
select matches(:'code_o'::text, '^[A-Za-z0-9]{10}$', 'create_invite returns a 10-character URL-safe code');
select is(public.create_invite(:'ch_main'), :'code_o', 'create_invite is idempotent per (challenge, inviter)');
select throws_ok(format($$select public.create_invite(%L)$$, :'ch_old'),
  'P0001', 'Bu challenge bitti', 'no invite link for an ended challenge');
select tests.authenticate_as('mert');
select public.create_invite(:'ch_main') as code_m \gset
select isnt(:'code_m'::text, :'code_o'::text, 'each member gets their own invite code');
select tests.authenticate_as('nil');
select throws_ok(format($$select public.create_invite(%L)$$, :'ch_main'),
  '42501', 'Bu challenge''a davet edemezsin', 'an invited (not joined) member cannot create an invite link');
select tests.authenticate_as('selin');
select throws_ok(format($$select public.create_invite(%L)$$, :'ch_main'),
  '42501', 'Bu challenge''a davet edemezsin', 'a non-member cannot create an invite link');
reset role;
select results_eq(
  format($$select challenge_id, inviter_id, revoked_at from public.challenge_invites where code = %L$$, :'code_o'),
  format($$values (%L::uuid, %L::uuid, null::timestamptz)$$, :'ch_main', :'o'),
  'invite row stores challenge and inviter');

-- ================================================================================================
-- 6. get_invite_preview (anon / authenticated)
-- ================================================================================================

select tests.clear_authentication();
select public.get_invite_preview(:'code_o') as pv \gset
select isnt(:'pv'::jsonb, null, 'anon gets a preview for a valid code');
select is((select array_agg(k order by k) from jsonb_object_keys(:'pv'::jsonb) k),
  array['already_member', 'challenge', 'inviter', 'member_count', 'members'],
  'preview: only the InviteLanding sections at the top level');
select is((select array_agg(k order by k) from jsonb_object_keys(:'pv'::jsonb -> 'inviter') k),
  array['avatar_path', 'avatar_tint', 'display_name'],
  'preview: inviter exposes only display name and avatar (no id, username, settings)');
select is((select array_agg(k order by k) from jsonb_object_keys(:'pv'::jsonb -> 'challenge') k),
  array['duration_days', 'end_date', 'icon', 'invite_message', 'start_date', 'task_type', 'tint', 'title'],
  'preview: challenge card fields only (no id, creator, reminder, number settings)');
select results_eq(
  format($$select p #>> '{inviter,display_name}', p #>> '{challenge,title}', p #>> '{challenge,task_type}',
                  (p #>> '{challenge,duration_days}')::int, (p #>> '{challenge,start_date}')::date,
                  p #>> '{challenge,invite_message}', (p ->> 'member_count')::int, (p ->> 'already_member')::boolean
           from (select %L::jsonb as p) x$$, :'pv'),
  format($$values ('Olcay'::text, 'Akşam 20 dakika yürüyüş'::text, 'check'::text, 10, %L::date,
                   'Kaçıran baklava ısmarlar.'::text, 3, false)$$, :'today'),
  'preview values: inviter name, title, type, duration, start, message, 3 joined, anon not a member');
select results_eq(
  format($$select array_agg(e ->> 'initial' order by e ->> 'initial'),
                  bool_and((select array_agg(k order by k) from jsonb_object_keys(e) k) = array['avatar_tint', 'initial'])
           from jsonb_array_elements(%L::jsonb -> 'members') e$$, :'pv'),
  $$values (array['E', 'M', 'O'], true)$$,
  'preview: members are only initials and avatar tints of active members');
select ok(
  (:'pv'::jsonb #- '{inviter,avatar_path}')::text !~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
  and :'pv'::jsonb::text !~ '(olcay|mert|ece|can|nil)',
  'preview leaks no user/challenge ids (besides the public avatar path) and no usernames');
select is(public.get_invite_preview('ZZZZZZZZZZ'), null, 'unknown code: null preview');
select is(public.get_invite_preview(null), null, 'null code: null preview');
select tests.authenticate_as('mert');
select is((public.get_invite_preview(:'code_o') ->> 'already_member')::boolean, true,
  'preview tells an active member they already joined');
select tests.authenticate_as('kaan');
select is(public.get_invite_preview(:'code_o'), null, 'preview is hidden from a user who blocked the inviter');

-- revoke_invite
select tests.authenticate_as('olcay');
select lives_ok(format($$select public.revoke_invite(%L)$$, :'ch_main'), 'inviter revokes their link');
select public.create_invite(:'ch_main') as code_o2 \gset
select isnt(:'code_o2'::text, :'code_o'::text, 'after revoking, create_invite issues a fresh code');
select tests.clear_authentication();
select is(public.get_invite_preview(:'code_o'), null, 'revoked code: null preview');
reset role;
select isnt((select revoked_at from public.challenge_invites where code = :'code_o'), null, 'revoked_at is set');

-- ================================================================================================
-- 7. join_challenge_by_invite
-- ================================================================================================

select tests.authenticate_as('selin');
select lives_ok(format($$select public.join_challenge_by_invite(%L)$$, :'code_o2'), 'a stranger joins with a valid link');
reset role;
select results_eq(
  format($$select status::text, role::text, invited_by, invite_code, joined_on from public.challenge_members
           where challenge_id = %L and user_id = %L$$, :'ch_main', :'s'),
  format($$values ('active'::text, 'member'::text, %L::uuid, %L::text, %L::date)$$, :'o', :'code_o2', :'today'),
  'link join: active member, invited_by = inviter, invite code recorded, joined today');
select tests.authenticate_as('selin');
select is((select invite_code from public.join_challenge_by_invite(:'code_m')), :'code_o2',
  'joining again (even with another member''s link) is a no-op returning the existing membership');
select throws_ok(format($$select public.join_challenge_by_invite(%L)$$, :'code_o'),
  'P0002', 'Davet linki geçersiz', 'a revoked code cannot be used');
select throws_ok($$select public.join_challenge_by_invite('ZZZZZZZZZZ')$$,
  'P0002', 'Davet linki geçersiz', 'an unknown code cannot be used');
select tests.authenticate_as('kaan');
select throws_ok(format($$select public.join_challenge_by_invite(%L)$$, :'code_o2'),
  'P0002', 'Davet linki geçersiz', 'cannot join through the link of someone you blocked / who blocked you');
-- An invited user joining through a link becomes active
reset role;
select pg_temp.mk_user('pelin') as pl \gset
insert into public.challenge_members (challenge_id, user_id, status, invited_by)
values (:'ch_main', :'pl', 'invited', :'o');
select tests.authenticate_as('pelin');
select is((select status::text from public.join_challenge_by_invite(:'code_o2')), 'active',
  'a pending invitee joining through a link becomes active');
-- A member who left cannot come back through a link (it would erase the missed days)
select tests.authenticate_as('can');
select throws_ok(format($$select public.join_challenge_by_invite(%L)$$, :'code_o2'),
  'P0001', 'Ayrıldığın challenge''a tekrar katılamazsın', 'a member who left cannot rejoin by link');
-- Ended / full challenges (codes inserted directly; create_invite refuses on ended challenges)
reset role;
insert into public.challenge_invites (code, challenge_id, inviter_id) values
  ('OldCode123', :'ch_old', :'o'), ('FullCode12', :'ch_full', :'o');
select tests.authenticate_as('zeynep');
select throws_ok($$select public.join_challenge_by_invite('OldCode123')$$,
  'P0001', 'Bu challenge bitti', 'cannot join an ended challenge through a link');
select throws_ok($$select public.join_challenge_by_invite('FullCode12')$$,
  'P0001', 'Grup dolu', 'cannot join a full group through a link');
-- Inviter left -> link dead; the leaver cannot come back through someone else's link
select tests.authenticate_as('mert');
select lives_ok(format($$select public.leave_challenge(%L)$$, :'ch_main'), 'mert (who owns code_m) leaves');
select tests.authenticate_as('zeynep');
select throws_ok(format($$select public.join_challenge_by_invite(%L)$$, :'code_m'),
  'P0002', 'Davet linki geçersiz', 'the link of a member who left no longer works');
select is(public.get_invite_preview(:'code_m'), null, 'the link of a member who left has no preview');
select tests.authenticate_as('mert');
select throws_ok(format($$select public.join_challenge_by_invite(%L)$$, :'code_o2'),
  'P0001', 'Ayrıldığın challenge''a tekrar katılamazsın', 'a member who left cannot rejoin by another member''s link');
reset role;
select results_eq(
  format($$select status::text, left_on from public.challenge_members where challenge_id = %L and user_id = %L$$,
         :'ch_main', :'m'),
  format($$values ('left'::text, %L::date)$$, :'today'),
  'no rejoin: the membership stays left');
select tests.clear_authentication();
select throws_ok(format($$select public.join_challenge_by_invite(%L)$$, :'code_o2'),
  '42501', null, 'anon cannot join (must sign in first)');
reset role;

-- ================================================================================================
-- 8. leave_challenge: member, owner (transfer), last member (delete)
-- ================================================================================================

select pg_temp.mk_ch('Ayrılık', :'today'::date - 2, 10, :'o', null, now() - interval '50 hours') as ch_leave \gset
select pg_temp.add_member(:'ch_leave', :'c', 'active', now() - interval '40 hours')
     + pg_temp.add_member(:'ch_leave', :'z', 'active', now() - interval '45 hours')
     + pg_temp.add_member(:'ch_leave', :'m', 'active', now() - interval '30 hours')
     + pg_temp.add_member(:'ch_leave', :'e', 'invited', p_invited_by => :'o') as x4 \gset
select pg_temp.ci(:'z', :'ch_leave', :'today'::date - 2, :'today'::date - 1) as x5 \gset
insert into public.challenge_invites (code, challenge_id, inviter_id) values ('LeaveCode1', :'ch_leave', :'z');

select tests.authenticate_as('mert');
select lives_ok(format($$select public.leave_challenge(%L)$$, :'ch_leave'), 'a member leaves');
select throws_ok(format($$select public.leave_challenge(%L)$$, :'ch_leave'),
  'P0002', 'Bu challenge''da değilsin', 'cannot leave twice');
select throws_ok(format($$select public.checkin(%L)$$, :'ch_leave'),
  '42501', 'Bu challenge''da değilsin', 'a member who left cannot check in');
select is_empty(format($$select 1 from public.challenge_board(%L)$$, :'ch_leave'),
  'a member who left no longer sees the board');
select throws_ok(format($$select public.create_invite(%L)$$, :'ch_leave'),
  '42501', 'Bu challenge''a davet edemezsin', 'a member who left cannot create an invite link');
select tests.authenticate_as('ece');
select throws_ok(format($$select public.leave_challenge(%L)$$, :'ch_leave'),
  'P0002', 'Bu challenge''da değilsin', 'an invited (not joined) user cannot leave');
select tests.authenticate_as('selin');
select throws_ok(format($$select public.leave_challenge(%L)$$, :'ch_leave'),
  'P0002', 'Bu challenge''da değilsin', 'a non-member cannot leave');
reset role;
select results_eq(
  format($$select user_id, role::text, status::text, left_on from public.challenge_members
           where challenge_id = %L and user_id in (%L, %L) order by left_on nulls first$$, :'ch_leave', :'o', :'m'),
  format($$values (%L::uuid, 'owner'::text, 'active'::text, null::date), (%L::uuid, 'member'::text, 'left'::text, %L::date)$$,
         :'o', :'m', :'today'),
  'member leave: status left with left_on = today; owner unchanged');

select tests.authenticate_as('olcay');
select lives_ok(format($$select public.leave_challenge(%L)$$, :'ch_leave'), 'the owner leaves');
reset role;
select results_eq(
  format($$select user_id, role::text, status::text from public.challenge_members
           where challenge_id = %L and (role = 'owner' or user_id = %L) order by role desc$$, :'ch_leave', :'o'),
  format($$values (%L::uuid, 'owner'::text, 'active'::text), (%L::uuid, 'member'::text, 'left'::text)$$, :'z', :'o'),
  'owner leave: ownership goes to the earliest active member (zeynep, not the later can or the invitee)');
select is((select count(*)::int from public.challenge_members where challenge_id = :'ch_leave' and role = 'owner'), 1,
  'exactly one owner after the transfer');

select tests.authenticate_as('can');
select lives_ok(format($$select public.leave_challenge(%L)$$, :'ch_leave'), 'another member leaves');
select tests.authenticate_as('zeynep');
select lives_ok(format($$select public.leave_challenge(%L)$$, :'ch_leave'), 'the last active member (now owner) leaves');
reset role;
select results_eq(
  format($$select count(*)::int from public.challenges where id = %L$$, :'ch_leave'), array[1],
  'last active member leaving keeps the challenge (history: streaks, check-ins, garden)');
select results_eq(
  format($$select status::text, count(*)::int, count(*) filter (where role = 'owner')::int
           from public.challenge_members where challenge_id = %L group by status$$, :'ch_leave'),
  $$values ('left'::text, 4, 0)$$,
  'no active member left: pending invites dropped, past memberships kept, no owner');
select isnt_empty($$select 1 from public.challenge_invites where code = 'LeaveCode1' and revoked_at is not null$$,
  'its invite links are revoked');

-- ================================================================================================
-- 9. checkin
-- ================================================================================================

select tests.authenticate_as('olcay');
select lives_ok(format($$select public.checkin(%L)$$, :'ch_main'), 'check task: one-tap check-in');
reset role;
select results_eq(
  format($$select local_date, value, photo_path, note from public.checkins where user_id = %L and challenge_id = %L$$,
         :'o', :'ch_main'),
  format($$values (%L::date, null::numeric, null::text, null::text)$$, :'today'),
  'check-in stored on the caller''s local today with no payload');
select tests.authenticate_as('olcay');
select throws_ok(format($$select public.checkin(%L, p_value => 1)$$, :'ch_main'),
  '22023', 'Bu görev tek dokunuşla işaretlenir', 'check task rejects a value');
select throws_ok(format($$select public.checkin(%L, p_photo_path => %L)$$, :'ch_main', :'o' || '/' || :'ch_main' || '/a.jpg'),
  '22023', 'Bu görev tek dokunuşla işaretlenir', 'check task rejects a photo');
select lives_ok(format($$select public.checkin(%L, p_note => 'ilk')$$, :'ch_main'), 're-sending the same day is accepted');
select lives_ok(format($$select public.checkin(%L, p_note => 'ikinci')$$, :'ch_main'), 'and again with another note');
reset role;
select results_eq(
  format($$select count(*)::int, max(note) from public.checkins where user_id = %L and challenge_id = %L$$, :'o', :'ch_main'),
  $$values (1, 'ikinci'::text)$$,
  'same-day check-in is an upsert: one row, latest note');
select tests.authenticate_as('olcay');
select is((select note from public.checkin(:'ch_main', p_note => '   ')), null, 'a blank note is stored as null');
select throws_ok(format($$select public.checkin(%L, p_note => %L)$$, :'ch_main', repeat('n', 201)),
  '23514', null, 'note longer than 200 characters is rejected');
select lives_ok(format($$select public.checkin(%L, p_note => %L)$$, :'ch_main', repeat('n', 200)),
  'a 200-character note is accepted');
select throws_ok(format($$select public.checkin(%L, p_local_date => %L)$$, :'ch_main', :'today'::date + 1),
  'P0001', 'Bu gün artık işaretlenemez', 'cannot check in for tomorrow');
select throws_ok(format($$select public.checkin(%L, p_local_date => %L)$$, :'ch_main', :'today'::date - 3),
  'P0001', 'Bu gün artık işaretlenemez', 'cannot backfill an older day');
select throws_ok(format($$select public.checkin(%L)$$, :'ch_future'),
  'P0001', 'Challenge bu gün sürmüyor', 'cannot check in before the challenge starts');
select throws_ok(format($$select public.checkin(%L)$$, :'ch_old'),
  'P0001', 'Challenge bu gün sürmüyor', 'cannot check in after the challenge ended');

-- number task
select throws_ok(format($$select public.checkin(%L)$$, :'ch_num'),
  '22023', 'Geçersiz değer', 'number task requires a value');
select throws_ok(format($$select public.checkin(%L, p_value => -1)$$, :'ch_num'),
  '22023', 'Geçersiz değer', 'number task rejects a negative value');
select throws_ok(format($$select public.checkin(%L, p_value => 601)$$, :'ch_num'),
  '22023', 'Geçersiz değer', 'number task rejects a value above number_max');
select throws_ok(format($$select public.checkin(%L, p_value => 60, p_photo_path => %L)$$, :'ch_num', :'o' || '/' || :'ch_num' || '/a.jpg'),
  '22023', 'Bu görev sayı ile işaretlenir', 'number task rejects a photo');
select is((select value from public.checkin(:'ch_num', p_value => 600)), 600::numeric, 'number task accepts number_max');
select is((select value from public.checkin(:'ch_num', p_value => 10)), 10::numeric,
  'a value below the day''s target is accepted (overwrites the same day)');
select throws_ok(format($$select public.checkin(%L, p_value => 'NaN')$$, :'ch_num2'),
  null, null, 'number task without a max rejects NaN');
select throws_ok(format($$select public.checkin(%L, p_value => 'Infinity')$$, :'ch_num2'),
  null, null, 'number task without a max rejects Infinity');
reset role;
select results_eq(
  format($$select app.is_covered(%L, %L, %L), (select target from app.today_tasks(%L, now()) where challenge_id = %L)$$,
         :'o', :'ch_num', :'today', :'o', :'ch_num'),
  $$values (true, 60::numeric)$$,
  'below-target value (10 < 60) still covers the day');

-- photo task
select tests.authenticate_as('olcay');
select throws_ok(format($$select public.checkin(%L)$$, :'ch_photo'),
  '22023', 'Fotoğraf kanıtı gerekli', 'photo task requires a photo path');
select throws_ok(format($$select public.checkin(%L, p_photo_path => %L)$$, :'ch_photo', :'m' || '/' || :'ch_photo' || '/a.jpg'),
  '22023', 'Fotoğraf kanıtı gerekli', 'photo path in another user''s folder is rejected');
select throws_ok(format($$select public.checkin(%L, p_photo_path => %L)$$, :'ch_photo', :'o' || '/' || :'ch_main' || '/a.jpg'),
  '22023', 'Fotoğraf kanıtı gerekli', 'photo path under another challenge is rejected');
select throws_ok(format($$select public.checkin(%L, p_photo_path => %L)$$, :'ch_photo', 'proofs/' || :'o' || '/' || :'ch_photo' || '/a.jpg'),
  '22023', 'Fotoğraf kanıtı gerekli', 'photo path must start with the caller''s own folder');
select throws_ok(format($$select public.checkin(%L, p_photo_path => %L)$$, :'ch_photo', :'o' || '/' || :'ch_photo' || '/a.jpg'),
  '22023', 'Fotoğraf kanıtı gerekli', 'photo path must point to an uploaded file');
select lives_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('proofs', %L, auth.uid()::text)$$,
                       :'o' || '/' || :'ch_photo' || '/a.jpg'),
  'the member uploads the proof first');
select throws_ok(format($$select public.checkin(%L, p_value => 3, p_photo_path => %L)$$, :'ch_photo', :'o' || '/' || :'ch_photo' || '/a.jpg'),
  '22023', 'Bu görev fotoğrafla işaretlenir', 'photo task rejects a value');
select is((select photo_path from public.checkin(:'ch_photo', p_photo_path => :'o' || '/' || :'ch_photo' || '/a.jpg',
                                                 p_note => '24 sayfa.')),
  :'o' || '/' || :'ch_photo' || '/a.jpg', 'photo task accepts a photo in {uid}/{challenge}/');

-- membership
select tests.authenticate_as('bora');
select throws_ok(format($$select public.checkin(%L)$$, :'ch_main'),
  '42501', 'Bu challenge''da değilsin', 'a non-member cannot check in');
select tests.authenticate_as('nil');
select throws_ok(format($$select public.checkin(%L)$$, :'ch_main'),
  '42501', 'Bu challenge''da değilsin', 'an invited (not joined) member cannot check in');
select tests.clear_authentication();
select throws_ok(format($$select public.checkin(%L)$$, :'ch_main'), '42501', null, 'anon cannot check in');
reset role;

-- Time travel: grace window, member range, timezone (as postgres through app.do_checkin)
select id as ch_tt from app.do_create_challenge(:'z', null, 'Zaman', 'check', 10, null, null, null, null, null, 0, null,
                                                null, '{}', '2026-09-01 10:00+03') \gset
select pg_temp.add_member(:'ch_tt', :'c', 'active', '2026-09-03 00:30+03', '2026-09-03')
     + pg_temp.add_member(:'ch_tt', :'ny', 'active', '2026-09-01 10:00+03', '2026-09-01') as x6 \gset
select is((app.do_checkin(:'z', :'ch_tt', null, null, null, '2026-09-02', '2026-09-03 01:30+03')).local_date, '2026-09-02'::date,
  'within the 2 h grace the previous day can still be checked in');
select is((app.do_checkin(:'z', :'ch_tt', null, null, null, null, '2026-09-03 01:30+03')).local_date, '2026-09-03'::date,
  'during the grace window the default day is the new local day');
select throws_ok(
  format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-03', '2026-09-04 02:00+03')$$, :'z', :'ch_tt'),
  'P0001', 'Bu gün artık işaretlenemez', 'at 02:00 the previous day is closed');
select throws_ok(
  format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-02', '2026-09-03 01:00+03')$$, :'c', :'ch_tt'),
  'P0001', 'Challenge bu gün sürmüyor', 'cannot check in for a day before the member joined');
select is((app.do_checkin(:'ny', :'ch_tt', null, null, null, null, '2026-09-03 03:00+03')).local_date, '2026-09-02'::date,
  'local day follows the member''s own timezone (New York is still on the 2nd)');

-- ================================================================================================
-- 10. undo_checkin
-- ================================================================================================

select tests.authenticate_as('ece');
select is(public.undo_checkin(:'ch_main'), false, 'undo by another member does not touch my check-in');
select tests.authenticate_as('olcay');
select is(public.undo_checkin(:'ch_main'), true, 'undo removes today''s check-in');
select is(public.undo_checkin(:'ch_main'), false, 'undo again: nothing to remove');
select throws_ok(format($$select public.undo_checkin(%L, %L)$$, :'ch_main', :'today'::date - 3),
  'P0001', 'Geçmiş günler değiştirilemez', 'cannot undo a closed day');
reset role;
select is_empty(format($$select 1 from public.checkins where user_id = %L and challenge_id = %L$$, :'o', :'ch_main'),
  'undo deleted the row');
select is(app.do_undo_checkin(:'z', :'ch_tt', '2026-09-02', '2026-09-03 01:45+03'), true,
  'within the grace window the previous day can be undone');
select throws_ok(
  format($$select app.do_undo_checkin(%L, %L, '2026-09-03', '2026-09-04 02:30+03')$$, :'z', :'ch_tt'),
  'P0001', 'Geçmiş günler değiştirilemez', 'after the grace window the previous day cannot be undone');

-- ================================================================================================
-- 11. rescue_streak (free) and grant_ad_rescue (service role)
-- ================================================================================================

select pg_temp.mk_user('rana') as r \gset
-- the most recently closed local day: still inside its 24 h rescue window right now
select ((now() at time zone 'Europe/Istanbul') - interval '2 hours')::date - 1 as rd \gset
select pg_temp.mk_ch('Kurtar 1', :'rd'::date - 2, 10, :'r') as ch_r1 \gset
select pg_temp.mk_ch('Kurtar 2', :'rd'::date - 2, 10, :'r') as ch_r2 \gset
select pg_temp.mk_ch('Kurtar 3', :'rd'::date - 2, 10, :'r') as ch_r3 \gset
select pg_temp.mk_ch('Seri yok', :'rd'::date - 2, 10, :'r') as ch_r0 \gset
-- ch_r4: missed rd - 1 (its 24 h window is already over), checked in rd - 3, rd - 2 and rd
select pg_temp.mk_ch('Geç kaldım', :'rd'::date - 3, 10, :'r') as ch_r4 \gset
select pg_temp.ci(:'r', :'ch_r4', :'rd'::date - 3, :'rd'::date - 2) + pg_temp.ci(:'r', :'ch_r4', :'rd', :'rd') as x7b \gset
select pg_temp.ci(:'r', :'ch_r1', :'rd'::date - 2, :'rd'::date - 1) + pg_temp.ci(:'r', :'ch_r2', :'rd'::date - 2, :'rd'::date - 1)
     + pg_temp.ci(:'r', :'ch_r3', :'rd'::date - 2, :'rd'::date - 1) as x7 \gset

select tests.authenticate_as('rana');
select lives_ok(format($$select public.rescue_streak(%L, %L)$$, :'ch_r1', :'rd'), 'free rescue of the missed day');
select throws_ok(format($$select public.rescue_streak(%L, %L)$$, :'ch_r2', :'rd'),
  'P0001', 'Bu ayın ücretsiz kurtarma hakkı kullanıldı', 'only one free rescue per local month');
select throws_ok(format($$select public.rescue_streak(%L, %L)$$, :'ch_r1', :'rd'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'an already rescued day cannot be rescued again');
select throws_ok(format($$select public.rescue_streak(%L, %L)$$, :'ch_r3', :'rd'::date - 1),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'a checked-in day cannot be rescued');
select throws_ok(format($$select public.rescue_streak(%L, %L)$$, :'ch_r0', :'rd'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'nothing to rescue when there was no streak before the miss');
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'ssv-forged-0001')$$, :'r', :'ch_r2', :'rd'),
  '42501', null, 'an authenticated user cannot grant themselves an ad rescue');
select tests.authenticate_as('olcay');
select throws_ok(format($$select public.rescue_streak(%L, %L)$$, :'ch_r2', :'rd'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'a non-member cannot rescue');
select tests.clear_authentication();
select throws_ok(format($$select public.rescue_streak(%L, %L)$$, :'ch_r2', :'rd'), '42501', null, 'anon cannot rescue');
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'ssv-forged-0002')$$, :'r', :'ch_r2', :'rd'),
  '42501', null, 'anon cannot grant an ad rescue');
reset role;
select results_eq(
  format($$select rescued_date, method::text, quota_month, ad_reward_id from public.streak_rescues
           where user_id = %L and challenge_id = %L$$, :'r', :'ch_r1'),
  format($$values (%L::date, 'free'::text, date_trunc('month', app.local_date(%L, now()))::date, null::text)$$, :'rd', :'r'),
  'free rescue row: missed day, method free, quota = current local month');
select is(app.challenge_streak(:'r', :'ch_r1', now()), 3, 'rescued day keeps the streak going (2 check-ins + rescue)');

-- Exact window boundary (time travel): 06-03 closes 06-04 02:00 local, rescuable until 06-05 02:00
select pg_temp.mk_user('sena') as se \gset
select id as ch_win from app.do_create_challenge(:'se', null, 'Pencere', 'check', 10, null, null, null, null, null, 0, null,
                                                 null, '{}', '2026-06-01 09:00+03') \gset
select pg_temp.ci(:'se', :'ch_win', '2026-06-01', '2026-06-02') as x7c \gset
select throws_ok(
  format($$select app.apply_rescue(%L, %L, '2026-06-03', 'ad', 'ssv-win-0001', '2026-06-04 01:59+03')$$, :'se', :'ch_win'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'rescue window: not before the missed day has closed (grace still open)');
select throws_ok(
  format($$select app.apply_rescue(%L, %L, '2026-06-03', 'ad', 'ssv-win-0002', '2026-06-05 02:00+03')$$, :'se', :'ch_win'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'rescue window: closed exactly 24 h after the day closed');
select lives_ok(
  format($$select app.apply_rescue(%L, %L, '2026-06-03', 'ad', 'ssv-win-0003', '2026-06-05 01:59+03')$$, :'se', :'ch_win'),
  'rescue window: still open one minute before the 24 h are over');

select tests.authenticate_as_service_role();
select lives_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'ssv-0001-abcdef')$$, :'r', :'ch_r2', :'rd'),
  'service role grants an ad rescue after SSV');
-- replaying the same reward for another challenge may fail or be a no-op, but must not grant a second rescue
do $$
begin
  perform public.grant_ad_rescue(tests.get_supabase_uid('rana'), (select id from public.challenges where title = 'Kurtar 3'),
                                 ((now() at time zone 'Europe/Istanbul') - interval '2 hours')::date - 1, 'ssv-0001-abcdef');
exception when others then null;
end
$$;
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'short')$$, :'r', :'ch_r3', :'rd'),
  '22023', 'Geçersiz ödül kimliği', 'too short ad reward id is rejected');
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, null)$$, :'r', :'ch_r3', :'rd'),
  '22023', 'Geçersiz ödül kimliği', 'missing ad reward id is rejected');
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'ssv-0002-abcdef')$$, :'r', :'ch_r4', :'rd'::date - 1),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'a miss whose 24 h window is over cannot be rescued (even with an ad)');
reset role;
select results_eq(
  format($$select method::text, ad_reward_id, quota_month from public.streak_rescues where user_id = %L and challenge_id = %L$$,
         :'r', :'ch_r2'),
  $$values ('ad'::text, 'ssv-0001-abcdef'::text, null::date)$$,
  'ad rescue row stores the reward id and no free quota');
select is_empty(format($$select 1 from public.streak_rescues where user_id = %L and challenge_id = %L$$, :'r', :'ch_r3'),
  'an ad reward id cannot be replayed to rescue another challenge');

-- ================================================================================================
-- 12. challenge_board: ranking and block filtering
-- ================================================================================================

select pg_temp.mk_user('ayla') as ba \gset
select pg_temp.mk_user('berk') as bb \gset
select pg_temp.mk_user('cem')  as bc \gset
select pg_temp.mk_user('dila') as bd \gset
select pg_temp.mk_user('emre') as be \gset
select pg_temp.mk_user('fatma') as bf \gset
select pg_temp.mk_ch('Sıralama', :'today'::date - 5, 10, :'ba', null, now() - interval '5 days') as ch_board \gset
select pg_temp.add_member(:'ch_board', :'bb', 'active', now() - interval '4 days 23 hours', :'today'::date - 5)
     + pg_temp.add_member(:'ch_board', :'bc', 'active', now() - interval '4 days 22 hours', :'today'::date - 5)
     + pg_temp.add_member(:'ch_board', :'bd', 'active', now() - interval '6 days', :'today'::date - 5)
     + pg_temp.add_member(:'ch_board', :'be', 'invited', p_invited_by => :'ba')
     + pg_temp.add_member(:'ch_board', :'bf', 'left', now() - interval '6 days', :'today'::date - 5, :'today'::date - 1) as x8 \gset
select pg_temp.ci(:'ba', :'ch_board', :'today'::date - 5, :'today'::date - 1)   -- 5 days, today open
     + pg_temp.ci(:'bb', :'ch_board', :'today'::date - 5, :'today')             -- 6 days incl. today
     + pg_temp.ci(:'bc', :'ch_board', :'today'::date - 3, :'today'::date - 1)   -- missed 2 closed days, then 3
     + pg_temp.ci(:'bd', :'ch_board', :'today'::date - 5, :'today')             -- 6 days, joined earliest
     + pg_temp.ci(:'bf', :'ch_board', :'today'::date - 5, :'today'::date - 2) as x9 \gset
insert into public.blocks (blocker_id, blocked_id) values (:'ba', :'bd');

select tests.authenticate_as('berk');
select results_eq(
  format($$select user_id, rank, streak, days_done, done_today from public.challenge_board(%L)$$, :'ch_board'),
  format($$values (%L::uuid, 1, 6, 6, true), (%L::uuid, 2, 6, 6, true), (%L::uuid, 3, 5, 5, false), (%L::uuid, 4, 3, 3, false)$$,
         :'bd', :'bb', :'ba', :'bc'),
  'board: ranked by streak, then days done, then join time; invited and left members are not listed');
select results_eq(
  format($$select display_name, username, role::text from public.challenge_board(%L) where user_id = %L$$, :'ch_board', :'ba'),
  $$values ('Ayla'::text, 'ayla'::text, 'owner'::text)$$,
  'board rows carry public profile fields and the role');
select tests.authenticate_as('ayla');
select results_eq(
  format($$select user_id, rank from public.challenge_board(%L)$$, :'ch_board'),
  format($$values (%L::uuid, 1), (%L::uuid, 2), (%L::uuid, 3)$$, :'bb', :'ba', :'bc'),
  'board: the blocker does not see the user they blocked');
select tests.authenticate_as('dila');
select results_eq(
  format($$select user_id from public.challenge_board(%L)$$, :'ch_board'),
  format($$values (%L::uuid), (%L::uuid), (%L::uuid)$$, :'bd', :'bb', :'bc'),
  'board: the blocked user does not see the blocker either');
select tests.authenticate_as('emre');
select is((select count(*)::int from public.challenge_board(:'ch_board')), 4, 'board: an invited user can preview the group');
select tests.authenticate_as('fatma');
select is_empty(format($$select 1 from public.challenge_board(%L)$$, :'ch_board'), 'board: a member who left sees nothing');
select tests.authenticate_as('selin');
select is_empty(format($$select 1 from public.challenge_board(%L)$$, :'ch_board'), 'board: a stranger sees nothing');
reset role;

-- ================================================================================================
-- 13. friends_today
-- ================================================================================================

select pg_temp.mk_user('vera')   as fv \gset
select pg_temp.mk_user('ali')    as fa \gset
select pg_temp.mk_user('bulut')  as fb \gset
select pg_temp.mk_user('cansu')  as fc \gset
select pg_temp.mk_user('deren')  as fd \gset
select pg_temp.mk_user('erdem')  as fe \gset
select pg_temp.befriend(:'fv', :'fa') + pg_temp.befriend(:'fb', :'fv') + pg_temp.befriend(:'fv', :'fc') as x10 \gset
insert into public.friendships (requester_id, addressee_id) values (:'fd', :'fv');
-- erdem blocked vera; a stale accepted friendship row must still not expose him
insert into public.blocks (blocker_id, blocked_id) values (:'fe', :'fv');
select pg_temp.befriend(:'fv', :'fe') as x11 \gset

select pg_temp.mk_ch('Ortak', :'today'::date - 2, 10, :'fa') as ch_ft \gset
select pg_temp.add_member(:'ch_ft', :'fv', 'active', now() - interval '2 days', :'today'::date - 2) as x12 \gset
select pg_temp.ci(:'fa', :'ch_ft', :'today'::date - 2, :'today') as x13 \gset
select pg_temp.mk_ch('Bulut gizli 1', :'today', 7, :'fb') as ch_fb1 \gset
select pg_temp.mk_ch('Bulut gizli 2', :'today', 7, :'fb') as ch_fb2 \gset
select pg_temp.ci(:'fb', :'ch_fb1', :'today', :'today') as x14 \gset
select pg_temp.mk_ch('Erdem', :'today', 7, :'fe') as ch_fe \gset

select tests.authenticate_as('vera');
select results_eq(
  $$select user_id, done_today, active_challenges, shared_challenge_id, shared_challenge_title, streak
    from public.friends_today()$$,
  format($$values (%L::uuid, false, 2, null::uuid, null::text, 0),
                  (%L::uuid, true, 1, %L::uuid, 'Ortak'::text, 3),
                  (%L::uuid, null::boolean, 0, null::uuid, null::text, 0)$$,
         :'fb', :'fa', :'ch_ft', :'fc'),
  'friends_today: waiting first, then done, then no tasks; only the shared challenge is named');
select is_empty(format($$select 1 from public.friends_today() where user_id in (%L, %L)$$, :'fd', :'fe'),
  'friends_today: pending requests and blocked users are not listed');
select is((select display_name from public.friends_today() where user_id = :'fa'), 'Ali', 'friends_today: display name');
select tests.authenticate_as('ali');
select is((select shared_challenge_title from public.friends_today() where user_id = :'fv'), 'Ortak',
  'friends_today: works from the other side too');
reset role;

-- ================================================================================================
-- 14. template_stats
-- ================================================================================================

select tests.clear_authentication();
select (public.template_stats(:'t_iltifat') ->> 'active_count')::int as base_count \gset
reset role;
select pg_temp.mk_ch('İltifat A', :'today', 7, :'fa', :'t_iltifat') as x15 \gset
select pg_temp.mk_ch('İltifat C', :'today', 7, :'fc', :'t_iltifat') as x16 \gset
select pg_temp.mk_ch('İltifat S', :'today'::date - 1, 7, :'s', :'t_iltifat') as x17 \gset
select pg_temp.mk_ch('İltifat D', :'today', 7, :'fd', :'t_iltifat') as x18 \gset
select pg_temp.mk_ch('İltifat E', :'today', 7, :'fe', :'t_iltifat') as ch_ile \gset
select pg_temp.add_member(:'ch_ile', :'fb', 'invited', p_invited_by => :'fe') as x19 \gset
select pg_temp.mk_ch('İltifat eski', :'today'::date - 20, 7, :'z', :'t_iltifat') as x20 \gset

select tests.authenticate_as('vera');
select public.template_stats(:'t_iltifat') as ts \gset
select results_eq(
  format($$select (%1$L::jsonb ->> 'active_count')::int, (%1$L::jsonb ->> 'friends_count')::int,
                  (select array_agg(f ->> 'display_name' order by f ->> 'display_name') from jsonb_array_elements(%1$L::jsonb -> 'friends') f)$$,
         :'ts'),
  format($$values (%s + 5, 2, array['Ali', 'Cansu'])$$, :'base_count'),
  'template_stats: running members counted (not invitees, not ended challenges); friends = accepted, unblocked');
select is(
  (select bool_and((select array_agg(k order by k) from jsonb_object_keys(f) k) = array['avatar_path', 'avatar_tint', 'display_name'])
   from jsonb_array_elements(:'ts'::jsonb -> 'friends') f),
  true, 'template_stats: friends expose only display name and avatar');
select tests.clear_authentication();
select results_eq(
  format($$select (t ->> 'active_count')::int, (t ->> 'friends_count')::int, t -> 'friends'
           from (select public.template_stats(%L) as t) x$$, :'t_iltifat'),
  format($$values (%s + 5, 0, '[]'::jsonb)$$, :'base_count'),
  'template_stats as anon: only the aggregate count');
reset role;

-- ================================================================================================
-- 14b. Leaving and coming back must not rewrite the past (time travel through app.*)
-- ================================================================================================
-- tuna and umut each have a solo challenge X and are in yasin's group Y since 07-01. Both missed Y on
-- 07-11 (overall streak broken, no rescue). On 07-12 they leave Y; tuna rejoins through yasin's link,
-- yasin re-invites umut. The missed 07-11 must still break their overall streak.

select pg_temp.mk_user('tuna')  as tu \gset
select pg_temp.mk_user('umut')  as um \gset
select pg_temp.mk_user('yasin') as ya \gset
select pg_temp.befriend(:'ya', :'um') as x_yu \gset
select id as ch_x  from app.do_create_challenge(:'tu', null, 'Tuna X', 'check', 30, null, null, null, null, null, 0, null,
                                                null, '{}', '2026-07-01 09:00+03') \gset
select id as ch_x2 from app.do_create_challenge(:'um', null, 'Umut X', 'check', 30, null, null, null, null, null, 0, null,
                                                null, '{}', '2026-07-01 09:00+03') \gset
select id as ch_y  from app.do_create_challenge(:'ya', null, 'Yasin Y', 'check', 30, null, null, null, null, null, 0, null,
                                                null, '{}', '2026-07-01 09:00+03') \gset
insert into public.challenge_invites (code, challenge_id, inviter_id) values ('YasinCode1', :'ch_y', :'ya');
select (app.do_join_by_invite(:'tu', 'YasinCode1', '2026-07-01 09:30+03')).status as x_j1 \gset
select (app.do_join_by_invite(:'um', 'YasinCode1', '2026-07-01 09:30+03')).status as x_j2 \gset
select pg_temp.ci(:'tu', :'ch_x', '2026-07-01', '2026-07-11') + pg_temp.ci(:'tu', :'ch_y', '2026-07-01', '2026-07-10')
     + pg_temp.ci(:'um', :'ch_x2', '2026-07-01', '2026-07-11') + pg_temp.ci(:'um', :'ch_y', '2026-07-01', '2026-07-10') as x_ci \gset

select is(app.user_streak(:'tu', '2026-07-12 10:00+03'), 0, 'precondition: missing Y on 07-11 broke the overall streak');
select (app.do_leave_challenge(:'tu', :'ch_y', '2026-07-12 10:00+03')).status as x_l1 \gset
select (app.do_leave_challenge(:'um', :'ch_y', '2026-07-12 10:00+03')).status as x_l2 \gset
select is(app.user_streak(:'tu', '2026-07-12 10:01+03'), 0, 'leaving afterwards does not erase the missed day');
-- rejoin / re-invite may be refused by a fix; either way the history must stay intact
do $$
begin
  perform app.do_join_by_invite(tests.get_supabase_uid('tuna'), 'YasinCode1', '2026-07-12 10:05+03');
exception when others then null;
end
$$;
do $$
begin
  perform app.do_invite(tests.get_supabase_uid('yasin'), (select id from public.challenges where title = 'Yasin Y'),
                        array[tests.get_supabase_uid('umut')], '2026-07-12 10:05+03');
exception when others then null;
end
$$;
select is(app.user_streak(:'tu', '2026-07-12 10:10+03'), 0,
  'leave + rejoin by link does not wipe the missed day from the overall streak');
select is(app.user_streak(:'um', '2026-07-12 10:10+03'), 0,
  'being re-invited after leaving does not wipe the missed day from the overall streak');

-- ================================================================================================
-- 15. Finalisation vs. rescue window (time travel through app.*)
-- ================================================================================================
-- The last day of a challenge closes at end_date + 1, 02:00 and stays rescuable for 24 h. A rescue of the
-- last day must be reflected in the member's final result (days done -> garden plant).

select pg_temp.mk_user('irmak') as ir \gset
select id as ch_last from app.do_create_challenge(:'ir', null, 'Son gün', 'check', 7, null, null, null, null, null, 0, null,
                                                  null, '{}', '2026-08-01 09:00+03') \gset
select count(*)::int as x21 from generate_series(0, 5) g,
  lateral app.do_checkin(:'ir', :'ch_last', null, null, null, null, '2026-08-01 20:00+03'::timestamptz + make_interval(days => g)) \gset
select app.finalize_member(:'ir', :'ch_last', '2026-08-08 03:00+03') as x22 \gset
select lives_ok(
  format($$select app.apply_rescue(%L, %L, '2026-08-07', 'free', null, '2026-08-08 10:00+03')$$, :'ir', :'ch_last'),
  'the missed last day is rescued inside its 24 h window');
select app.finalize_member(:'ir', :'ch_last', '2026-08-09 03:00+03') as x23 \gset
select is((select final_days_done::int from public.challenge_members where challenge_id = :'ch_last' and user_id = :'ir'), 7,
  'a rescue of the last day counts in the final result (7/7 days, garden plant)');

-- ================================================================================================
-- 16. finish_due_challenges (service role only)
-- ================================================================================================

select pg_temp.mk_user('gul')   as fg \gset
select pg_temp.mk_user('hakan') as fh \gset
select pg_temp.befriend(:'fg', :'fa') as x24 \gset
select pg_temp.mk_ch('Bitirdik', :'today'::date - 12, 7, :'fg', null, now() - interval '12 days') as ch_fin \gset
select pg_temp.add_member(:'ch_fin', :'fh', 'active', now() - interval '11 days', :'today'::date - 12) as x25 \gset
select pg_temp.ci(:'fg', :'ch_fin', :'today'::date - 12, :'today'::date - 6)
     + pg_temp.ci(:'fh', :'ch_fin', :'today'::date - 12, :'today'::date - 8) as x26 \gset

select tests.authenticate_as('gul');
select throws_ok($$select public.finish_due_challenges()$$, '42501', null, 'an authenticated user cannot run finish_due_challenges');
select tests.clear_authentication();
select throws_ok($$select public.finish_due_challenges()$$, '42501', null, 'anon cannot run finish_due_challenges');
select tests.authenticate_as_service_role();
select cmp_ok(public.finish_due_challenges(), '>=', 2, 'service role finalises due memberships');
select is(public.finish_due_challenges(), 0, 'a second run has nothing left to finalise');
reset role;
select results_eq(
  format($$select user_id, finished_at is not null, final_days_done::int, final_rescues::int, final_rank::int
           from public.challenge_members where challenge_id = %L order by final_rank$$, :'ch_fin'),
  format($$values (%L::uuid, true, 7, 0, 1), (%L::uuid, true, 5, 0, 2)$$, :'fg', :'fh'),
  'final snapshot: days done, rescues and rank per member');
select results_eq(
  format($$select actor_id, challenge_id, payload ->> 'title' from public.notifications
           where recipient_id = %L and kind = 'friend_finished_challenge'$$, :'fa'),
  format($$values (%L::uuid, %L::uuid, 'Bitirdik'::text)$$, :'fg', :'ch_fin'),
  'a friend is notified when someone completes every day');
select is((select count(*)::int from public.challenge_members where challenge_id = :'ch_old' and finished_at is not null), 1,
  'other ended challenges (olcay''s) are finalised too');
select tests.authenticate_as('gul');
select results_eq(
  format($$select challenge_id, stage::text from public.my_garden() where challenge_id = %L$$, :'ch_fin'),
  format($$values (%L::uuid, 'genc'::text)$$, :'ch_fin'),
  'a fully completed challenge appears in the garden (7 days -> genc)');
select tests.authenticate_as('hakan');
select is_empty($$select 1 from public.my_garden()$$, 'an incomplete run earns no garden plant');
reset role;

select * from finish();
rollback;
