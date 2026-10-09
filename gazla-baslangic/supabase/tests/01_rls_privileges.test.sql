-- Access control: RLS on every table, table/column grants, function EXECUTE privileges,
-- row visibility per relationship (anon, stranger, friend, pending request, co-member,
-- invited member, former member, blocked in both directions, owner) and Storage policies.
--
-- Self-contained: every user, profile and challenge is created inside the transaction and
-- rolled back at the end. Run with `supabase test db` (or pg_prove).
--
-- Cast (all timezones Europe/Istanbul):
--   olcay  owner of c1; friends with mert and kaan; pending request from pina; blocks bora;
--          blocked by deniz
--   mert   friend of olcay, active member of c1, harsh mode on; owner of the full group c3
--   ece    active member of c1 (not a friend), discoverability 'nobody'; owner of ended c4
--   can    invited to c1 (not joined yet)
--   selin  stranger to olcay; owner of photo challenge c2; friend of kaan
--   bora   active member of c1, blocked by olcay
--   deniz  active member of c1, has blocked olcay
--   kaan   friend of olcay and selin, not in any challenge
--   pina   sent a pending friend request to olcay
--   leyla  left c1
--   zafer  invited to the full group c3; finished ece's ended challenge c4 with her
--   kid    signed up (auth user) but has no profile yet
begin;
select plan(271);

-- =========================================================================================
-- Fixture (as postgres: table owner, BYPASSRLS)
-- =========================================================================================

select tests.create_supabase_user('olcay') as o \gset
select tests.create_supabase_user('mert')  as m \gset
select tests.create_supabase_user('ece')   as e \gset
select tests.create_supabase_user('can')   as c \gset
select tests.create_supabase_user('selin') as s \gset
select tests.create_supabase_user('bora')  as b \gset
select tests.create_supabase_user('deniz') as d \gset
select tests.create_supabase_user('kaan')  as k \gset
select tests.create_supabase_user('pina')  as p \gset
select tests.create_supabase_user('leyla') as l \gset
select tests.create_supabase_user('zafer') as z \gset
select tests.create_supabase_user('kid')   as kid \gset

insert into public.profiles (id, username, display_name, harsh_mode) values
  (:'o', 'olcay', 'Olcay', false),
  (:'m', 'mert',  'Mert',  true),
  (:'e', 'ece',   'Ece',   false),
  (:'c', 'can',   'Can',   false),
  (:'s', 'selin', 'Selin', false),
  (:'b', 'bora',  'Bora',  false),
  (:'d', 'deniz', 'Deniz', false),
  (:'k', 'kaan',  'Kaan',  false),
  (:'p', 'pina',  'Pina',  false),
  (:'l', 'leyla', 'Leyla', false),
  (:'z', 'zafer', 'Zafer', false);

-- 19 extra members fill c3 up to the 20 member limit
create temp table fillers on commit drop as
select tests.create_supabase_user('filler' || lpad(i::text, 2, '0')) as id, i
from generate_series(1, 19) as i;
insert into public.profiles (id, username, display_name)
select id, 'filler' || lpad(i::text, 2, '0'), 'Filler ' || i from fillers;

insert into public.user_settings (user_id, birth_year, timezone, discoverability)
select pr.id, 1995, 'Europe/Istanbul',
       case when pr.id = :'e'::uuid then 'nobody' else 'everyone' end::public.discoverability
from public.profiles pr;

-- Friendships: olcay-mert, kaan-olcay, kaan-selin accepted; pina -> olcay pending
insert into public.friendships (requester_id, addressee_id, status, accepted_at) values
  (:'o', :'m', 'accepted', now()),
  (:'k', :'o', 'accepted', now()),
  (:'k', :'s', 'accepted', now()),
  (:'p', :'o', 'pending', null);
select id as fr_pina from public.friendships where requester_id = :'p' \gset

-- c1: started yesterday-but-one, so "day1" is closed and "day1 + 1" is the rescue candidate
select id as c1 from app.do_create_challenge(
  :'o', null, 'Grup challenge', 'check', 7, null, null, 'Hadi', null, null, 0, null, null,
  '{}', now() - interval '2 days 2 hours') \gset
select start_date as day1, start_date + 1 as missed from public.challenges where id = :'c1' \gset
select app.local_date(:'o', now()) as today \gset

insert into public.challenge_members (challenge_id, user_id, role, status, invited_by, joined_at, joined_on, left_on) values
  (:'c1', :'m', 'member', 'active',  :'o', now() - interval '47 hours', :'day1', null),
  (:'c1', :'e', 'member', 'active',  null, now() - interval '46 hours', :'day1', null),
  (:'c1', :'c', 'member', 'invited', :'o', null, null, null),
  (:'c1', :'b', 'member', 'active',  null, now() - interval '45 hours', :'day1', null),
  (:'c1', :'d', 'member', 'active',  null, now() - interval '44 hours', :'day1', null),
  (:'c1', :'l', 'member', 'left',    null, now() - interval '43 hours', :'day1', :'today');

-- c2: selin's photo challenge; c3: mert's full group; c4: ece's ended challenge
select id as c2 from app.do_create_challenge(
  :'s', null, 'Selin foto', 'photo', 7, null, null, null, null, null, 0, null, null, '{}', now()) \gset
select id as c3 from app.do_create_challenge(
  :'m', null, 'Kalabalik grup', 'check', 7, null, null, null, null, null, 0, null, null, '{}', now()) \gset
select id as c4 from app.do_create_challenge(
  :'e', null, 'Bitti', 'check', 7, null, null, null, null, null, 0, null, null, '{}', now() - interval '30 days') \gset

insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on)
select :'c3', f.id, 'active', now(), app.local_date(f.id, now()) from fillers f;
insert into public.challenge_members (challenge_id, user_id, status, invited_by)
values (:'c3', :'z', 'invited', :'m');
-- zafer also finished ece's ended challenge c4 with her (still an 'active' membership row)
insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on)
select :'c4', :'z', 'active', now() - interval '30 days', start_date from public.challenges where id = :'c4';

-- Blocks (after friendships/memberships exist): olcay blocks bora, deniz blocks olcay
insert into public.blocks (blocker_id, blocked_id) values (:'o', :'b'), (:'d', :'o');

-- Check-ins on day1 (c1) and today (c2)
insert into public.checkins (user_id, challenge_id, local_date) values
  (:'o', :'c1', :'day1'), (:'m', :'c1', :'day1'), (:'e', :'c1', :'day1'),
  (:'b', :'c1', :'day1'), (:'d', :'c1', :'day1'), (:'l', :'c1', :'day1');
insert into public.checkins (user_id, challenge_id, local_date, photo_path)
values (:'s', :'c2', :'today', :'s' || '/' || :'c2' || '/day1.jpg');
select id as m_checkin from public.checkins where user_id = :'m' and challenge_id = :'c1' \gset
select id as e_checkin from public.checkins where user_id = :'e' and challenge_id = :'c1' \gset

-- Pokes (the trigger also writes notifications)
insert into public.pokes (sender_id, recipient_id, tone, message_key, created_at) values
  (:'m', :'o', 'hype', 'almost_there', now()),
  (:'m', :'o', 'hype', 'take_five',    now() - interval '10 minutes'),
  (:'o', :'m', 'hype', 'proud_of_you', now()),
  (:'b', :'o', 'hype', 'almost_there', now());
select id as poke_recent from public.pokes where sender_id = :'m' and message_key = 'almost_there' \gset
select id as poke_old    from public.pokes where sender_id = :'m' and message_key = 'take_five' \gset

-- A Diken (system) notification for olcay
insert into public.notifications (recipient_id, kind, actor_id, local_date)
values (:'o', 'daily_reminder', null, :'today');
select id as notif_o from public.notifications where recipient_id = :'o' and kind = 'friend_request' \gset

-- olcay already used this month's free rescue
insert into public.streak_rescues (user_id, challenge_id, rescued_date, method, quota_month)
values (:'o', :'c1', :'day1'::date - 2, 'free', date_trunc('month', :'today'::date)::date);

insert into public.push_tokens (token, user_id, platform) values
  ('ExponentPushToken[olcay00001]', :'o', 'ios'),
  ('ExponentPushToken[mert000001]', :'m', 'android');

insert into public.reports (reporter_id, reported_user_id, reason) values (:'m', :'o', 'other');

insert into public.challenge_invites (code, challenge_id, inviter_id, revoked_at) values
  ('OlcayCode1', :'c1', :'o', null),
  ('Revoked001', :'c1', :'o', now()),
  ('MertCode01', :'c1', :'m', null),
  ('MertCode03', :'c3', :'m', null);

-- Reference data that must stay hidden
insert into public.challenge_templates (slug, title_tr, category, difficulty, task_type, default_duration_days, icon, tint, is_active)
values ('gizli-sablon', 'Gizli', 'quirky', 'easy', 'check', 7, 'check', 'green', false);
insert into public.poke_messages (key, tone, sort_order, text_tr, is_active)
values ('retired_line', 'hype', 99, 'Eski', false);

-- Storage objects (uploaded earlier)
select :'o' || '/' || :'c1' || '/day1.jpg' as o_proof,
       :'m' || '/' || :'c1' || '/day1.jpg' as m_proof,
       :'l' || '/' || :'c1' || '/day1.jpg' as l_proof,
       :'b' || '/' || :'c1' || '/day1.jpg' as b_proof,
       :'s' || '/' || :'c2' || '/day1.jpg' as s_proof,
       :'m' || '/avatar.jpg' as m_avatar,
       :'o' || '/avatar.jpg' as o_avatar \gset
insert into storage.objects (bucket_id, name, owner_id) values
  ('proofs', :'o_proof', :'o'), ('proofs', :'m_proof', :'m'), ('proofs', :'l_proof', :'l'),
  ('proofs', :'b_proof', :'b'), ('proofs', :'s_proof', :'s'), ('avatars', :'m_avatar', :'m');
-- The day1 proofs belong to the day1 check-ins (the group only sees photos attached to a check-in)
update public.checkins set photo_path = user_id || '/' || challenge_id || '/day1.jpg'
where challenge_id = :'c1' and local_date = :'day1' and user_id in (:'o', :'m', :'l', :'b');

-- =========================================================================================
-- 1. RLS is enabled on every table
-- =========================================================================================

select set_eq(
  $$select c.relname::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')$$,
  array['blocks', 'challenge_invites', 'challenge_members', 'challenge_templates', 'challenges',
        'checkins', 'friendships', 'notifications', 'poke_messages', 'pokes', 'profiles',
        'push_tokens', 'reports', 'streak_rescues', 'user_settings'],
  'public has exactly the 15 known tables and no views (a new relation needs RLS tests here)');
select tests.rls_enabled('public');
select tests.rls_enabled('public', 'profiles');
select tests.rls_enabled('public', 'user_settings');
select tests.rls_enabled('public', 'friendships');
select tests.rls_enabled('public', 'blocks');
select tests.rls_enabled('public', 'reports');
select tests.rls_enabled('public', 'poke_messages');
select tests.rls_enabled('public', 'pokes');
select tests.rls_enabled('public', 'notifications');
select tests.rls_enabled('public', 'push_tokens');
select tests.rls_enabled('public', 'challenge_templates');
select tests.rls_enabled('public', 'challenges');
select tests.rls_enabled('public', 'challenge_invites');
select tests.rls_enabled('public', 'challenge_members');
select tests.rls_enabled('public', 'checkins');
select tests.rls_enabled('public', 'streak_rescues');
select tests.rls_enabled('storage', 'objects');
select results_eq($$select id::text, public from storage.buckets where id in ('avatars', 'proofs') order by id$$,
  $$values ('avatars', true), ('proofs', false)$$, 'proofs bucket is private, avatars bucket is public');

-- =========================================================================================
-- 2. Table and column privileges
-- =========================================================================================

select is(
  array(select format('%s:%s', c.relname, pr)
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as pr
        where n.nspname = 'public' and c.relkind = 'r'
          and case when pr = 'DELETE' then has_table_privilege('anon', c.oid, pr)
                   else has_any_column_privilege('anon', c.oid, pr) end
        order by 1),
  array['challenge_templates:SELECT'],
  'anon may only SELECT challenge_templates (no other read or write privilege in public)');

select is(
  array(select format('%s:%s', c.relname, pr)
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        cross join unnest(array['INSERT', 'UPDATE']) as pr
        where n.nspname = 'public' and c.relkind = 'r'
          and has_any_column_privilege('authenticated', c.oid, pr)
        order by 1),
  array['blocks:INSERT', 'challenges:UPDATE', 'profiles:UPDATE', 'user_settings:UPDATE'],
  'authenticated may INSERT/UPDATE directly only blocks, challenges (owner settings), own profile and own settings');

select is(
  array(select format('%s:%s', c.relname, r)
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        cross join unnest(array['anon', 'authenticated']) as r
        where n.nspname = 'public' and c.relkind = 'r' and has_table_privilege(r, c.oid, 'TRUNCATE')
        order by 1),
  '{}'::text[],
  'no API role may TRUNCATE a public table (TRUNCATE bypasses RLS)');

select is(
  array(select a.attname::text from pg_attribute a
        where a.attrelid = 'public.profiles'::regclass and a.attnum > 0 and not a.attisdropped
          and has_column_privilege('authenticated', a.attrelid, a.attnum, 'UPDATE') order by 1),
  array['avatar_path', 'avatar_tint', 'display_name', 'harsh_mode', 'username'],
  'profiles: only username, display_name, avatar_path, avatar_tint, harsh_mode are updatable');

select is(
  array(select a.attname::text from pg_attribute a
        where a.attrelid = 'public.user_settings'::regclass and a.attnum > 0 and not a.attisdropped
          and has_column_privilege('authenticated', a.attrelid, a.attnum, 'UPDATE') order by 1),
  array['daily_reminder_time', 'discoverability', 'locale', 'poke_push_enabled', 'timezone'],
  'user_settings: birth_year, terms_accepted_at, user_id are not updatable');

select is(
  array(select a.attname::text from pg_attribute a
        where a.attrelid = 'public.challenges'::regclass and a.attnum > 0 and not a.attisdropped
          and has_column_privilege('authenticated', a.attrelid, a.attnum, 'UPDATE') order by 1),
  array['invite_message', 'reminder_time', 'short_title', 'title'],
  'challenges: only title, short_title, reminder_time, invite_message are updatable');

-- =========================================================================================
-- 3. Function EXECUTE privileges
-- =========================================================================================

select set_eq(
  $$select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE')$$,
  array['public.diken_stage_for', 'public.get_invite_preview', 'public.template_stats'],
  'anon may execute only diken_stage_for, get_invite_preview and template_stats in public');

select set_eq(
  $$select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'EXECUTE')$$,
  array['public.diken_stage_for', 'public.get_invite_preview', 'public.template_stats',
        'public.is_username_available', 'public.complete_profile', 'public.search_profiles',
        'public.send_friend_request', 'public.accept_friend_request', 'public.send_poke',
        'public.submit_report', 'public.mark_notifications_read', 'public.register_push_token',
        'public.create_challenge', 'public.invite_to_challenge', 'public.respond_to_invite',
        'public.leave_challenge', 'public.create_invite', 'public.revoke_invite',
        'public.join_challenge_by_invite', 'public.checkin', 'public.undo_checkin',
        'public.rescue_streak', 'public.my_today', 'public.my_streak', 'public.my_pending_rescues',
        'public.challenge_board', 'public.friends_today', 'public.my_garden',
        'public.my_recent_days', 'public.friend_profile'],
  'authenticated may execute exactly the user RPCs in public');

select is(
  array(select p.proname::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in ('grant_ad_rescue', 'can_send_diken_push', 'claim_diken_push',
                            'finish_due_challenges')
          and (has_function_privilege('anon', p.oid, 'EXECUTE')
               or has_function_privilege('authenticated', p.oid, 'EXECUTE')
               or not has_function_privilege('service_role', p.oid, 'EXECUTE'))
        order by 1),
  '{}'::text[],
  'grant_ad_rescue, can_send_diken_push, claim_diken_push, finish_due_challenges: service_role only');

select is(
  array(select p.proname::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and has_function_privilege('public', p.oid, 'EXECUTE')
        order by 1),
  '{}'::text[],
  'no public function is executable by PUBLIC');

select is(
  array(select p.proname::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'app'
          and (p.proname like 'do\_%' or p.proname in ('apply_rescue', 'finalize_member', 'finalize_user', 'random_code'))
          and (has_function_privilege('anon', p.oid, 'EXECUTE')
               or has_function_privilege('authenticated', p.oid, 'EXECUTE')
               or not has_function_privilege('service_role', p.oid, 'EXECUTE'))
        order by 1),
  '{}'::text[],
  'app write helpers (do_*, apply_rescue, finalize_*, random_code): service_role only');

select is(
  array(select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname in ('public', 'app') and 'p_at' = any (p.proargnames)
          and (has_function_privilege('anon', p.oid, 'EXECUTE')
               or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
        order by 1),
  '{}'::text[],
  'no function taking an explicit time (p_at) is executable by anon or authenticated');

-- SECURITY DEFINER allow-lists. Trigger functions cannot be called directly and are skipped.
-- authenticated additionally needs the five read helpers that RLS policies call.
select is(
  array(select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname in ('public', 'app') and p.prosecdef and p.prorettype <> 'trigger'::regtype
          and has_function_privilege('anon', p.oid, 'EXECUTE')
          and n.nspname || '.' || p.proname <> all (array['public.get_invite_preview', 'public.template_stats'])
        order by 1),
  '{}'::text[],
  'anon can execute no SECURITY DEFINER function besides get_invite_preview and template_stats');

select is(
  array(select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname in ('public', 'app') and p.prosecdef and p.prorettype <> 'trigger'::regtype
          and has_function_privilege('authenticated', p.oid, 'EXECUTE')
          and n.nspname || '.' || p.proname <> all (array[
            -- RLS helpers (policies on profiles, challenges, challenge_members, pokes,
            -- notifications, checkins, storage.objects)
            'app.is_blocked', 'app.is_member', 'app.is_active_member', 'app.can_see_profile',
            'app.can_see_member_activity', 'app.my_challenge_ids', 'app.my_related_user_ids',
            'app.can_see_proof', 'app.proof_locked',
            -- user RPCs
            'public.get_invite_preview', 'public.template_stats', 'public.is_username_available',
            'public.complete_profile', 'public.search_profiles', 'public.send_friend_request',
            'public.accept_friend_request', 'public.send_poke', 'public.submit_report',
            'public.mark_notifications_read', 'public.register_push_token', 'public.create_challenge',
            'public.invite_to_challenge', 'public.respond_to_invite', 'public.leave_challenge',
            'public.create_invite', 'public.revoke_invite', 'public.join_challenge_by_invite',
            'public.checkin', 'public.undo_checkin', 'public.rescue_streak', 'public.my_today',
            'public.my_streak', 'public.my_pending_rescues', 'public.challenge_board',
            'public.friends_today', 'public.my_garden', 'public.my_recent_days',
            'public.friend_profile'])
        order by 1),
  '{}'::text[],
  'authenticated can execute no SECURITY DEFINER function outside the RPC + RLS-helper allow-list');

select is(
  array(select format('%s:%s', d.defaclnamespace::regnamespace, a.grantee::regrole)
        from pg_default_acl d cross join aclexplode(d.defaclacl) a
        where d.defaclrole = 'postgres'::regrole and d.defaclobjtype = 'f'
          and d.defaclnamespace in ('public'::regnamespace, 'app'::regnamespace)
          and a.grantee = 'anon'::regrole
        order by 1),
  '{}'::text[],
  'functions created later in public/app by migrations are not executable by anon by default');

-- Calling closed functions -----------------------------------------------------------------

select tests.authenticate_as('selin');
select throws_ok(format($$select app.do_checkin(%L, %L, null, null, null, null, now() - interval '3 days')$$, :'s', :'c2'),
  '42501', null, 'authenticated cannot call app.do_checkin (time travel)');
select throws_ok(format($$select app.apply_rescue(%L, %L, %L, 'ad', 'fake-reward-0001', now())$$, :'s', :'c2', :'today'),
  '42501', null, 'authenticated cannot call app.apply_rescue');
select throws_ok(format($$select app.finalize_user(%L, now())$$, :'s'),
  '42501', null, 'authenticated cannot call app.finalize_user');
select throws_ok(format($$select app.do_send_poke(%L, %L, 'roast', 'i_did_it', null, now())$$, :'s', :'o'),
  '42501', null, 'authenticated cannot call app.do_send_poke');
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'reward-00000001')$$, :'s', :'c2', :'today'),
  '42501', null, 'authenticated cannot grant itself an ad rescue');
select throws_ok(format($$select public.can_send_diken_push(%L)$$, :'o'),
  '42501', null, 'authenticated cannot call can_send_diken_push');
select throws_ok($$select public.finish_due_challenges()$$,
  '42501', null, 'authenticated cannot call finish_due_challenges');
select throws_ok(format($$select app.user_timezone(%L)$$, :'o'),
  '42501', null, 'a stranger cannot read another user''s private timezone through app.user_timezone');
select throws_ok(format($$select app.is_covered(%L, %L, %L)$$, :'o', :'c1', :'day1'),
  '42501', null, 'a stranger cannot probe another user''s check-ins through app.is_covered');

select tests.authenticate_as_service_role();
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'short')$$, :'o', :'c1', :'missed'),
  '22023', 'Geçersiz ödül kimliği', 'service_role can call grant_ad_rescue (reward id validated)');
select lives_ok(format($$select public.can_send_diken_push(%L)$$, :'o'),
  'service_role can call can_send_diken_push');

-- Unauthenticated / profile-less callers ---------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated"}';
set local request.jwt.claim.sub = '';
select throws_ok($$select public.my_streak()$$,
  '42501', 'Oturum açman gerekiyor', 'RPCs reject an authenticated role without a user id');
select throws_ok($$select public.complete_profile('ghost.user', 'Ghost', 1990)$$,
  '42501', 'Oturum açman gerekiyor', 'complete_profile rejects a caller without a user id');

select tests.authenticate_as('kid');
select throws_ok($$select public.my_streak()$$,
  'P0001', 'Önce profilini tamamla', 'RPCs reject a signed-up user without a profile');
select throws_ok($$select public.complete_profile('kid.user', 'Kid', 2020)$$,
  '23514', 'En az 13 yaşında olmalısın', 'complete_profile enforces the minimum age');
select throws_ok(format($$insert into public.profiles (id, username, display_name) values (%L, 'kid.user', 'Kid')$$, :'kid'),
  '42501', null, 'a profile cannot be created directly, bypassing birth year / age check (only via complete_profile)');
select throws_ok(format($$insert into public.profiles (id, username, display_name) values (%L, 'fake.user', 'Fake')$$, :'z'),
  '42501', null, 'nobody can create a profile for another user id');

-- =========================================================================================
-- 4. anon
-- =========================================================================================

select tests.clear_authentication();
select throws_ok($$select 1 from public.profiles$$, '42501', 'permission denied for table profiles', 'anon cannot read profiles');
select throws_ok($$select 1 from public.user_settings$$, '42501', 'permission denied for table user_settings', 'anon cannot read user_settings');
select throws_ok($$select 1 from public.friendships$$, '42501', 'permission denied for table friendships', 'anon cannot read friendships');
select throws_ok($$select 1 from public.blocks$$, '42501', 'permission denied for table blocks', 'anon cannot read blocks');
select throws_ok($$select 1 from public.reports$$, '42501', 'permission denied for table reports', 'anon cannot read reports');
select throws_ok($$select 1 from public.poke_messages$$, '42501', 'permission denied for table poke_messages', 'anon cannot read poke_messages (authenticated only)');
select throws_ok($$select 1 from public.pokes$$, '42501', 'permission denied for table pokes', 'anon cannot read pokes');
select throws_ok($$select 1 from public.notifications$$, '42501', 'permission denied for table notifications', 'anon cannot read notifications');
select throws_ok($$select 1 from public.push_tokens$$, '42501', 'permission denied for table push_tokens', 'anon cannot read push_tokens');
select throws_ok($$select 1 from public.challenges$$, '42501', 'permission denied for table challenges', 'anon cannot read challenges');
select throws_ok($$select 1 from public.challenge_invites$$, '42501', 'permission denied for table challenge_invites', 'anon cannot read challenge_invites');
select throws_ok($$select 1 from public.challenge_members$$, '42501', 'permission denied for table challenge_members', 'anon cannot read challenge_members');
select throws_ok($$select 1 from public.checkins$$, '42501', 'permission denied for table checkins', 'anon cannot read checkins');
select throws_ok($$select 1 from public.streak_rescues$$, '42501', 'permission denied for table streak_rescues', 'anon cannot read streak_rescues');

select results_eq($$select count(*)::int from public.challenge_templates$$, array[8],
  'anon reads the 8 active catalog templates (onboarding before sign-in)');
select is_empty($$select 1 from public.challenge_templates where slug = 'gizli-sablon'$$,
  'anon does not see an inactive template');
select throws_ok($$insert into public.challenge_templates (slug, title_tr, category, difficulty, task_type, default_duration_days, icon, tint)
                   values ('anon-sablon', 'X', 'quirky', 'easy', 'check', 7, 'check', 'green')$$,
  '42501', null, 'anon cannot write the catalog');
select is(public.diken_stage_for(10), 'tam'::public.diken_stage, 'anon can call diken_stage_for');
select ok(public.get_invite_preview('OlcayCode1') -> 'challenge' ->> 'title' = 'Grup challenge'
          and public.get_invite_preview('OlcayCode1') -> 'inviter' ->> 'display_name' = 'Olcay'
          and not (public.get_invite_preview('OlcayCode1')::text like '%olcay%'),
  'anon gets the invite preview card (inviter display name, title) without usernames');
select is(public.get_invite_preview('Revoked001'), null, 'anon gets nothing for a revoked invite code');
select is((public.template_stats((select id from public.challenge_templates where slug = 'kahvesiz')) ->> 'friends_count')::int, 0,
  'anon can call template_stats but sees no friends');
select throws_ok($$select public.my_streak()$$, '42501', null, 'anon cannot call user RPCs (my_streak)');
select throws_ok($$select public.complete_profile('anon.user', 'Anon', 1990)$$, '42501', null, 'anon cannot call complete_profile');
select throws_ok(format($$select app.can_see_profile(%L, %L)$$, :'d', :'o'),
  '42501', null, 'anon cannot probe relationships (who blocked whom) through app.can_see_profile');
select is_empty($$select 1 from storage.objects$$, 'anon cannot list any storage object');
select throws_ok(format($$insert into storage.objects (bucket_id, name) values ('avatars', %L)$$, :'o' || '/anon.jpg'),
  '42501', null, 'anon cannot upload an avatar');

-- =========================================================================================
-- 5. profiles and user_settings
-- =========================================================================================

select tests.authenticate_as('olcay');
select results_eq($$select username::text from public.profiles order by 1$$,
  array['bora', 'ece', 'kaan', 'mert', 'olcay', 'pina'],
  'olcay sees self, friends, pending requester, active co-members and the user she blocked; not a pending invitee, the user who blocked her, a former member or a stranger');
select tests.authenticate_as('bora');
select results_eq($$select username::text from public.profiles order by 1$$,
  array['bora', 'deniz', 'ece', 'mert'],
  'a blocked user does not see the blocker, even as a co-member');
select tests.authenticate_as('deniz');
select results_eq($$select username::text from public.profiles order by 1$$,
  array['bora', 'deniz', 'ece', 'mert', 'olcay'],
  'the blocker still sees the user she blocked (blocked users list)');
select tests.authenticate_as('selin');
select results_eq($$select username::text from public.profiles order by 1$$,
  array['kaan', 'selin'], 'a stranger sees only self and own friends');
select tests.authenticate_as('can');
select results_eq($$select username::text from public.profiles order by 1$$,
  array['bora', 'can', 'deniz', 'ece', 'mert', 'olcay'], 'an invited member sees the group');
select tests.authenticate_as('leyla');
select results_eq($$select username::text from public.profiles order by 1$$,
  array['leyla'], 'a former member no longer sees the group');
select tests.authenticate_as('pina');
select results_eq($$select username::text from public.profiles order by 1$$,
  array['olcay', 'pina'], 'the requester of a pending friend request sees the addressee');

select tests.authenticate_as('olcay');
select results_eq($$update public.profiles set display_name = 'Olcay K.' where username = 'olcay' returning display_name$$,
  array['Olcay K.'], 'a user updates her own display name');
select is_empty($$update public.profiles set display_name = 'Hacked' where username = 'mert' returning 1$$,
  'a user cannot update a friend''s profile');
select throws_ok($$update public.profiles set created_at = now() - interval '1 year' where username = 'olcay'$$,
  '42501', null, 'profiles.created_at is not updatable');
select throws_ok(format($$update public.profiles set id = %L where username = 'olcay'$$, :'kid'),
  '42501', null, 'profiles.id is not updatable');
select throws_ok($$update public.profiles set username = 'admin' where username = 'olcay'$$,
  '23514', 'Bu kullanıcı adı kullanılamaz', 'reserved usernames are rejected on direct update');
select throws_ok(format($$update public.profiles set avatar_path = %L where username = 'olcay'$$, :'m_avatar'),
  '23514', null, 'avatar_path must point into the user''s own folder');
select is_empty($$delete from public.profiles returning 1$$, 'a profile cannot be deleted by the client');

select results_eq($$select user_id from public.user_settings$$, array[:'o'::uuid],
  'user_settings: a user reads only her own row');
select is_empty(format($$update public.user_settings set locale = 'en' where user_id = %L returning 1$$, :'m'),
  'user_settings: cannot update another user''s settings');
select results_eq($$update public.user_settings set poke_push_enabled = false returning poke_push_enabled$$,
  array[false], 'user_settings: own notification preference is updatable');
select throws_ok($$update public.user_settings set timezone = 'Mars/Olympus'$$,
  '22023', 'Geçersiz saat dilimi: Mars/Olympus', 'user_settings: the timezone must be a valid IANA name');
select throws_ok($$update public.user_settings set birth_year = 2015$$,
  '42501', null, 'user_settings.birth_year is not updatable');
select throws_ok($$update public.user_settings set terms_accepted_at = now() - interval '1 year'$$,
  '42501', null, 'user_settings.terms_accepted_at is not updatable');
select throws_ok(format($$insert into public.user_settings (user_id, birth_year) values (%L, 1990)$$, :'kid'),
  '42501', null, 'user_settings: cannot insert a row for another user');
select is_empty($$delete from public.user_settings returning 1$$, 'user_settings cannot be deleted by the client');
select tests.authenticate_as('mert');
select is_empty(format($$select birth_year from public.user_settings where user_id = %L$$, :'o'),
  'a friend cannot read the birth year');

-- =========================================================================================
-- 6. friendships, blocks, reports
-- =========================================================================================

select tests.authenticate_as('olcay');
select results_eq($$select count(*)::int from public.friendships$$, array[3],
  'olcay sees her two friendships and the pending request');
select throws_ok(format($$insert into public.friendships (requester_id, addressee_id) values (%L, %L)$$, :'o', :'s'),
  '42501', null, 'friend requests cannot be inserted directly');
select is_empty(format($$delete from public.friendships where requester_id = %L and addressee_id = %L returning 1$$, :'k', :'s'),
  'a third party cannot delete someone else''s friendship');
select throws_ok($$select public.send_friend_request(auth.uid())$$,
  'P0001', 'Kendine istek gönderemezsin', 'send_friend_request: not to yourself');
select throws_ok(format($$select public.send_friend_request(%L)$$, :'b'),
  'P0002', 'Kullanıcı bulunamadı', 'send_friend_request: not to a user you blocked');
select throws_ok(format($$select public.send_friend_request(%L)$$, gen_random_uuid()),
  'P0002', 'Kullanıcı bulunamadı', 'send_friend_request: unknown user');

select tests.authenticate_as('bora');
select throws_ok(format($$select public.send_friend_request(%L)$$, :'o'),
  'P0002', 'Kullanıcı bulunamadı', 'send_friend_request: not to a user who blocked you');

select tests.authenticate_as('selin');
select results_eq($$select count(*)::int from public.friendships$$, array[1], 'selin sees only her own friendship');
select throws_ok(format($$select public.send_friend_request(%L)$$, :'e'),
  'P0002', 'Kullanıcı bulunamadı', 'send_friend_request: not to an undiscoverable user without a shared challenge');
select results_eq(format($$delete from public.friendships where requester_id = %L and addressee_id = %L returning 1$$, :'k', :'s'),
  $$values (1)$$, 'either party can delete (unfriend) a friendship');

select tests.authenticate_as('pina');
select throws_ok(format($$update public.friendships set status = 'accepted', accepted_at = now() where id = %L$$, :'fr_pina'),
  '42501', null, 'friendships cannot be accepted by a direct update');
select throws_ok(format($$select public.accept_friend_request(%L)$$, :'fr_pina'),
  'P0002', 'İstek bulunamadı', 'the requester cannot accept her own request');

select tests.authenticate_as('olcay');
select results_eq($$select blocked_id from public.blocks$$, array[:'b'::uuid],
  'the blocker sees her block, and not the block someone placed on her');
select throws_ok(format($$insert into public.blocks (blocker_id, blocked_id) values (%L, %L)$$, :'m', :'s'),
  '42501', null, 'cannot insert a block on behalf of another user');
select throws_ok(format($$update public.blocks set blocked_id = %L where blocked_id = %L$$, :'s', :'b'),
  '42501', null, 'blocks cannot be updated');
select tests.authenticate_as('bora');
select is_empty($$select 1 from public.blocks$$, 'a blocked user cannot see that she was blocked');

select tests.authenticate_as('selin');
select lives_ok(format($$insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), %L)$$, :'e'),
  'a user can block someone');
select tests.authenticate_as('ece');
select is_empty(format($$delete from public.blocks where blocker_id = %L returning 1$$, :'s'),
  'the blocked user cannot remove the block');
select tests.authenticate_as('selin');
select results_eq(format($$delete from public.blocks where blocked_id = %L returning 1$$, :'e'),
  $$values (1)$$, 'the blocker can unblock');

select tests.authenticate_as('olcay');
select throws_ok($$select 1 from public.reports$$, '42501', null, 'users cannot read reports (not even about themselves)');
select throws_ok(format($$insert into public.reports (reporter_id, reported_user_id, reason) values (auth.uid(), %L, 'spam_or_fake')$$, :'m'),
  '42501', null, 'reports cannot be inserted directly');
select throws_ok($$update public.reports set status = 'dismissed'$$, '42501', null, 'reports cannot be updated by users');
select throws_ok($$delete from public.reports$$, '42501', null, 'reports cannot be deleted by users');
select throws_ok($$select public.submit_report(auth.uid(), 'other')$$,
  'P0001', 'Kendini şikayet edemezsin', 'submit_report: not yourself');
select lives_ok(format($$select public.submit_report(%L, 'harassment', null, false)$$, :'s'),
  'submit_report: a user I cannot see can be reported too (the answer must not reveal a block)');
select throws_ok(format($$select public.submit_report(%L, 'inappropriate_photo', null, false, 'photo', %L)$$, :'e', :'e_checkin'),
  'P0002', 'Fotoğraf bulunamadı', 'submit_report: a photo report needs a check-in with a photo');
select throws_ok(format($$select public.submit_report(%L, 'dangerous_challenge', null, false, 'challenge', null, %L)$$, :'m', :'c2'),
  'P0002', 'Challenge bulunamadı', 'submit_report: a challenge report needs membership');
select isnt(public.submit_report(:'e', 'spam_or_fake', 'test', false), null,
  'submit_report: a co-member can be reported');

-- =========================================================================================
-- 7. poke_messages, pokes, notifications, push_tokens
-- =========================================================================================

select results_eq($$select count(*)::int from public.poke_messages where is_active$$, array[12],
  'authenticated reads the 12 active preset poke messages');
select results_eq($$select text_tr from public.poke_messages where key = 'retired_line'$$, array['Eski'],
  'a retired message stays readable for the text of old pokes');
select throws_ok($$insert into public.poke_messages (key, tone, sort_order, text_tr) values ('free_text', 'roast', 50, 'Serbest metin')$$,
  '42501', null, 'users cannot add poke messages');
select throws_ok($$update public.poke_messages set text_tr = 'x'$$, '42501', null, 'users cannot edit poke messages');

select results_eq($$select count(*)::int from public.pokes$$, array[3],
  'olcay sees pokes she sent and received, but not one from the user she blocked');
select throws_ok(format($$insert into public.pokes (sender_id, recipient_id, tone, message_key) values (auth.uid(), %L, 'hype', 'almost_there')$$, :'m'),
  '42501', null, 'pokes cannot be inserted directly (no free text, limits)');
select throws_ok($$update public.pokes set message_key = 'i_did_it', tone = 'roast'$$, '42501', null, 'pokes cannot be updated');
select is_empty(format($$delete from public.pokes where id = %L returning 1$$, :'poke_recent'),
  'the recipient cannot delete a poke');

select results_eq($$select kind::text from public.notifications order by kind::text$$,
  array['daily_reminder', 'friend_request', 'poke_hype', 'poke_hype'],
  'olcay sees her notifications, but none from the user she blocked');
select throws_ok(format($$insert into public.notifications (recipient_id, kind, local_date) values (%L, 'daily_reminder', current_date)$$, :'m'),
  '42501', null, 'notifications cannot be inserted by users');
select throws_ok($$update public.notifications set read_at = now()$$, '42501', null, 'notifications are marked read only via RPC');
select throws_ok($$delete from public.notifications$$, '42501', null, 'notifications cannot be deleted by users');

select results_eq($$select token from public.push_tokens$$, array['ExponentPushToken[olcay00001]'],
  'a user sees only her own push tokens');
select throws_ok(format($$insert into public.push_tokens (token, user_id, platform) values ('ExponentPushToken[forged0001]', %L, 'ios')$$, :'m'),
  '42501', null, 'push tokens cannot be inserted directly');
select throws_ok($$update public.push_tokens set last_seen_at = now()$$, '42501', null, 'push tokens cannot be updated directly');
select throws_ok($$select public.register_push_token('ExponentPushToken[olcay00002]', 'windows')$$,
  '23514', null, 'register_push_token validates the platform');

select tests.authenticate_as('mert');
select is(public.mark_notifications_read(array[:'notif_o'::uuid]), 0,
  'mark_notifications_read cannot touch another user''s notifications');
select is_empty($$delete from public.push_tokens where token = 'ExponentPushToken[olcay00001]' returning 1$$,
  'a user cannot delete someone else''s push token');
select is_empty(format($$delete from public.pokes where id = %L returning 1$$, :'poke_old'),
  'the sender cannot undo a poke after the 30 second window');
select results_eq(format($$delete from public.pokes where id = %L returning 1$$, :'poke_recent'),
  $$values (1)$$, 'the sender can undo a poke within 30 seconds');
select throws_ok(format($$select public.send_poke(%L, 'roast', 'cactus_faster')$$, :'o'),
  'P0001', 'Sert modu kapalı; sadece gaz verebilirsin', 'send_poke: no roast when the recipient''s harsh mode is off');

select tests.authenticate_as('bora');
select is_empty($$select 1 from public.pokes$$, 'a blocked sender no longer sees her poke');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there', %L)$$, :'o', :'c1'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: a blocked co-member cannot poke');

select tests.authenticate_as('selin');
select is_empty($$select 1 from public.pokes$$, 'a stranger sees no pokes');
select is_empty($$select 1 from public.notifications$$, 'a stranger sees no notifications');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there')$$, :'o'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: strangers cannot poke');

select tests.authenticate_as('olcay');
select is(public.mark_notifications_read(array[:'notif_o'::uuid]), 1, 'mark_notifications_read marks own notifications');
select results_eq($$delete from public.push_tokens returning token$$, array['ExponentPushToken[olcay00001]'],
  'a user can delete her own push token (sign out)');
select throws_ok($$select public.send_poke(auth.uid(), 'hype', 'almost_there')$$,
  'P0001', 'Kendini dürtemezsin', 'send_poke: not yourself');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there')$$, :'b'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: not a user you blocked');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there')$$, :'e'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: a non-friend needs a shared challenge');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there', %L)$$, :'c', :'c1'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: an invited (not active) member cannot be poked via the challenge');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'cactus_faster')$$, :'m'),
  '22023', 'Geçersiz mesaj', 'send_poke: the preset key must match the tone');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'retired_line')$$, :'m'),
  '22023', 'Geçersiz mesaj', 'send_poke: retired preset messages are rejected');
select lives_ok(format($$select public.send_poke(%L, 'hype', 'finish_together', %L)$$, :'e', :'c1'),
  'send_poke: active co-members can poke each other via the challenge');
select lives_ok(format($$select public.send_poke(%L, 'hype', v.k) from (values ('almost_there'), ('take_five')) as v(k)$$, :'m'),
  'send_poke: a friend can be poked (2nd and 3rd today)');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'diken_waiting')$$, :'m'),
  'P0001', 'Bugün bu kişiyi yeterince dürttün', 'send_poke: at most 3 pokes per day to the same person');

-- =========================================================================================
-- 8. challenge_templates, challenges, challenge_invites, challenge_members
-- =========================================================================================

select results_eq($$select count(*)::int from public.challenge_templates$$, array[8],
  'authenticated reads only active templates');
select throws_ok($$delete from public.challenge_templates$$, '42501', null, 'users cannot delete templates');

select results_eq($$select id from public.challenges$$, array[:'c1'::uuid],
  'the owner sees her challenge and nobody else''s');
select results_eq($$update public.challenges set title = 'Yeni ad', invite_message = 'Gel' returning title$$,
  array['Yeni ad'], 'the owner can rename her challenge');
select throws_ok($$update public.challenges set duration_days = 30$$, '42501', null, 'challenges.duration_days is not updatable');
select throws_ok($$update public.challenges set start_date = start_date - 10$$, '42501', null, 'challenges.start_date is not updatable');
select throws_ok(format($$update public.challenges set created_by = %L$$, :'m'), '42501', null, 'challenges.created_by is not updatable');
select throws_ok($$insert into public.challenges (title, task_type, duration_days, start_date) values ('Direkt', 'check', 7, current_date)$$,
  '42501', null, 'challenges cannot be inserted directly');
select throws_ok($$delete from public.challenges$$, '42501', null, 'challenges cannot be deleted directly');
select throws_ok($$select public.create_challenge(p_title => 'Eski', p_task_type => 'check', p_duration_days => 7, p_start_date => '2000-01-01')$$,
  '22023', 'Başlangıç günü bugün ile 7 gün sonrası arasında olmalı', 'create_challenge: no start date in the past');
select throws_ok(format($$select public.create_challenge(p_template => %L)$$, gen_random_uuid()),
  'P0002', 'Şablon bulunamadı', 'create_challenge: unknown template');
select throws_ok($$select public.create_challenge(p_title => 'Eksik')$$,
  '22023', 'Ad, süre ve tamamlama şekli gerekli', 'create_challenge: custom challenge needs title, type and duration');
select throws_ok(format($$select public.create_challenge(p_title => 'Davetli', p_task_type => 'check', p_duration_days => 7, p_invitees => array[%L]::uuid[])$$, :'s'),
  'P0001', 'Yalnızca arkadaşlarını davet edebilirsin', 'create_challenge: invitees must be friends');

select results_eq($$select code from public.challenge_invites order by code$$, array['OlcayCode1', 'Revoked001'],
  'an inviter sees only her own invite codes');
select throws_ok(format($$insert into public.challenge_invites (code, challenge_id, inviter_id) values ('Forged0001', %L, auth.uid())$$, :'c1'),
  '42501', null, 'invite codes cannot be inserted directly');
select throws_ok($$update public.challenge_invites set revoked_at = null$$, '42501', null, 'invite codes cannot be un-revoked directly');
select is(public.create_invite(:'c1'), 'OlcayCode1', 'create_invite returns the member''s existing code');

select set_eq(format($$select user_id from public.challenge_members where challenge_id = %L$$, :'c1'),
  array[:'o'::uuid, :'m'::uuid, :'e'::uuid, :'c'::uuid],
  'the owner sees active and invited members, but not blocked users (either direction) or former members');
select throws_ok(format($$insert into public.challenge_members (challenge_id, user_id, status) values (%L, %L, 'active')$$, :'c1', :'k'),
  '42501', null, 'members cannot be added directly');
select throws_ok(format($$update public.challenge_members set role = 'owner' where user_id = %L$$, :'m'),
  '42501', null, 'membership rows cannot be updated directly');
select throws_ok(format($$delete from public.challenge_members where user_id = %L$$, :'m'),
  '42501', null, 'members cannot be removed directly');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'c1', :'s'),
  'P0001', 'Yalnızca arkadaşlarını davet edebilirsin', 'invite_to_challenge: only friends');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'c1', :'b'),
  'P0001', 'Yalnızca arkadaşlarını davet edebilirsin', 'invite_to_challenge: not a blocked user');

select tests.authenticate_as('mert');
select results_eq($$select code from public.challenge_invites order by code$$, array['MertCode01', 'MertCode03'],
  'another member sees only his own invite codes');
select is_empty(format($$update public.challenges set title = 'Mert yaptı' where id = %L returning 1$$, :'c1'),
  'a non-owner member cannot change challenge settings');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'c3', :'o'),
  'P0001', 'Grup dolu', 'invite_to_challenge: the group is limited to 20 members');
select lives_ok(format($$select public.revoke_invite(%L)$$, :'c1'), 'a member revokes his own invite code');
select results_eq($$select code from public.challenge_invites where revoked_at is null order by code$$, array['MertCode03'],
  'revoke_invite revoked only the caller''s code for that challenge');

select tests.authenticate_as('can');
select results_eq($$select id from public.challenges$$, array[:'c1'::uuid], 'an invited user can read the challenge');
select set_eq(format($$select user_id from public.challenge_members where challenge_id = %L$$, :'c1'),
  array[:'o'::uuid, :'m'::uuid, :'e'::uuid, :'c'::uuid, :'b'::uuid, :'d'::uuid],
  'an invited user sees the group (not former members)');
select throws_ok(format($$select public.create_invite(%L)$$, :'c1'),
  '42501', 'Bu challenge''a davet edemezsin', 'create_invite: an invited (not yet active) user cannot create links');
select throws_ok(format($$select public.invite_to_challenge(%L, array[]::uuid[])$$, :'c1'),
  '42501', 'Bu challenge''a davet edemezsin', 'invite_to_challenge: an invited user cannot invite');

select tests.authenticate_as('bora');
select results_eq($$select id from public.challenges$$, array[:'c1'::uuid], 'a blocked co-member still reads the challenge');
select set_eq(format($$select user_id from public.challenge_members where challenge_id = %L$$, :'c1'),
  array[:'b'::uuid, :'m'::uuid, :'e'::uuid, :'d'::uuid],
  'a blocked co-member does not see the blocker''s membership, nor a pending invitee he did not invite');
select is(public.get_invite_preview('OlcayCode1'), null, 'get_invite_preview returns nothing to a user blocked by the inviter');

select tests.authenticate_as('ece');
select ok((public.get_invite_preview('OlcayCode1') ->> 'already_member')::boolean, 'get_invite_preview tells a member she already joined');
select throws_ok(format($$select public.create_invite(%L)$$, :'c4'),
  'P0001', 'Bu challenge bitti', 'create_invite: not for an ended challenge');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there', %L)$$, :'z', :'c4'),
  'P0001', null, 'send_poke: an ended challenge no longer makes two non-friends pokeable');

select tests.authenticate_as('leyla');
select results_eq(format($$select status::text from public.challenge_members where challenge_id = %L$$, :'c1'),
  array['left'], 'a former member sees only her own membership row');

select tests.authenticate_as('kaan');
select is_empty($$select 1 from public.challenges$$, 'a friend who is not a member cannot read the challenge');
select is_empty($$select 1 from public.challenge_members$$, 'a friend who is not a member cannot read the group');

select tests.authenticate_as('selin');
select results_eq($$select id from public.challenges$$, array[:'c2'::uuid], 'a stranger sees only her own challenge');
select is_empty(format($$update public.challenges set title = 'Ele geçirildi' where id = %L returning 1$$, :'c1'),
  'a stranger cannot change someone else''s challenge');
select is_empty($$select 1 from public.challenge_invites$$, 'a stranger cannot list invite codes');
select throws_ok(format($$select public.create_invite(%L)$$, :'c1'),
  '42501', 'Bu challenge''a davet edemezsin', 'create_invite: a stranger cannot create a link');
select throws_ok(format($$select public.invite_to_challenge(%L, array[%L]::uuid[])$$, :'c1', :'k'),
  '42501', 'Bu challenge''a davet edemezsin', 'invite_to_challenge: a stranger cannot invite');
select throws_ok(format($$select public.respond_to_invite(%L, true)$$, :'c1'),
  'P0002', 'Davet bulunamadı', 'respond_to_invite: requires an invitation');
select throws_ok(format($$select public.leave_challenge(%L)$$, :'c1'),
  'P0002', 'Bu challenge''da değilsin', 'leave_challenge: requires membership');
select throws_ok($$select public.join_challenge_by_invite('NoSuchCod1')$$,
  'P0002', 'Davet linki geçersiz', 'join_challenge_by_invite: unknown code');
select throws_ok($$select public.join_challenge_by_invite('Revoked001')$$,
  'P0002', 'Davet linki geçersiz', 'join_challenge_by_invite: revoked code');
select is_empty(format($$select * from public.challenge_board(%L)$$, :'c1'),
  'challenge_board returns nothing to a non-member');

select tests.authenticate_as('zafer');
select throws_ok(format($$select public.respond_to_invite(%L, true)$$, :'c3'),
  'P0001', 'Grup dolu', 'respond_to_invite: cannot join a full group');
select throws_ok($$select public.join_challenge_by_invite('MertCode03')$$,
  'P0001', 'Grup dolu', 'join_challenge_by_invite: cannot join a full group');

-- =========================================================================================
-- 9. checkins and streak_rescues
-- =========================================================================================

select tests.authenticate_as('olcay');
select set_eq(format($$select user_id from public.checkins where challenge_id = %L$$, :'c1'),
  array[:'o'::uuid, :'m'::uuid, :'e'::uuid, :'l'::uuid],
  'an active member sees check-ins of active and former co-members, not of blocked users (either direction)');
select throws_ok(format($$insert into public.checkins (user_id, challenge_id, local_date) values (auth.uid(), %L, %L)$$, :'c1', :'missed'),
  '42501', null, 'check-ins cannot be inserted directly (no backfilling a missed day)');
select throws_ok($$update public.checkins set value = 1$$, '42501', null, 'check-ins cannot be updated directly');
select throws_ok($$delete from public.checkins$$, '42501', null, 'check-ins cannot be deleted directly');
select throws_ok(format($$select public.checkin(%L, p_local_date => %L)$$, :'c1', :'day1'),
  'P0001', 'Bu gün artık işaretlenemez', 'checkin: a closed day cannot be checked in');
select throws_ok(format($$select public.checkin(%L, 5)$$, :'c1'),
  '22023', 'Bu görev tek dokunuşla işaretlenir', 'checkin: payload must match the task type');
select throws_ok(format($$select public.checkin(%L)$$, :'c2'),
  '42501', 'Bu challenge''da değilsin', 'checkin: not into someone else''s challenge');
select throws_ok(format($$select public.undo_checkin(%L, %L)$$, :'c1', :'day1'),
  'P0001', 'Geçmiş günler değiştirilemez', 'undo_checkin: past days are immutable');

select results_eq($$select rescued_date from public.streak_rescues$$, array[:'day1'::date - 2],
  'a user sees her own streak rescues');
select throws_ok(format($$insert into public.streak_rescues (user_id, challenge_id, rescued_date, method, ad_reward_id) values (auth.uid(), %L, %L, 'ad', 'fake-reward-0002')$$, :'c1', :'missed'),
  '42501', null, 'rescues cannot be inserted directly');
select throws_ok(format($$select public.rescue_streak(%L, %L)$$, :'c1', :'today'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'rescue_streak: only the pending missed day');
select throws_ok(format($$select public.rescue_streak(%L, %L)$$, :'c1', :'missed'),
  'P0001', 'Bu ayın ücretsiz kurtarma hakkı kullanıldı', 'rescue_streak: one free rescue per month');

select tests.authenticate_as('mert');
select is_empty($$select 1 from public.streak_rescues$$, 'a co-member cannot see another member''s rescues');

select tests.authenticate_as('bora');
select set_eq(format($$select user_id from public.checkins where challenge_id = %L$$, :'c1'),
  array[:'b'::uuid, :'m'::uuid, :'e'::uuid, :'l'::uuid, :'d'::uuid],
  'a blocked co-member does not see the blocker''s check-ins');

select tests.authenticate_as('can');
select is_empty($$select 1 from public.checkins$$, 'an invited (not yet active) user sees no check-ins');
select throws_ok(format($$select public.checkin(%L)$$, :'c1'),
  '42501', 'Bu challenge''da değilsin', 'checkin: an invited user cannot check in');

select tests.authenticate_as('leyla');
select results_eq($$select user_id from public.checkins$$, array[:'l'::uuid], 'a former member sees only her own check-ins');

select tests.authenticate_as('kaan');
select is_empty($$select 1 from public.checkins$$, 'a friend who is not a member sees no check-ins');

select tests.authenticate_as('selin');
select results_eq($$select user_id from public.checkins$$, array[:'s'::uuid], 'a stranger sees only her own check-ins');
select throws_ok(format($$select public.checkin(%L)$$, :'c1'),
  '42501', 'Bu challenge''da değilsin', 'checkin: a stranger cannot check in');
select throws_ok(format($$select public.checkin(%L, null, %L)$$, :'c2', :'o_proof'),
  '22023', 'Fotoğraf kanıtı gerekli', 'checkin: the photo must be in the caller''s own folder');

-- =========================================================================================
-- 10. Storage
-- =========================================================================================

select tests.authenticate_as('mert');
select set_eq($$select name from storage.objects where bucket_id = 'proofs'$$,
  array[:'o_proof', :'m_proof', :'l_proof', :'b_proof'],
  'an active member reads the proofs of the group (former members included)');
select is_empty(format($$update storage.objects set name = name || '.bak' where name = %L returning 1$$, :'o_proof'),
  'a member cannot modify another member''s proof');
select is_empty(format($$delete from storage.objects where name = %L returning 1$$, :'o_proof'),
  'a member cannot delete another member''s proof');

select tests.authenticate_as('olcay');
select set_eq($$select name from storage.objects where bucket_id = 'proofs'$$,
  array[:'o_proof', :'m_proof', :'l_proof'],
  'proofs of a blocked co-member are not readable');
select lives_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('proofs', %L, auth.uid()::text)$$, :'o' || '/' || :'c1' || '/day2.jpg'),
  'an active member uploads a proof into {uid}/{challenge}/');
select throws_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('proofs', %L, auth.uid()::text)$$, :'m' || '/' || :'c1' || '/fake.jpg'),
  '42501', null, 'no upload into another user''s proof folder');
select throws_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('proofs', %L, auth.uid()::text)$$, :'o' || '/' || :'c2' || '/x.jpg'),
  '42501', null, 'no upload for a challenge the user is not a member of');
select throws_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('proofs', %L, auth.uid()::text)$$, :'o' || '/not-a-uuid/x.jpg'),
  '42501', null, 'no upload into a folder that is not a challenge id');
select throws_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('proofs', %L, auth.uid()::text)$$, :'o' || '/x.jpg'),
  '42501', null, 'no upload outside a challenge folder');
select results_eq(format($$update storage.objects set metadata = '{"v": 2}' where name = %L returning 1$$, :'o' || '/' || :'c1' || '/day2.jpg'),
  $$values (1)$$, 'the owner can update her own proof that is not attached to a closed day');
select results_eq(format($$delete from storage.objects where name = %L returning 1$$, :'o' || '/' || :'c1' || '/day2.jpg'),
  $$values (1)$$, 'the owner can delete her own proof that is not attached to a closed day');
select is_empty(format($$update storage.objects set metadata = '{"v": 2}' where name = %L returning 1$$, :'o_proof'),
  'the proof of a closed day''s check-in cannot be replaced');
select is_empty(format($$delete from storage.objects where name = %L returning 1$$, :'o_proof'),
  'the proof of a closed day''s check-in cannot be deleted');
select throws_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('proofs', %L, auth.uid()::text)$$, :'o' || '/' || :'c1' || '/day1.jpg'),
  null, null, 'the proof of a closed day''s check-in cannot be uploaded again');

select lives_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('avatars', %L, auth.uid()::text)$$, :'o_avatar'),
  'a user uploads an avatar into her own folder');
select throws_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('avatars', %L, auth.uid()::text)$$, :'m' || '/hack.jpg'),
  '42501', null, 'no avatar upload into another user''s folder');

select tests.authenticate_as('mert');
select is_empty(format($$delete from storage.objects where name = %L returning 1$$, :'o_avatar'),
  'a user cannot delete someone else''s avatar');
select is_empty(format($$update storage.objects set name = %L where name = %L returning 1$$, :'m' || '/stolen.jpg', :'o_avatar'),
  'a user cannot move someone else''s avatar into her folder');

select tests.authenticate_as('olcay');
select results_eq(format($$update storage.objects set metadata = '{"v": 2}' where bucket_id = 'avatars' and name = %L returning 1$$, :'o_avatar'),
  $$values (1)$$, 'the owner can replace (update) her own avatar');
select results_eq(format($$delete from storage.objects where bucket_id = 'avatars' and name = %L returning 1$$, :'o_avatar'),
  $$values (1)$$, 'the owner can delete her own avatar');

select tests.authenticate_as('bora');
select set_eq($$select name from storage.objects where bucket_id = 'proofs'$$,
  array[:'m_proof', :'l_proof', :'b_proof'],
  'a blocked co-member cannot read the blocker''s proofs');

select tests.authenticate_as('can');
select is_empty($$select 1 from storage.objects where bucket_id = 'proofs'$$, 'an invited (not yet active) user reads no proofs');
select throws_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('proofs', %L, auth.uid()::text)$$, :'c' || '/' || :'c1' || '/x.jpg'),
  '42501', null, 'an invited (not yet active) user cannot upload proofs');

select tests.authenticate_as('leyla');
select throws_ok(format($$insert into storage.objects (bucket_id, name, owner_id) values ('proofs', %L, auth.uid()::text)$$, :'l' || '/' || :'c1' || '/day3.jpg'),
  '42501', null, 'a former member cannot upload proofs');

select tests.authenticate_as('kaan');
select is_empty($$select 1 from storage.objects where bucket_id = 'proofs'$$, 'a friend who is not a member reads no proofs');

select tests.authenticate_as('selin');
select results_eq($$select name from storage.objects where bucket_id = 'proofs'$$, array[:'s_proof'],
  'a stranger reads only her own proofs');

-- =========================================================================================
-- 11. Blocking through a report flips visibility
-- =========================================================================================

select tests.authenticate_as('olcay');
select isnt(public.submit_report(:'p', 'harassment'), null, 'submit_report with the default also blocks the user');
select results_eq($$select count(*)::int from public.blocks$$, array[2], 'the report created a block');
select is_empty($$select 1 from public.friendships where status = 'pending'$$, 'the block removed the pending friend request');

select tests.authenticate_as('pina');
select is_empty($$select 1 from public.profiles where username = 'olcay'$$, 'after the block the reported user no longer sees the reporter');
select throws_ok($$select public.join_challenge_by_invite('OlcayCode1')$$,
  'P0002', 'Davet linki geçersiz', 'join_challenge_by_invite: not through the link of a user who blocked you');

-- TRUNCATE ignores RLS: an ordinary user must not be able to wipe a table
select throws_ok($$truncate public.challenge_members$$, '42501', null, 'authenticated cannot TRUNCATE challenge_members');

select * from finish();
rollback;
