-- Social RPCs and triggers (migrations 100 profiles, 200 social, 600 rpc_actions):
-- is_username_available, complete_profile, search_profiles, friend requests (send / accept /
-- decline / unfriend), blocks, send_poke (+ undo), notification triggers and
-- mark_notifications_read, submit_report and register_push_token.
--
-- Self-contained: every user, profile and challenge is created inside the transaction and
-- rolled back at the end. Run with `supabase test db` (or pg_prove).
--
-- Cast (Europe/Istanbul unless a test changes it):
--   ali      the main actor; profile created through complete_profile
--   bea      becomes ali's friend through mutual requests (harsh mode off)
--   cem      becomes ali's friend through accept_friend_request (harsh mode on)
--   dora     active co-member of ali's challenge, discoverability 'nobody', not a friend
--   emre     friends with ali for a while, then unfriends her
--   fuat     co-member of ali only in a challenge that ended a month ago
--   gul      invited to ali's challenge (not joined)
--   hale     stranger with discoverability 'nobody'
--   ilker    ali's friend who gets blocked by ali
--   jale     sends ali a request and then blocks her
--   kaya     active co-member of ali's challenge who has blocked ali
--   leyla    left ali's challenge
--   teen     signs up with a birth year below the minimum age
--   kid      signed up (auth user) but has no profile yet
--   s_*      users for search_profiles (usernames start with "srch")
begin;
select plan(192);
-- This file tests behaviour, not privileges (01_rls_privileges does). Expected values are computed
-- with app.* helpers, sometimes while signed in, so the helpers are opened inside this transaction.
grant execute on all functions in schema app to authenticated;

-- =========================================================================================
-- Fixture part 1 (as postgres: table owner, BYPASSRLS)
-- Only basejump supabase_test_helpers are used; "reset role" + empty claims returns to postgres.
-- =========================================================================================

select tests.create_supabase_user('ali')      as ali \gset
select tests.create_supabase_user('bea')      as bea \gset
select tests.create_supabase_user('cem')      as cem \gset
select tests.create_supabase_user('dora')     as dora \gset
select tests.create_supabase_user('emre')     as emre \gset
select tests.create_supabase_user('fuat')     as fuat \gset
select tests.create_supabase_user('gul')      as gul \gset
select tests.create_supabase_user('hale')     as hale \gset
select tests.create_supabase_user('ilker')    as ilker \gset
select tests.create_supabase_user('jale')     as jale \gset
select tests.create_supabase_user('kaya')     as kaya \gset
select tests.create_supabase_user('leyla')    as leyla \gset
select tests.create_supabase_user('teen')     as teen \gset
select tests.create_supabase_user('kid')      as kid \gset
select tests.create_supabase_user('s_open')   as s_open \gset
select tests.create_supabase_user('s_hidden') as s_hidden \gset
select tests.create_supabase_user('s_hidfr')  as s_hidfr \gset
select tests.create_supabase_user('s_blkd')   as s_blkd \gset
select tests.create_supabase_user('s_blkr')   as s_blkr \gset
select tests.create_supabase_user('s_under')  as s_under \gset
select tests.create_supabase_user('s_co')     as s_co \gset

insert into public.profiles (id, username, display_name, harsh_mode) values
  (:'bea',      'bea',            'Bea',           false),
  (:'cem',      'cem',            'Cem',           true),
  (:'dora',     'dora',           'Dora',          false),
  (:'emre',     'emre',           'Emre',          false),
  (:'fuat',     'fuat',           'Fuat',          false),
  (:'gul',      'gul',            'Gül',           false),
  (:'hale',     'hale',           'Hale',          false),
  (:'ilker',    'ilker',          'İlker',         false),
  (:'jale',     'jale',           'Jale',          false),
  (:'kaya',     'kaya',           'Kaya',          false),
  (:'leyla',    'leyla',          'Leyla',         false),
  (:'s_open',   'srch.open',      'Open',          false),
  (:'s_hidden', 'srch.hidden',    'Hidden',        false),
  (:'s_hidfr',  'srch.hidfriend', 'Hidden friend', false),
  (:'s_blkd',   'srch.blocked',   'Blocked',       false),
  (:'s_blkr',   'srch.blocker',   'Blocker',       false),
  (:'s_under',  'srch_under',     'Under',         false),
  (:'s_co',     'srch.comember',  'Co-member',     false);

insert into public.user_settings (user_id, birth_year, timezone, discoverability)
select p.id, 1995, 'Europe/Istanbul',
       (case when p.id in (:'hale', :'dora', :'s_hidden', :'s_hidfr', :'s_co') then 'nobody'
             else 'everyone' end)::public.discoverability
from public.profiles p;

-- =========================================================================================
-- 1. is_username_available (ali is signed in but has no profile yet)
-- =========================================================================================

select tests.authenticate_as('ali');

select results_eq(
  $$select n, public.is_username_available(n)
      from unnest(array['deniz.k', '  @Deniz.K ', 'a.b_c9', 'abc', 'aaaaaaaaaaaaaaaaaaaa',
                        'ab', 'aaaaaaaaaaaaaaaaaaaaa', '.abc', 'abc.', '_abc', 'abc_', 'ab c',
                        'ab-c', 'şeker', 'ali@x', '']) with ordinality as t(n, i)
     order by i$$,
  $$values ('deniz.k', true), ('  @Deniz.K ', true), ('a.b_c9', true), ('abc', true),
           ('aaaaaaaaaaaaaaaaaaaa', true), ('ab', false), ('aaaaaaaaaaaaaaaaaaaaa', false),
           ('.abc', false), ('abc.', false), ('_abc', false), ('abc_', false), ('ab c', false),
           ('ab-c', false), ('şeker', false), ('ali@x', false), ('', false)$$,
  'is_username_available: 3-20 chars of a-z 0-9 . _, letter/digit at both ends; @, spaces and case are normalised');

select results_eq(
  $$select n, public.is_username_available(n)
      from unnest(array['bea', 'BEA', '@Bea', ' bea ', 'Srch.Open']) with ordinality as t(n, i)
     order by i$$,
  $$values ('bea', false), ('BEA', false), ('@Bea', false), (' bea ', false), ('Srch.Open', false)$$,
  'is_username_available: a taken username is unavailable whatever the case, @ prefix or spaces');

select results_eq(
  $$select n, public.is_username_available(n)
      from unnest(array['diken', 'Diken', 'SPIKY', '@gazla', 'noskip', 'admin', 'destek',
                        'yardim', 'moderator', 'root']) with ordinality as t(n, i)
     order by i$$,
  $$values ('diken', false), ('Diken', false), ('SPIKY', false), ('@gazla', false),
           ('noskip', false), ('admin', false), ('destek', false), ('yardim', false),
           ('moderator', false), ('root', false)$$,
  'is_username_available: reserved names are unavailable (case-insensitive)');

select tests.clear_authentication();
select throws_ok($$select public.is_username_available('deniz.k')$$,
  '42501', null, 'is_username_available: anon cannot call it');

-- =========================================================================================
-- 2. complete_profile
-- =========================================================================================

-- authenticated role but no JWT subject
select tests.authenticate_as('ali');
select set_config('request.jwt.claims', '', true) as no_claims \gset
select throws_ok($$select public.complete_profile('ghost', 'Ghost', 1990)$$,
  '42501', 'Oturum açman gerekiyor', 'complete_profile: requires a signed-in user (auth.uid())');

-- minimum age (13, by birth year)
select tests.authenticate_as('teen');
select throws_ok(
  format($$select public.complete_profile('teen.x', 'Teen', %s, 'Europe/Istanbul')$$,
         extract(year from now())::int - 12),
  '23514', 'En az 13 yaşında olmalısın',
  'complete_profile: a birth year that makes the user younger than 13 is rejected');
select is((select count(*)::int from public.profiles where id = auth.uid()), 0,
  'complete_profile: a rejected call leaves no half-created profile behind');
select lives_ok(
  format($$select public.complete_profile('teen.x', 'Teen', %s, 'Europe/Istanbul')$$,
         extract(year from now())::int - 13),
  'complete_profile: a birth year exactly 13 years ago is accepted');

-- validation errors
select tests.authenticate_as('ali');
select throws_ok($$select public.complete_profile('ali', 'Ali', 1899, 'Europe/Istanbul')$$,
  '23514', null, 'complete_profile: birth year before 1900 is rejected');
select throws_ok($$select public.complete_profile('ali', 'Ali', 1990, 'Mars/Olympus')$$,
  '22023', 'Geçersiz saat dilimi: Mars/Olympus', 'complete_profile: an unknown IANA timezone is rejected');
select throws_ok($$select public.complete_profile('ali', 'Ali', 1990, '+03:00')$$,
  '22023', 'Geçersiz saat dilimi: +03:00', 'complete_profile: a UTC offset is not an IANA timezone');
select throws_ok($$select public.complete_profile('Diken', 'Ali', 1990)$$,
  '23514', 'Bu kullanıcı adı kullanılamaz', 'complete_profile: a reserved username is rejected');
select throws_ok($$select public.complete_profile('a!', 'Ali', 1990)$$,
  '23514', null, 'complete_profile: a malformed username is rejected');
select throws_ok($$select public.complete_profile('@BEA', 'Ali', 1990)$$,
  '23505', null, 'complete_profile: a username taken in another case is rejected');
select throws_ok($$select public.complete_profile('ali', '   ', 1990)$$,
  '23514', null, 'complete_profile: a blank display name is rejected');
select throws_ok($$select public.complete_profile('ali', repeat('x', 41), 1990)$$,
  '23514', null, 'complete_profile: a display name longer than 40 characters is rejected');
select throws_ok($$select public.complete_profile('ali', 'Ali', 1990, 'Europe/Istanbul', 'de')$$,
  '23514', null, 'complete_profile: an unsupported locale is rejected');

-- happy path with defaults
select lives_ok($$select public.complete_profile('  @Ali.K ', ' Ali ', 1990)$$,
  'complete_profile: creates the profile');
select results_eq(
  $$select username::text, display_name, harsh_mode,
           avatar_tint in ('peach', 'lavender', 'mint', 'butter')
      from public.profiles where id = auth.uid()$$,
  $$values ('ali.k'::text, 'Ali'::text, false, true)$$,
  'complete_profile: username normalised, display name trimmed, harsh mode off by default, tint from the palette');
select results_eq(
  $$select birth_year::int, timezone, locale, discoverability::text, poke_push_enabled
      from public.user_settings where user_id = auth.uid()$$,
  $$values (1990, 'Europe/Istanbul', 'tr', 'everyone', true)$$,
  'complete_profile: settings row created with default timezone, locale and discoverability');
select is(public.is_username_available('ali.k'), true,
  'is_username_available: my own current username counts as available to me');
select avatar_tint as ali_tint, created_at as ali_created from public.profiles where id = auth.uid() \gset

-- idempotency / editing ("Profili düzenle" reuses the same RPC)
select lives_ok($$select public.complete_profile('ali', 'Ali B', 1985, 'America/New_York', 'en')$$,
  'complete_profile: can be called again');
select results_eq(
  $$select username::text, display_name from public.profiles where id = auth.uid()$$,
  $$values ('ali'::text, 'Ali B'::text)$$,
  'complete_profile: a repeat call updates username and display name');
select is((select avatar_tint from public.profiles where id = auth.uid()), :'ali_tint',
  'complete_profile: the avatar tint is stable across calls');
select is((select created_at from public.profiles where id = auth.uid()), :'ali_created'::timestamptz,
  'complete_profile: created_at is not touched by a repeat call');
select results_eq(
  $$select count(*)::int, min(birth_year)::int, min(timezone), min(locale)
      from public.user_settings where user_id = auth.uid()$$,
  $$values (1, 1990, 'America/New_York', 'en')$$,
  'complete_profile: one settings row; timezone and locale updated, birth year kept');
select lives_ok($$select public.complete_profile('ali', 'Ali', 1990)$$,
  'complete_profile: a repeat call without a timezone');
select is((select timezone from public.user_settings where user_id = auth.uid()), 'America/New_York',
  'complete_profile: omitting p_timezone on a repeat call keeps the stored timezone (does not reset it to the default)');
-- back to Istanbul for the rest of the file
select (public.complete_profile('ali', 'Ali', 1990, 'Europe/Istanbul', 'tr')).username as ali_username \gset

select tests.authenticate_as('bea');
select results_eq(
  $$select n, public.is_username_available(n) from unnest(array['ali.k', 'ali']) with ordinality as t(n, i) order by i$$,
  $$values ('ali.k', true), ('ali', false)$$,
  'complete_profile: renaming frees the old username and takes the new one');

-- direct writes still go through the guards
select tests.authenticate_as('ali');
select throws_ok($$update public.profiles set username = 'support' where id = auth.uid()$$,
  '23514', 'Bu kullanıcı adı kullanılamaz', 'profiles guard: cannot rename to a reserved username directly');
select throws_ok($$update public.user_settings set timezone = 'Not/AZone' where user_id = auth.uid()$$,
  '22023', 'Geçersiz saat dilimi: Not/AZone', 'user_settings guard: an invalid timezone cannot be set directly');

-- =========================================================================================
-- Fixture part 2 (as postgres): challenges, memberships, check-ins, search relations
-- =========================================================================================

reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select app.local_date(:'ali', now()) as today \gset

-- ali's running challenge: dora, kaya, s_co active; gul invited; leyla left
select id as ch_active from app.do_create_challenge(
  :'ali', null, 'Aktif grup', 'check', 7, null, null, null, null, null, 0, null, null, '{}', now()) \gset
insert into public.challenge_members (challenge_id, user_id, status, invited_by, joined_at, joined_on, left_on) values
  (:'ch_active', :'dora',  'active',  :'ali', now(), :'today', null),
  (:'ch_active', :'kaya',  'active',  :'ali', now(), :'today', null),
  (:'ch_active', :'s_co',  'active',  :'ali', now(), :'today', null),
  (:'ch_active', :'gul',   'invited', :'ali', null,  null,     null),
  (:'ch_active', :'leyla', 'left',    :'ali', now(), :'today', :'today');

-- ali's photo challenge with dora; check-ins with and without a photo
select id as ch_photo from app.do_create_challenge(
  :'ali', null, 'Foto grup', 'photo', 7, null, null, null, null, null, 0, null, null, '{}', now()) \gset
insert into public.challenge_members (challenge_id, user_id, status, invited_by, joined_at, joined_on)
values (:'ch_photo', :'dora', 'active', :'ali', now(), :'today');
insert into public.checkins (user_id, challenge_id, local_date, photo_path) values
  (:'dora', :'ch_photo', :'today', :'dora' || '/' || :'ch_photo' || '/today.jpg'),
  (:'ali',  :'ch_photo', :'today', :'ali'  || '/' || :'ch_photo' || '/today.jpg');
insert into public.checkins (user_id, challenge_id, local_date) values (:'dora', :'ch_active', :'today');
select id as ck_dora_photo from public.checkins where user_id = :'dora' and challenge_id = :'ch_photo' \gset
select id as ck_ali_photo  from public.checkins where user_id = :'ali'  and challenge_id = :'ch_photo' \gset
select id as ck_dora_plain from public.checkins where user_id = :'dora' and challenge_id = :'ch_active' \gset

-- fuat's challenge that ended weeks ago, done together with ali (memberships stay 'active')
select id as ch_done from app.do_create_challenge(
  :'fuat', null, 'Bitti', 'check', 7, null, null, null, null, null, 0, null, null, '{}',
  now() - interval '40 days') \gset
insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on)
select :'ch_done', :'ali', 'active', now() - interval '40 days', c.start_date
from public.challenges c where c.id = :'ch_done';
select app.finalize_member(:'ali', :'ch_done', now()) as fin_a,
       app.finalize_member(:'fuat', :'ch_done', now()) as fin_f \gset

-- fuat's own photo challenge (ali is not a member)
select id as ch_fphoto from app.do_create_challenge(
  :'fuat', null, 'Fuat foto', 'photo', 7, null, null, null, null, null, 0, null, null, '{}', now()) \gset
insert into public.checkins (user_id, challenge_id, local_date, photo_path)
values (:'fuat', :'ch_fphoto', app.local_date(:'fuat', now()), :'fuat' || '/' || :'ch_fphoto' || '/x.jpg');
select id as ck_fuat_photo from public.checkins where user_id = :'fuat' \gset

-- search relations: s_hidfr is a friend, ali asked s_open; ali blocked s_blkd; s_blkr and kaya blocked ali
insert into public.friendships (requester_id, addressee_id, status, accepted_at) values
  (:'s_hidfr', :'ali', 'accepted', now()),
  (:'ali', :'s_open', 'pending', null);
insert into public.blocks (blocker_id, blocked_id) values
  (:'ali', :'s_blkd'), (:'s_blkr', :'ali'), (:'kaya', :'ali');

-- =========================================================================================
-- 3. search_profiles
-- =========================================================================================

select tests.authenticate_as('ali');

select results_eq(
  $$select username from public.search_profiles('srch') order by username$$,
  $$values ('srch.comember'::text), ('srch.hidfriend'), ('srch.open'), ('srch_under')$$,
  'search_profiles: prefix match returns discoverable users plus "nobody" users I am related to');
select is_empty($$select 1 from public.search_profiles('srch.hidden')$$,
  'search_profiles: a "nobody" stranger is not found, even by full username');
select is_empty($$select 1 from public.search_profiles('srch.blocked')$$,
  'search_profiles: a user I blocked is not found');
select is_empty($$select 1 from public.search_profiles('srch.blocker')$$,
  'search_profiles: a user who blocked me is not found');
select results_eq(
  $$select username, is_friend, request_pending from public.search_profiles('  @SRCH.') order by username$$,
  $$values ('srch.comember'::text, false, false), ('srch.hidfriend', true, false), ('srch.open', false, true)$$,
  'search_profiles: case-insensitive, strips @ and spaces; flags friends and pending requests');
select results_eq($$select username from public.search_profiles('srch_')$$,
  $$values ('srch_under'::text)$$,
  'search_profiles: "_" is matched literally, not as a LIKE wildcard');
select is_empty($$select 1 from public.search_profiles('srch%')$$,
  'search_profiles: "%" is matched literally');
select is_empty($$select 1 from public.search_profiles('rch.open')$$,
  'search_profiles: prefix match only (no substring match)');
select is_empty($$select 1 from public.search_profiles('s')$$,
  'search_profiles: a one-character query returns nothing');
select is_empty($$select 1 from public.search_profiles('ali')$$,
  'search_profiles: never returns the caller');
select is((select count(*)::int from public.search_profiles('srch', 2)), 2,
  'search_profiles: honours p_limit');

select tests.authenticate_as('s_blkd');
select is_empty($$select 1 from public.search_profiles('ali')$$,
  'search_profiles: the user I blocked cannot find me');
select tests.authenticate_as('s_blkr');
select is_empty($$select 1 from public.search_profiles('ali')$$,
  'search_profiles: the user who blocked me cannot find me');
select tests.authenticate_as('emre');
select results_eq($$select username from public.search_profiles('al')$$, $$values ('ali'::text)$$,
  'search_profiles: an unrelated user finds a discoverable user');

select tests.clear_authentication();
select throws_ok($$select * from public.search_profiles('srch')$$,
  '42501', null, 'search_profiles: anon cannot call it');

-- =========================================================================================
-- 4. send_friend_request
-- =========================================================================================

select tests.authenticate_as('ali');

select throws_ok(format($$select public.send_friend_request(%L)$$, :'ali'),
  'P0001', 'Kendine istek gönderemezsin', 'send_friend_request: not to yourself');
select throws_ok($$select public.send_friend_request(gen_random_uuid())$$,
  'P0002', 'Kullanıcı bulunamadı', 'send_friend_request: unknown user');
select throws_ok(format($$select public.send_friend_request(%L)$$, :'kid'),
  'P0002', 'Kullanıcı bulunamadı', 'send_friend_request: a user without a profile');
select throws_ok(format($$select public.send_friend_request(%L)$$, :'hale'),
  'P0002', 'Kullanıcı bulunamadı', 'send_friend_request: a "nobody" stranger cannot be requested');
select results_eq(
  format($$select requester_id, addressee_id, status::text from public.send_friend_request(%L)$$, :'dora'),
  format($$values (%L::uuid, %L::uuid, 'pending')$$, :'ali', :'dora'),
  'send_friend_request: a "nobody" user can still be requested by a challenge co-member');
select results_eq(
  format($$select requester_id, addressee_id, status::text, accepted_at from public.send_friend_request(%L)$$, :'bea'),
  format($$values (%L::uuid, %L::uuid, 'pending', null::timestamptz)$$, :'ali', :'bea'),
  'send_friend_request: creates a pending request');
select id as fr_ab from public.friendships where addressee_id = :'bea' \gset
select is((public.send_friend_request(:'bea')).id, :'fr_ab'::uuid,
  'send_friend_request: sending again returns the existing request');
select is((select count(*)::int from public.friendships where :'bea' in (requester_id, addressee_id)), 1,
  'send_friend_request: no duplicate row for the pair');

select tests.authenticate_as('bea');
select results_eq(
  $$select kind::text, actor_id, friendship_id, read_at from public.notifications$$,
  format($$values ('friend_request', %L::uuid, %L::uuid, null::timestamptz)$$, :'ali', :'fr_ab'),
  'friend request trigger: exactly one unread friend_request notification for the addressee');
select results_eq(
  format($$select id, status::text, accepted_at is not null from public.send_friend_request(%L)$$, :'ali'),
  format($$values (%L::uuid, 'accepted', true)$$, :'fr_ab'),
  'send_friend_request: a reverse request accepts the pending one');
select ok(app.are_friends(:'ali', :'bea'), 'send_friend_request: ali and bea are friends now');

select tests.authenticate_as('ali');
select is((public.send_friend_request(:'bea')).status::text, 'accepted',
  'send_friend_request: requesting an existing friend returns the accepted row unchanged');

select tests.authenticate_as('kid');
select throws_ok(format($$select public.send_friend_request(%L)$$, :'ali'),
  'P0001', 'Önce profilini tamamla', 'send_friend_request: requires a completed profile');
select set_config('request.jwt.claims', '', true) as no_claims \gset
select throws_ok(format($$select public.send_friend_request(%L)$$, :'ali'),
  '42501', 'Oturum açman gerekiyor', 'send_friend_request: requires a signed-in user (auth.uid())');

-- =========================================================================================
-- 5. accept_friend_request
-- =========================================================================================

select tests.authenticate_as('ali');
select (public.send_friend_request(:'cem')).id as fr_ac \gset
select throws_ok(format($$select public.accept_friend_request(%L)$$, :'fr_ac'),
  'P0002', 'İstek bulunamadı', 'accept_friend_request: the requester cannot accept her own request');
select tests.authenticate_as('emre');
select throws_ok(format($$select public.accept_friend_request(%L)$$, :'fr_ac'),
  'P0002', 'İstek bulunamadı', 'accept_friend_request: a third party cannot accept it');
select tests.authenticate_as('cem');
select results_eq(
  format($$select status::text, accepted_at is not null from public.accept_friend_request(%L)$$, :'fr_ac'),
  $$values ('accepted', true)$$,
  'accept_friend_request: the addressee accepts');
select throws_ok(format($$select public.accept_friend_request(%L)$$, :'fr_ac'),
  'P0002', 'İstek bulunamadı', 'accept_friend_request: an accepted request cannot be accepted again');
select throws_ok($$select public.accept_friend_request(gen_random_uuid())$$,
  'P0002', 'İstek bulunamadı', 'accept_friend_request: unknown id');
select throws_ok(format($$update public.friendships set status = 'pending', accepted_at = null where id = %L$$, :'fr_ac'),
  '42501', null, 'friendships cannot be updated directly');
select throws_ok(format($$insert into public.friendships (requester_id, addressee_id) values (auth.uid(), %L)$$, :'emre'),
  '42501', null, 'friendships cannot be inserted directly (no block check)');

-- =========================================================================================
-- 6. Decline and unfriend (DELETE through RLS)
-- =========================================================================================

select tests.authenticate_as('hale');
select (public.send_friend_request(:'ali')).id as fr_ha \gset
select tests.authenticate_as('ali');
select is((select count(*)::int from public.notifications where friendship_id = :'fr_ha' and kind = 'friend_request'), 1,
  'friend request trigger: ali is notified about hale''s request');
select results_eq(format($$delete from public.friendships where id = %L returning requester_id$$, :'fr_ha'),
  format($$values (%L::uuid)$$, :'hale'),
  'decline: the addressee deletes the pending request');
select is((select count(*)::int from public.notifications where friendship_id = :'fr_ha'), 0,
  'decline: the friend_request notification goes away with the request');

select tests.authenticate_as('emre');
select (public.send_friend_request(:'ali')).id as fr_ea \gset
select tests.authenticate_as('ali');
select (public.accept_friend_request(:'fr_ea')).status as fr_ea_status \gset
select tests.authenticate_as('bea');
select is_empty(format($$delete from public.friendships where id = %L returning 1$$, :'fr_ea'),
  'unfriend: a third party cannot delete someone else''s friendship');
select tests.authenticate_as('emre');
select isnt_empty(format($$delete from public.friendships where id = %L returning 1$$, :'fr_ea'),
  'unfriend: either friend can delete the friendship');
select ok(not app.are_friends(:'ali', :'emre'), 'unfriend: they are no longer friends');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there')$$, :'ali'),
  'P0001', 'Bu kişiyi dürtemezsin', 'unfriend: an ex-friend can no longer poke');

-- =========================================================================================
-- 7. Blocks
-- =========================================================================================

-- ilker becomes ali's friend and pokes her; jale sends ali a request
select tests.authenticate_as('ilker');
select (public.send_friend_request(:'ali')).id as fr_ia \gset
select tests.authenticate_as('ali');
select (public.accept_friend_request(:'fr_ia')).status as fr_ia_status \gset
select tests.authenticate_as('ilker');
select (public.send_poke(:'ali', 'hype', 'proud_of_you')).id as poke_ilker \gset
select tests.authenticate_as('jale');
select (public.send_friend_request(:'ali')).id as fr_ja \gset

select lives_ok(format($$insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), %L)$$, :'ali'),
  'blocks: jale blocks ali after sending her a request');
select tests.authenticate_as('ali');
select lives_ok(format($$insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), %L)$$, :'ilker'),
  'blocks: ali blocks her friend ilker');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select is((select count(*)::int from public.friendships where id in (:'fr_ia', :'fr_ja')), 0,
  'blocks: blocking deletes the friendship and the pending request of the pair');

select tests.authenticate_as('ali');
select is_empty(format($$select 1 from public.pokes where id = %L$$, :'poke_ilker'),
  'blocks: earlier pokes from the blocked user are hidden from the blocker');
select is_empty(format($$select 1 from public.notifications where actor_id = %L$$, :'ilker'),
  'blocks: notifications from the blocked user are hidden from the blocker');
select throws_ok(format($$select public.send_friend_request(%L)$$, :'ilker'),
  'P0002', 'Kullanıcı bulunamadı', 'blocks: the blocker cannot send a friend request to the blocked user');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there')$$, :'ilker'),
  'P0001', 'Bu kişiyi dürtemezsin', 'blocks: the blocker cannot poke the blocked user');
select isnt_empty(format($$select 1 from public.profiles where id = %L$$, :'ilker'),
  'blocks: the blocker still sees the blocked profile (blocked users list)');
select throws_ok(format($$select public.send_friend_request(%L)$$, :'jale'),
  'P0002', 'Kullanıcı bulunamadı', 'blocks: cannot send a friend request to someone who blocked you');
select is_empty(format($$select 1 from public.profiles where id = %L$$, :'jale'),
  'blocks: a user who blocked you is invisible to you');
select is_empty(format($$delete from public.blocks where blocker_id = %L returning 1$$, :'jale'),
  'blocks: the blocked user cannot remove the block');
select throws_ok($$insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), auth.uid())$$,
  '23514', null, 'blocks: self-block is rejected');
select throws_ok(format($$insert into public.blocks (blocker_id, blocked_id) values (%L, %L)$$, :'bea', :'cem'),
  '42501', null, 'blocks: cannot create a block on behalf of someone else');

select tests.authenticate_as('ilker');
select throws_ok(format($$select public.send_friend_request(%L)$$, :'ali'),
  'P0002', 'Kullanıcı bulunamadı', 'blocks: the blocked user cannot re-request the blocker');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there')$$, :'ali'),
  'P0001', 'Bu kişiyi dürtemezsin', 'blocks: the blocked user cannot poke the blocker');
select is_empty(format($$select 1 from public.profiles where id = %L$$, :'ali'),
  'blocks: the blocked user cannot see the blocker''s profile');
select is_empty($$select 1 from public.blocks$$,
  'blocks: the blocked user cannot see the block row');
select is_empty(format($$select 1 from public.pokes where id = %L$$, :'poke_ilker'),
  'blocks: the sender also loses sight of her pokes to the blocker');

-- unblock
select tests.authenticate_as('ali');
select isnt_empty(format($$delete from public.blocks where blocked_id = %L returning 1$$, :'ilker'),
  'blocks: the blocker can unblock');
select tests.authenticate_as('ilker');
select lives_ok(format($$select public.send_friend_request(%L)$$, :'ali'),
  'blocks: after unblocking a new friend request is possible');

-- =========================================================================================
-- 8. send_poke
-- =========================================================================================

select tests.authenticate_as('ali');

select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there')$$, :'ali'),
  'P0001', 'Kendini dürtemezsin', 'send_poke: cannot poke yourself');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there')$$, :'emre'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: a stranger (not a friend, no shared challenge) cannot be poked');
select throws_ok($$select public.send_poke(gen_random_uuid(), 'hype', 'almost_there')$$,
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: unknown recipient');
select results_eq(
  format($$select sender_id, recipient_id, tone::text, message_key, challenge_id
             from public.send_poke(%L, 'hype', 'almost_there')$$, :'bea'),
  format($$values (%L::uuid, %L::uuid, 'hype', 'almost_there', null::uuid)$$, :'ali', :'bea'),
  'send_poke: a friend can be sent a hype poke');

select tests.authenticate_as('bea');
select results_eq(
  $$select n.kind::text, n.actor_id, n.local_date = app.local_date(n.recipient_id, k.created_at), k.message_key
      from public.notifications n join public.pokes k on k.id = n.poke_id$$,
  format($$values ('poke_hype', %L::uuid, true, 'almost_there')$$, :'ali'),
  'poke trigger: a poke_hype notification for the recipient (actor = sender, recipient''s local date)');

-- roast only when the recipient's harsh mode is on
select tests.authenticate_as('ali');
select throws_ok(format($$select public.send_poke(%L, 'roast', 'cactus_faster')$$, :'bea'),
  'P0001', 'Sert modu kapalı; sadece gaz verebilirsin', 'send_poke: no roast when the recipient''s harsh mode is off');
select results_eq(format($$select tone::text, message_key from public.send_poke(%L, 'roast', 'cactus_faster')$$, :'cem'),
  $$values ('roast', 'cactus_faster')$$,
  'send_poke: roast allowed when the recipient''s harsh mode is on (sender''s harsh mode is irrelevant)');
select tests.authenticate_as('cem');
select is((select kind::text from public.notifications where actor_id = :'ali' and poke_id is not null), 'poke_roast',
  'poke trigger: a roast creates a poke_roast notification');
update public.profiles set harsh_mode = false where id = auth.uid();
select tests.authenticate_as('ali');
select throws_ok(format($$select public.send_poke(%L, 'roast', 'i_did_it')$$, :'cem'),
  'P0001', 'Sert modu kapalı; sadece gaz verebilirsin', 'send_poke: harsh mode is checked at send time');
select tests.authenticate_as('cem');
update public.profiles set harsh_mode = true where id = auth.uid();

-- preset messages only
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
insert into public.poke_messages (key, tone, sort_order, text_tr, is_active)
values ('retired_one', 'hype', 99, 'Eski mesaj', false);
select tests.authenticate_as('ali');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'retired_one')$$, :'bea'),
  '22023', 'Geçersiz mesaj', 'send_poke: a retired (inactive) message is rejected');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'no_such_message')$$, :'bea'),
  '22023', 'Geçersiz mesaj', 'send_poke: an unknown message key is rejected');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'cactus_faster')$$, :'cem'),
  '22023', 'Geçersiz mesaj', 'send_poke: a roast message cannot be sent with the hype tone');

-- challenge co-members
select results_eq(
  format($$select recipient_id, challenge_id from public.send_poke(%L, 'hype', 'take_five', %L)$$, :'dora', :'ch_active'),
  format($$values (%L::uuid, %L::uuid)$$, :'dora', :'ch_active'),
  'send_poke: an active co-member who is not a friend can be poked in the challenge context');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'take_five', %L)$$, :'gul', :'ch_active'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: an invited (not yet joined) member cannot be poked');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'take_five', %L)$$, :'leyla', :'ch_active'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: a member who left cannot be poked through that challenge');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'take_five', %L)$$, :'bea', :'ch_active'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: a challenge the recipient is not in is not a valid context');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'take_five', %L)$$, :'kaya', :'ch_active'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: a co-member who blocked me cannot be poked');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'take_five', %L)$$, :'fuat', :'ch_done'),
  'P0001', 'Bu kişiyi dürtemezsin',
  'send_poke: co-membership in a challenge that ended weeks ago does not allow pokes (active challenges only)');
select tests.authenticate_as('kaya');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'take_five', %L)$$, :'ali', :'ch_active'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: the blocker cannot poke a co-member she blocked');
select tests.authenticate_as('emre');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'take_five', %L)$$, :'dora', :'ch_active'),
  'P0001', 'Bu kişiyi dürtemezsin', 'send_poke: a non-member cannot use someone else''s challenge as context');

-- 3 pokes per day per sender -> recipient pair
select tests.authenticate_as('ali');
select lives_ok(format($$select public.send_poke(%L, 'hype', 'streak_going_well')$$, :'bea'),
  'send_poke limit: second poke to the same friend today');
select lives_ok(format($$select public.send_poke(%L, 'hype', 'finish_together')$$, :'bea'),
  'send_poke limit: third poke to the same friend today');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'diken_waiting')$$, :'bea'),
  'P0001', 'Bugün bu kişiyi yeterince dürttün', 'send_poke limit: the 4th poke to the same person today is rejected');
select lives_ok(format($$select public.send_poke(%L, 'hype', 'proud_of_you')$$, :'cem'),
  'send_poke limit: it is per recipient (another friend can still be poked)');
select id as p_third from public.pokes
 where sender_id = auth.uid() and recipient_id = :'bea' and message_key = 'finish_together' \gset
select isnt_empty(format($$delete from public.pokes where id = %L returning 1$$, :'p_third'),
  'send_poke undo: the sender can take back a fresh poke');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'diken_waiting')$$, :'bea'),
  'P0001', 'Bugün bu kişiyi yeterince dürttün',
  'send_poke limit: an undone poke still counts (its notification and push already went out)');
select tests.authenticate_as('bea');
select lives_ok(format($$select public.send_poke(%L, 'hype', 'almost_there')$$, :'ali'),
  'send_poke limit: it is per direction (the recipient can still poke back)');

-- Whose "day"? The limit protects the recipient, and the sender's timezone is client-writable
-- (user_settings.timezone), so the window must follow the RECIPIENT's local day: neither the
-- sender's midnight nor a change of the sender's timezone may reset it.
-- ali (Istanbul, UTC+3) -> cem (New York, UTC-4) on a past day, via the time-travel variant.
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
update public.user_settings set timezone = 'America/New_York' where user_id = :'cem';
select (app.do_send_poke(:'ali', :'cem', 'hype', 'almost_there', null, '2026-10-01 23:00+03')).id as x1 \gset
select (app.do_send_poke(:'ali', :'cem', 'hype', 'take_five',    null, '2026-10-01 23:10+03')).id as x2 \gset
select (app.do_send_poke(:'ali', :'cem', 'hype', 'proud_of_you', null, '2026-10-01 23:20+03')).id as x3 \gset
select throws_ok(
  format($$select app.do_send_poke(%L, %L, 'hype', 'diken_waiting', null, '2026-10-01 23:59+03')$$, :'ali', :'cem'),
  'P0001', 'Bugün bu kişiyi yeterince dürttün', 'send_poke limit: a 4th poke later the same day is rejected');
select throws_ok(
  format($$select app.do_send_poke(%L, %L, 'hype', 'diken_waiting', null, '2026-10-02 00:01+03')$$, :'ali', :'cem'),
  'P0001', 'Bugün bu kişiyi yeterince dürttün',
  'send_poke limit: the sender''s local midnight does not reset it while the recipient''s day goes on (17:01 in New York)');
select lives_ok(
  format($$select app.do_send_poke(%L, %L, 'hype', 'diken_waiting', null, '2026-10-02 00:01-04')$$, :'ali', :'cem'),
  'send_poke limit: resets at the recipient''s local midnight');
update public.user_settings set timezone = 'Europe/Istanbul' where user_id = :'cem';

-- the sender cannot reset the window by switching her own timezone (ali -> s_hidfr, both Istanbul)
select (app.do_send_poke(:'ali', :'s_hidfr', 'hype', 'almost_there', null, '2026-10-03 12:00+03')).id as y1 \gset
select (app.do_send_poke(:'ali', :'s_hidfr', 'hype', 'take_five',    null, '2026-10-03 12:05+03')).id as y2 \gset
select (app.do_send_poke(:'ali', :'s_hidfr', 'hype', 'proud_of_you', null, '2026-10-03 12:10+03')).id as y3 \gset
update public.user_settings set timezone = 'Pacific/Kiritimati' where user_id = :'ali';  -- 00:05 on 10-04 there at 13:05+03
select throws_ok(
  format($$select app.do_send_poke(%L, %L, 'hype', 'diken_waiting', null, '2026-10-03 13:05+03')$$, :'ali', :'s_hidfr'),
  'P0001', 'Bugün bu kişiyi yeterince dürttün',
  'send_poke limit: switching the sender''s own timezone (to one past midnight) does not reset it');
update public.user_settings set timezone = 'Europe/Istanbul' where user_id = :'ali';

-- the notification is dated with the recipient's local day: cem (New York) -> ali (Istanbul)
update public.user_settings set timezone = 'America/New_York' where user_id = :'cem';
select (app.do_send_poke(:'cem', :'ali', 'hype', 'almost_there', null, '2026-10-01 20:00-04')).id as z1 \gset
select is((select local_date from public.notifications where poke_id = :'z1'), '2026-10-02'::date,
  'poke trigger: the notification carries the recipient''s local date (sender is still on 10-01)');
update public.user_settings set timezone = 'Europe/Istanbul' where user_id = :'cem';

-- direct writes and visibility
select tests.authenticate_as('ali');
select throws_ok(format($$insert into public.pokes (sender_id, recipient_id, tone, message_key) values (auth.uid(), %L, 'roast', 'cactus_faster')$$, :'bea'),
  '42501', null, 'pokes cannot be inserted directly (would bypass harsh mode and limits)');
select tests.authenticate_as('emre');
select is_empty(format($$select 1 from public.pokes where recipient_id = %L$$, :'bea'),
  'pokes: a third party cannot read pokes between others');
select tests.authenticate_as('bea');
select isnt_empty(format($$select 1 from public.pokes where sender_id = %L$$, :'ali'),
  'pokes: the recipient reads pokes sent to her');

select tests.authenticate_as('kid');
select throws_ok(format($$select public.send_poke(%L, 'hype', 'almost_there')$$, :'ali'),
  'P0001', 'Önce profilini tamamla', 'send_poke: requires a completed profile');

-- =========================================================================================
-- 9. Undo (DELETE within 30 seconds)
-- =========================================================================================

select tests.authenticate_as('ali');
select (public.send_poke(:'cem', 'hype', 'take_five')).id as p_undo \gset
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select is((select count(*)::int from public.notifications where poke_id = :'p_undo'), 1,
  'undo: the poke has a notification before the undo');

select tests.authenticate_as('cem');
select is_empty(format($$delete from public.pokes where id = %L returning 1$$, :'p_undo'),
  'undo: the recipient cannot delete the poke');
select tests.authenticate_as('bea');
select is_empty(format($$delete from public.pokes where id = %L returning 1$$, :'p_undo'),
  'undo: a third party cannot delete the poke');

reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
update public.pokes set created_at = now() - interval '31 seconds' where id = :'p_undo';
select tests.authenticate_as('ali');
select is_empty(format($$delete from public.pokes where id = %L returning 1$$, :'p_undo'),
  'undo: not possible after 30 seconds');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select is((select count(*)::int from public.pokes where id = :'p_undo'), 1,
  'undo: the poke survives a late undo attempt');

update public.pokes set created_at = now() - interval '29 seconds' where id = :'p_undo';
select tests.authenticate_as('ali');
select isnt_empty(format($$delete from public.pokes where id = %L returning 1$$, :'p_undo'),
  'undo: still possible at 29 seconds');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select is((select count(*)::int from public.notifications where poke_id = :'p_undo'), 0,
  'undo: the notification is removed together with the poke');

-- =========================================================================================
-- 10. Notifications: challenge invites, mark_notifications_read, direct access
-- =========================================================================================

select tests.authenticate_as('ali');
select (public.create_challenge(p_title => 'Davetli', p_task_type => 'check', p_duration_days => 7,
                                p_invitees => array[:'bea']::uuid[])).id as ch_inv \gset
select tests.authenticate_as('bea');
select results_eq(
  $$select kind::text, actor_id, challenge_id, read_at from public.notifications where kind = 'challenge_invite'$$,
  format($$values ('challenge_invite', %L::uuid, %L::uuid, null::timestamptz)$$, :'ali', :'ch_inv'),
  'invite trigger: inviting a friend creates a challenge_invite notification');
select lives_ok(format($$select public.respond_to_invite(%L, false)$$, :'ch_inv'),
  'bea declines the invite');
select tests.authenticate_as('ali');
select is(public.invite_to_challenge(:'ch_inv', array[:'bea']::uuid[]), 1, 'ali invites bea again');
select tests.authenticate_as('bea');
select is((select count(*)::int from public.notifications where kind = 'challenge_invite' and challenge_id = :'ch_inv'), 2,
  'invite: a re-invite after a decline creates a new challenge_invite notification');

reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select count(*)::int as bea_unread from public.notifications where recipient_id = :'bea' and read_at is null \gset
select count(*)::int as ali_unread from public.notifications where recipient_id = :'ali' and read_at is null \gset
select id as ali_notif from public.notifications where recipient_id = :'ali' and read_at is null limit 1 \gset
select id as bea_fr_notif from public.notifications where recipient_id = :'bea' and kind = 'friend_request' \gset

select tests.authenticate_as('bea');
select is(public.mark_notifications_read(array[:'ali_notif']::uuid[]), 0,
  'mark_notifications_read: ids of someone else''s notifications are ignored');
select is(public.mark_notifications_read(array[:'bea_fr_notif']::uuid[]), 1,
  'mark_notifications_read: marks the selected own notification');
select is(public.mark_notifications_read(), :bea_unread - 1,
  'mark_notifications_read: "Tümü okundu" marks every remaining own unread notification');
select is(public.mark_notifications_read(), 0,
  'mark_notifications_read: nothing left to mark');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select is((select count(*)::int from public.notifications where recipient_id = :'ali' and read_at is null), :ali_unread,
  'mark_notifications_read: other users'' notifications stay unread');

select tests.authenticate_as('bea');
select throws_ok($$update public.notifications set read_at = null$$,
  '42501', null, 'notifications cannot be updated directly');
select throws_ok(format($$insert into public.notifications (recipient_id, kind, local_date) values (%L, 'poke_roast', current_date)$$, :'ali'),
  '42501', null, 'clients cannot insert notifications');
select throws_ok($$delete from public.notifications$$,
  '42501', null, 'clients cannot delete notifications');
select is_empty(format($$select 1 from public.notifications where recipient_id = %L$$, :'ali'),
  'notifications: a user cannot read someone else''s notifications');

-- =========================================================================================
-- 11. submit_report
-- =========================================================================================

select tests.authenticate_as('ali');

select throws_ok(format($$select public.submit_report(%L, 'harassment')$$, :'ali'),
  'P0001', 'Kendini şikayet edemezsin', 'submit_report: cannot report yourself');
select lives_ok(format($$select public.submit_report(%L, 'harassment', null, false)$$, :'hale'),
  'submit_report: a stranger whose profile I cannot see can be reported (same answer as a blocker)');
select throws_ok($$select public.submit_report(gen_random_uuid(), 'other')$$,
  'P0002', 'Kullanıcı bulunamadı', 'submit_report: unknown user');
select throws_like($$select public.submit_report(null, 'other', null, false)$$, '%',
  'submit_report: a report without a reported user is rejected');
select throws_ok(format($$select public.submit_report(%L, null)$$, :'cem'),
  '23502', null, 'submit_report: a reason is required');
select throws_ok(format($$select public.submit_report(%L, 'other', repeat('x', 501), false)$$, :'cem'),
  '23514', null, 'submit_report: details longer than 500 characters are rejected');

-- user target, no block
select public.submit_report(:'cem', 'harassment', '  çok kaba  ', false) as rep_cem \gset
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select results_eq(
  format($$select reporter_id, reported_user_id, target_type::text, checkin_id, challenge_id, reason::text,
                  details, also_blocked, status::text, review_due_at = created_at + interval '24 hours'
             from public.reports where id = %L$$, :'rep_cem'),
  format($$values (%L::uuid, %L::uuid, 'user', null::uuid, null::uuid, 'harassment', 'çok kaba', false, 'pending', true)$$,
         :'ali', :'cem'),
  'submit_report: stores a pending user report, due for review 24 hours after creation');
select ok(not app.is_blocked(:'ali', :'cem') and app.are_friends(:'ali', :'cem'),
  'submit_report: with p_also_block = false nobody is blocked or unfriended');

-- user target, default also_block
select tests.authenticate_as('ali');
select public.submit_report(:'bea', 'spam_or_fake', '   ') as rep_bea \gset
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select results_eq(format($$select details, also_blocked from public.reports where id = %L$$, :'rep_bea'),
  $$values (null::text, true)$$,
  'submit_report: blank details are stored as null; also_block defaults to true');
select ok(exists (select 1 from public.blocks where blocker_id = :'ali' and blocked_id = :'bea'),
  'submit_report: the default also blocks the reported user');
select ok(not app.has_friendship_row(:'ali', :'bea'),
  'submit_report: ... which removes the friendship');
select tests.authenticate_as('ali');
select lives_ok(format($$select public.submit_report(%L, 'harassment')$$, :'s_blkd'),
  'submit_report: a user I already blocked can still be reported (block not duplicated)');

-- photo target
select throws_ok(format($$select public.submit_report(%L, 'inappropriate_photo', null, false, 'photo')$$, :'dora'),
  'P0002', 'Fotoğraf bulunamadı', 'submit_report photo: a check-in id is required');
select throws_ok(format($$select public.submit_report(%L, 'inappropriate_photo', null, false, 'photo', %L)$$, :'dora', :'ck_ali_photo'),
  'P0002', 'Fotoğraf bulunamadı', 'submit_report photo: the check-in must belong to the reported user');
select throws_ok(format($$select public.submit_report(%L, 'inappropriate_photo', null, false, 'photo', %L)$$, :'dora', :'ck_dora_plain'),
  'P0002', 'Fotoğraf bulunamadı', 'submit_report photo: the check-in must have a photo');
select throws_ok(format($$select public.submit_report(%L, 'inappropriate_photo', null, false, 'photo', %L)$$, :'fuat', :'ck_fuat_photo'),
  'P0002', 'Fotoğraf bulunamadı', 'submit_report photo: a photo I am not allowed to see cannot be reported');
select public.submit_report(:'dora', 'inappropriate_photo', null, false, 'photo', :'ck_dora_photo', :'ch_active') as rep_photo \gset
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select results_eq(format($$select target_type::text, reported_user_id, checkin_id, challenge_id from public.reports where id = %L$$, :'rep_photo'),
  format($$values ('photo', %L::uuid, %L::uuid, null::uuid)$$, :'dora', :'ck_dora_photo'),
  'submit_report photo: stores the check-in (and ignores the challenge argument)');

-- challenge target
select tests.authenticate_as('ali');
select throws_ok(format($$select public.submit_report(%L, 'dangerous_challenge', null, false, 'challenge')$$, :'dora'),
  'P0002', 'Challenge bulunamadı', 'submit_report challenge: a challenge id is required');
select throws_ok(format($$select public.submit_report(%L, 'dangerous_challenge', null, false, 'challenge', null, %L)$$, :'fuat', :'ch_fphoto'),
  'P0002', 'Challenge bulunamadı', 'submit_report challenge: only challenges I belong to');
select public.submit_report(:'dora', 'dangerous_challenge', null, false, 'challenge', :'ck_dora_photo', :'ch_active') as rep_ch \gset
select throws_like(format($$select public.submit_report(%L, 'dangerous_challenge', null, false, 'challenge', null, %L)$$, :'cem', :'ch_active'), '%',
  'submit_report challenge: the reported user must be part of the reported challenge');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select results_eq(format($$select target_type::text, checkin_id, challenge_id from public.reports where id = %L$$, :'rep_ch'),
  format($$values ('challenge', null::uuid, %L::uuid)$$, :'ch_active'),
  'submit_report challenge: stores the challenge (and ignores the check-in argument)');

-- nobody but the service role reads reports
select tests.authenticate_as('ali');
select throws_ok($$select 1 from public.reports$$,
  '42501', 'permission denied for table reports', 'reports: the reporter cannot read reports');
select tests.authenticate_as('cem');
select throws_ok($$select 1 from public.reports$$,
  '42501', 'permission denied for table reports', 'reports: the reported user cannot read reports');
select throws_ok(format($$insert into public.reports (reporter_id, reported_user_id, reason) values (auth.uid(), %L, 'other')$$, :'ali'),
  '42501', null, 'reports: cannot be inserted directly');

-- s_hidfr reports ali (for the deletion test below)
select tests.authenticate_as('s_hidfr');
select public.submit_report(:'ali', 'other', null, false) as rep_by_hidfr \gset

-- =========================================================================================
-- 12. register_push_token
-- =========================================================================================

select tests.authenticate_as('ali');
select lives_ok($$select public.register_push_token('ExponentPushToken[aaaaaaaaaaaa]', 'ios')$$,
  'register_push_token: stores a token');
select results_eq($$select token, user_id, platform from public.push_tokens$$,
  format($$values ('ExponentPushToken[aaaaaaaaaaaa]', %L::uuid, 'ios')$$, :'ali'),
  'push_tokens: the owner sees her token');
select lives_ok($$select public.register_push_token('ExponentPushToken[aaaaaaaaaaaa]', 'android')$$,
  'register_push_token: registering the same token again is an upsert');
select results_eq($$select count(*)::int, min(platform) from public.push_tokens$$,
  $$values (1, 'android')$$,
  'register_push_token: still one row, platform updated');
select throws_ok($$select public.register_push_token('ExponentPushToken[bbbbbbbbbbbb]', 'web')$$,
  '23514', null, 'register_push_token: unknown platform rejected');
select throws_ok($$select public.register_push_token('short', 'ios')$$,
  '23514', null, 'register_push_token: too short token rejected');
select throws_ok($$select public.register_push_token(repeat('x', 301), 'ios')$$,
  '23514', null, 'register_push_token: too long token rejected');

select tests.authenticate_as('emre');
select is_empty($$select 1 from public.push_tokens$$,
  'push_tokens: another user cannot read the token');
select is_empty($$delete from public.push_tokens where token = 'ExponentPushToken[aaaaaaaaaaaa]' returning 1$$,
  'push_tokens: another user cannot delete the token');
select throws_ok(format($$insert into public.push_tokens (token, user_id, platform) values ('ExponentPushToken[cccccccccccc]', %L, 'ios')$$, :'ali'),
  '42501', null, 'push_tokens: cannot be inserted directly');
select throws_ok($$update public.push_tokens set user_id = auth.uid()$$,
  '42501', null, 'push_tokens: cannot be updated directly');

-- same device, new sign-in: the token moves to the new account
select lives_ok($$select public.register_push_token('ExponentPushToken[aaaaaaaaaaaa]', 'android')$$,
  'register_push_token: another account on the same device takes the token over');
select results_eq($$select user_id from public.push_tokens$$, format($$values (%L::uuid)$$, :'emre'),
  'register_push_token: the token now belongs to the new account');
select tests.authenticate_as('ali');
select is_empty($$select 1 from public.push_tokens$$,
  'register_push_token: the previous owner no longer has the token');
select (public.register_push_token('ExponentPushToken[dddddddddddd]', 'ios') is null) as reg \gset
select isnt_empty($$delete from public.push_tokens where token = 'ExponentPushToken[dddddddddddd]' returning 1$$,
  'push_tokens: the owner deletes her token on sign-out');

select tests.authenticate_as('kid');
select throws_ok($$select public.register_push_token('ExponentPushToken[eeeeeeeeeeee]', 'ios')$$,
  'P0001', 'Önce profilini tamamla', 'register_push_token: requires a completed profile');
select tests.clear_authentication();
select throws_ok($$select public.register_push_token('ExponentPushToken[eeeeeeeeeeee]', 'ios')$$,
  '42501', null, 'register_push_token: anon cannot call it');

-- =========================================================================================
-- 13. Account deletion keeps reports (anonymised)
-- =========================================================================================

reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
-- account deletion (the Edge Function deletes auth.users with the service role)
delete from auth.users where id in (:'cem', :'s_hidfr');
select results_eq(
  format($$select id, reporter_id, reported_user_id from public.reports where id in (%L, %L) order by reporter_id nulls first$$,
         :'rep_cem', :'rep_by_hidfr'),
  format($$values (%L::uuid, null::uuid, %L::uuid), (%L::uuid, %L::uuid, null::uuid)$$,
         :'rep_by_hidfr', :'ali', :'rep_cem', :'ali'),
  'reports survive account deletion of the reporter or the reported user (person columns set to null)');

select * from finish();
rollback;
