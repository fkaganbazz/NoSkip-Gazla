-- pgTAP: sunucu tarafı işler (migration 20261021100000–20261021100200).
--   A. find_contacts: e-posta özeti (istemciyle aynı), keşfedilebilirlik, engel, kendisi, sınırlar
--   B. Reklamla kurtarma (AdMob SSV): grant_ad_rescue kuralları (süre geçmiş, zaten kurtarılmış,
--      idempotent ödül), record_ad_rescue_failure, ad_rescue_result ('pending' / 'granted' / ret)
--   C. Arkadaş push'u: claim_social_push (dürtme tercihi, engel, bir kez)
--   D. Diken push'u: queue_diken_notifications (yerel saat, pencere, günde bir, günde en çok 2,
--      sessiz saatler, işaretlenmiş gün, token'sız kullanıcı, seri koptu)
--   E. pg_cron / pg_net yokken iş kurulumu ve Edge Function çağrısı sessizce atlanır
--
-- Zaman: B now()'a göre kurulur (grant_ad_rescue now() kullanır); D sabit anlarla app.* sürümünü
-- çağırır (p_at). Her şey işlem içinde oluşturulur ve geri alınır.
begin;
select plan(69);

-- ------------------------------------------------------------------------------------------------
-- Yardımcılar
-- ------------------------------------------------------------------------------------------------

create function pg_temp.mk_user(p_ident text, p_email text default null, p_tz text default 'Europe/Istanbul')
returns uuid
language plpgsql as $$
declare
  v uuid := tests.create_supabase_user(p_ident, p_email);
begin
  insert into public.profiles (id, username, display_name) values (v, p_ident, initcap(p_ident));
  insert into public.user_settings (user_id, birth_year, timezone) values (v, 1995, p_tz);
  return v;
end
$$;

create function pg_temp.mk_ch(p_title text, p_start date, p_days integer, p_reminder time default null)
returns uuid
language sql as $$
  insert into public.challenges (title, task_type, duration_days, start_date, reminder_time)
  values (p_title, 'check', p_days, p_start, p_reminder)
  returning id
$$;

create function pg_temp.add_member(p_ch uuid, p_user uuid, p_joined_on date) returns integer
language sql as $$
  insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on)
  values (p_ch, p_user, 'active', p_joined_on::timestamptz, p_joined_on)
  returning 1
$$;

create function pg_temp.ci(p_user uuid, p_ch uuid, p_from date, p_to date, p_skip date[] default '{}')
returns integer
language sql as $$
  with ins as (
    insert into public.checkins (user_id, challenge_id, local_date)
    select p_user, p_ch, g::date
    from generate_series(p_from, p_to, interval '1 day') as g
    where g::date <> all (p_skip)
    returning 1
  )
  select count(*)::int from ins
$$;

create function pg_temp.friends(p_a uuid, p_b uuid) returns integer
language sql as $$
  insert into public.friendships (requester_id, addressee_id, status, accepted_at)
  values (p_a, p_b, 'accepted', now())
  returning 1
$$;

create function pg_temp.token(p_user uuid, p_token text) returns integer
language sql as $$
  insert into public.push_tokens (token, user_id, platform) values (p_token, p_user, 'ios') returning 1
$$;

-- ================================================================================================
-- A. find_contacts
-- ================================================================================================

select is(app.email_sha256(' Ece@Example.COM '),
          'e4601139032ed1df0e561016961ab6621398e75461f2d4f64d7a2537a3c0ee95',
          'email hash: trimmed, lower-case SHA-256 hex (same value as the client hashEmail / mock seed)');

select pg_temp.mk_user('fc_me', 'me@example.com') as fme \gset
select pg_temp.mk_user('fc_ece', ' Ece@Example.COM ') as fece \gset
select pg_temp.mk_user('fc_friend', 'friend@example.com') as ffr \gset
select pg_temp.mk_user('fc_pending', 'pending@example.com') as fpe \gset
select pg_temp.mk_user('fc_hidden', 'hidden@example.com') as fhi \gset
select pg_temp.mk_user('fc_blocked', 'blocked@example.com') as fbl \gset
select pg_temp.mk_user('fc_blocker', 'blocker@example.com') as fbr \gset
select tests.create_supabase_user('fc_noprofile', 'noprofile@example.com') as fnp \gset

update public.user_settings set discoverability = 'nobody' where user_id = :'fhi';
select pg_temp.friends(:'fme', :'ffr') as _n \gset
select pg_temp.friends(:'fece', :'ffr') as _n \gset
insert into public.friendships (requester_id, addressee_id) values (:'fme', :'fpe');
insert into public.blocks (blocker_id, blocked_id) values (:'fme', :'fbl'), (:'fbr', :'fme');

select is((select email_sha256 from app.email_hashes where user_id = :'fece'), app.email_sha256('ece@example.com'),
          'auth.users trigger stores the hash of the normalized e-mail');

create temp table fc_hashes on commit drop as
select array[
  encode(sha256(convert_to('ece@example.com', 'UTF8')), 'hex'), encode(sha256(convert_to('friend@example.com', 'UTF8')), 'hex'),
  encode(sha256(convert_to('pending@example.com', 'UTF8')), 'hex'), encode(sha256(convert_to('hidden@example.com', 'UTF8')), 'hex'),
  encode(sha256(convert_to('blocked@example.com', 'UTF8')), 'hex'), encode(sha256(convert_to('blocker@example.com', 'UTF8')), 'hex'),
  encode(sha256(convert_to('noprofile@example.com', 'UTF8')), 'hex'), encode(sha256(convert_to('me@example.com', 'UTF8')), 'hex'),
  upper(encode(sha256(convert_to('ece@example.com', 'UTF8')), 'hex')), 'not-a-hash', encode(sha256(convert_to('nobody-here@example.com', 'UTF8')), 'hex')
] as h;
grant select on fc_hashes to authenticated;

select tests.authenticate_as('fc_me');
select results_eq(
  $$select username, is_friend, request_pending, mutual_count from public.find_contacts((select h from fc_hashes))$$,
  $$values ('fc_ece'::text, false, false, 1), ('fc_pending'::text, false, true, 0), ('fc_friend'::text, true, false, 0)$$,
  'find_contacts: discoverable matches only (not hidden, blocked either way, profile-less or self); duplicates, case and junk ignored; non-friends first');
select is_empty($$select * from public.find_contacts('{}')$$, 'find_contacts: empty list returns nothing');
select is_empty($$select * from public.find_contacts(null)$$, 'find_contacts: null returns nothing');
select throws_ok(
  $$select * from public.find_contacts(array(select encode(sha256(convert_to(g || '@x.test', 'UTF8')), 'hex') from generate_series(1, 501) g))$$,
  '22023', 'Rehberden en fazla 500 kişi aranabilir', 'find_contacts: at most 500 hashes per call');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- E-posta değişince özet de değişir; kullanıcı silinince özet gider
update auth.users set email = 'ece.new@example.com' where id = :'fece';
select tests.authenticate_as('fc_me');
select is((select count(*)::int from public.find_contacts(array[encode(sha256(convert_to('ece@example.com', 'UTF8')), 'hex')])), 0,
          'find_contacts: the old e-mail no longer matches after an e-mail change');
select is((select username from public.find_contacts(array[encode(sha256(convert_to('ece.new@example.com', 'UTF8')), 'hex')])), 'fc_ece',
          'find_contacts: the new e-mail matches');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select tests.delete_supabase_user(:'fnp'::uuid);
select is((select count(*)::int from app.email_hashes where user_id = :'fnp'), 0,
          'deleting the auth user removes its hash');

-- En çok 100 sonuç
create temp table fc_many on commit drop as
select tests.create_supabase_user('fc_many' || g, 'many' || g || '@example.com') as id, g
from generate_series(1, 105) g;
insert into public.profiles (id, username, display_name) select id, 'fc_many' || g, 'Many ' || g from fc_many;
select tests.authenticate_as('fc_me');
select is((select count(*)::int from public.find_contacts(array(select encode(sha256(convert_to('many' || g || '@example.com', 'UTF8')), 'hex')
                                                                from generate_series(1, 105) g))),
          100, 'find_contacts: at most 100 results');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- Günlük sınır (20 arama / 24 saat)
insert into app.contact_lookup_log (user_id, hash_count, created_at)
select :'fme', 1, now() - interval '1 hour' from generate_series(1, 17);
select tests.authenticate_as('fc_me');
select throws_ok($$select * from public.find_contacts(array[encode(sha256(convert_to('friend@example.com', 'UTF8')), 'hex')])$$,
                 'P0001', 'Rehberden bulmayı bugün çok denedin. Yarın tekrar dene.',
                 'find_contacts: 20 lookups per 24 hours');
select lives_ok($$select * from public.find_contacts('{}')$$, 'an empty lookup does not count against the limit');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
update app.contact_lookup_log set created_at = now() - interval '25 hours' where user_id = :'fme';
select tests.authenticate_as('fc_me');
select is((select count(*)::int from public.find_contacts(array[encode(sha256(convert_to('friend@example.com', 'UTF8')), 'hex')])), 1,
          'find_contacts: lookups older than 24 hours no longer count');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

select tests.authenticate_as_anon();
select throws_ok($$select * from public.find_contacts('{}')$$, '42501', null, 'anon cannot call find_contacts');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- ================================================================================================
-- B. Reklamla kurtarma (grant_ad_rescue + ad_rescue_result)
-- ================================================================================================

select pg_temp.mk_user('ad_u') as adu \gset
select (app.open_dates(:'adu', now()))[1] as t \gset
select (select min(d) from unnest(app.open_dates(:'adu', now())) d) - 1 as lc \gset
select pg_temp.mk_ch('ad one', (:'t'::date - 8), 30) as a1 \gset
select pg_temp.mk_ch('ad two', (:'t'::date - 8), 30) as a2 \gset
select pg_temp.mk_ch('ad expired', (:'t'::date - 8), 30) as a3 \gset
select pg_temp.add_member(:'a1', :'adu', :'t'::date - 8) as _n \gset
select pg_temp.add_member(:'a2', :'adu', :'t'::date - 8) as _n \gset
select pg_temp.add_member(:'a3', :'adu', :'t'::date - 8) as _n \gset
-- a1, a2: son kapanan gün (lc) kaçtı → kurtarılabilir
select pg_temp.ci(:'adu', :'a1', :'t'::date - 8, :'lc'::date - 1) as _n \gset
select pg_temp.ci(:'adu', :'a2', :'t'::date - 8, :'lc'::date - 1) as _n \gset
-- a3: lc − 1 kaçtı, lc işaretli → lc − 1'in 24 saatlik süresi doldu
select pg_temp.ci(:'adu', :'a3', :'t'::date - 8, :'lc'::date, array[:'lc'::date - 1]) as _n \gset

select tests.authenticate_as('ad_u');
select is(public.ad_rescue_result(:'a1', :'lc'), 'pending', 'ad_rescue_result: pending until the SSV callback arrives');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

select tests.authenticate_as_service_role();
select results_eq(format($$select method, ad_reward_id from public.grant_ad_rescue(%L, %L, %L, 'ssv-07-000001')$$, :'adu', :'a1', :'lc'),
                  $$values ('ad'::public.rescue_method, 'ssv-07-000001'::text)$$,
                  'grant_ad_rescue: a verified reward rescues the pending day');
select results_eq(format($$select method, ad_reward_id from public.grant_ad_rescue(%L, %L, %L, 'ssv-07-000001')$$, :'adu', :'a1', :'lc'),
                  $$values ('ad'::public.rescue_method, 'ssv-07-000001'::text)$$,
                  'grant_ad_rescue: the same callback again returns the existing rescue (idempotent)');
select is((select count(*)::int from public.streak_rescues where user_id = :'adu' and challenge_id = :'a1'), 1,
          'grant_ad_rescue: a replayed callback creates no second rescue');
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'ssv-07-000001')$$, :'adu', :'a2', :'lc'),
                 '23505', 'Bu ödül zaten kullanıldı', 'grant_ad_rescue: one reward cannot rescue another challenge');
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'ssv-07-000002')$$, :'adu', :'a3', (:'lc'::date - 1)),
                 'P0001', 'Bu gün için kurtarma yapılamaz', 'grant_ad_rescue: the 24 hour rescue window has passed');
select is(public.record_ad_rescue_failure(:'adu', :'a3', (:'lc'::date - 1), 'ssv-07-000002', 'Bu gün için kurtarma yapılamaz', 'P0001'),
          true, 'record_ad_rescue_failure stores the rejection');
select is(public.record_ad_rescue_failure(:'adu', :'a3', (:'lc'::date - 1), 'ssv-07-000002', 'başka', 'P0001'),
          false, 'record_ad_rescue_failure: the same reward is recorded once');
select is(public.record_ad_rescue_failure(:'adu', gen_random_uuid(), :'lc', 'ssv-07-000009', 'x', 'P0001'),
          false, 'record_ad_rescue_failure ignores an unknown challenge (forged custom_data)');
select throws_ok(format($$select public.record_ad_rescue_failure(%L, %L, %L, 'short', 'x', null)$$, :'adu', :'a3', :'lc'),
                 '22023', 'Geçersiz ödül kimliği', 'record_ad_rescue_failure validates the reward id');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

select tests.authenticate_as('ad_u');
select is(public.ad_rescue_result(:'a1', :'lc'), 'granted', 'ad_rescue_result: granted after the verified reward');
select throws_ok(format($$select public.ad_rescue_result(%L, %L)$$, :'a3', (:'lc'::date - 1)),
                 'P0001', 'Bu gün için kurtarma yapılamaz', 'ad_rescue_result: a recent rejection is returned as the error');
-- Zaten kurtarılmış gün: önce ücretsiz hak, sonra gelen reklam ödülü reddedilir ama gün kurtarılmıştır
select lives_ok(format($$select public.rescue_streak(%L, %L)$$, :'a2', :'lc'), 'free rescue of a2');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select tests.authenticate_as_service_role();
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'ssv-07-000003')$$, :'adu', :'a2', :'lc'),
                 'P0001', 'Bu gün için kurtarma yapılamaz', 'grant_ad_rescue: an already rescued day is not rescued twice');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select tests.authenticate_as('ad_u');
select is(public.ad_rescue_result(:'a2', :'lc'), 'granted', 'ad_rescue_result: an already rescued day counts as granted');
select throws_ok(format($$select public.record_ad_rescue_failure(%L, %L, %L, 'ssv-07-000004', 'x', null)$$, :'adu', :'a1', :'lc'),
                 '42501', null, 'a signed-in user cannot record ad rescue results');
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'ssv-07-000005')$$, :'adu', :'a1', :'lc'),
                 '42501', null, 'a signed-in user cannot grant itself an ad rescue');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- Eski ret artık gösterilmez (sonraki reklam yeni bir deneme)
update app.ad_rescue_failures set created_at = now() - interval '11 minutes' where ad_reward_id = 'ssv-07-000002';
select tests.authenticate_as('ad_u');
select is(public.ad_rescue_result(:'a3', (:'lc'::date - 1)), 'pending', 'ad_rescue_result: a rejection older than 10 minutes is ignored');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select tests.authenticate_as_anon();
select throws_ok(format($$select public.ad_rescue_result(%L, %L)$$, :'a1', :'lc'), '42501', null,
                 'anon cannot call ad_rescue_result');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- ================================================================================================
-- C. Arkadaş push'u (claim_social_push)
-- ================================================================================================

select pg_temp.mk_user('sp_sel') as ssel \gset
select pg_temp.mk_user('sp_rec') as srec \gset
select pg_temp.mk_user('sp_off') as soff \gset
select pg_temp.friends(:'ssel', :'srec') as _n \gset
select pg_temp.friends(:'ssel', :'soff') as _n \gset
select pg_temp.token(:'srec', 'ExponentPushToken[rec-000001]') as _n \gset
select pg_temp.token(:'soff', 'ExponentPushToken[off-000001]') as _n \gset
update public.user_settings set poke_push_enabled = false where user_id = :'soff';

insert into public.pokes (sender_id, recipient_id, tone, message_key) values (:'ssel', :'srec', 'hype', 'finish_together');
select id as n_hype from public.notifications where recipient_id = :'srec' and kind = 'poke_hype' \gset
insert into public.pokes (sender_id, recipient_id, tone, message_key) values (:'ssel', :'soff', 'roast', 'cactus_faster');
select id as n_off from public.notifications where recipient_id = :'soff' and kind = 'poke_roast' \gset
insert into public.notifications (recipient_id, kind, actor_id, local_date)
values (:'soff', 'friend_request', :'ssel', current_date) returning id as n_req \gset

select tests.authenticate_as_service_role();
select is(
  (select jsonb_build_object('kind', j->>'kind', 'actor', j->>'actor_name', 'text', j->>'poke_text', 'tokens', j->'tokens')
   from public.claim_social_push(:'n_hype') j),
  jsonb_build_object('kind', 'poke_hype', 'actor', 'Sp_Sel', 'text', 'Beraber bitireceğiz',
                     'tokens', jsonb_build_array('ExponentPushToken[rec-000001]')),
  'claim_social_push: poke push data (actor name, message text, tokens)');
select is(public.claim_social_push(:'n_hype'), null, 'claim_social_push: a notification is pushed once');
select is(public.claim_social_push(:'n_off'), null, 'claim_social_push: no poke push when the recipient turned poke pushes off');
select is((select j->>'kind' from public.claim_social_push(:'n_req') j), 'friend_request',
          'claim_social_push: poke preference does not silence friend requests');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

insert into public.notifications (recipient_id, kind, actor_id, local_date)
values (:'srec', 'friend_request', :'ssel', current_date) returning id as n_blk \gset
insert into public.blocks (blocker_id, blocked_id) values (:'srec', :'ssel');
insert into public.notifications (recipient_id, kind, local_date, payload)
values (:'srec', 'daily_reminder', current_date, '{"text":"x"}') returning id as n_diken \gset
select tests.authenticate_as_service_role();
select is(public.claim_social_push(:'n_blk'), null, 'claim_social_push: nothing between blocked users');
select is(public.claim_social_push(:'n_diken'), null, 'claim_social_push: Diken notifications are not social pushes');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select tests.authenticate_as('sp_rec');
select throws_ok(format($$select public.claim_social_push(%L)$$, :'n_hype'), '42501', null,
                 'a signed-in user cannot call claim_social_push');
select throws_ok($$select * from public.queue_diken_notifications()$$, '42501', null,
                 'a signed-in user cannot call queue_diken_notifications');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- ================================================================================================
-- D. Diken push'u (queue_diken_notifications), İstanbul UTC+3, 2026-11-10
-- ================================================================================================

-- ali: genel hatırlatma 21:00; iki challenge (biri 21:00 → genel olan yeter, diğeri 22:30)
select pg_temp.mk_user('dk_ali') as dali \gset
select pg_temp.token(:'dali', 'ExponentPushToken[ali-000001]') as _n \gset
select pg_temp.mk_ch('Kahvesiz', date '2026-11-05', 30, '21:00') as dc1 \gset
select pg_temp.mk_ch('Okuma', date '2026-11-05', 30, '22:30') as dc2 \gset
select pg_temp.add_member(:'dc1', :'dali', date '2026-11-05') as _n \gset
select pg_temp.add_member(:'dc2', :'dali', date '2026-11-05') as _n \gset
select pg_temp.ci(:'dali', :'dc1', date '2026-11-05', date '2026-11-09') as _n \gset
select pg_temp.ci(:'dali', :'dc2', date '2026-11-05', date '2026-11-09') as _n \gset

select is_empty($$select * from app.queue_diken_notifications('2026-11-10 17:50+00')$$,
                'Diken: nothing before the reminder time (20:50 local)');
select results_eq(
  $$select recipient_id::text, kind::text, challenge_id, body, url, tokens from app.queue_diken_notifications('2026-11-10 18:05+00')$$,
  format($$values (%L, 'daily_reminder', null::uuid, 'Su yok mu su? Bugünkü görevlerin seni bekliyor.', '/', array['ExponentPushToken[ali-000001]'])$$, :'dali'),
  'Diken: daily reminder at 21:05 local (the 21:00 challenge reminder is covered by it)');
select results_eq(
  format($$select payload->>'text', pushed_at from public.notifications where recipient_id = %L and kind = 'daily_reminder'$$, :'dali'),
  $$values ('Su yok mu su? Bugünkü görevlerin seni bekliyor.', '2026-11-10 18:05+00'::timestamptz)$$,
  'Diken: the notification row keeps the text (Activity) and is marked pushed');
select is_empty($$select * from app.queue_diken_notifications('2026-11-10 18:20+00')$$,
                'Diken: the same reminder is sent once a day');
select results_eq(
  $$select kind::text, body from app.queue_diken_notifications('2026-11-10 19:05+00')$$,
  $$values ('day_ending', 'Gün bitiyor, 2 görevin duruyor. Susuz kaldım burada.')$$,
  'Diken: "day ending" at 22:05 local with the number of open tasks');
select is_empty($$select * from app.queue_diken_notifications('2026-11-10 19:35+00')$$,
                'Diken: the 22:30 challenge reminder is dropped (2 per day)');
select is((select count(*)::int from public.notifications where recipient_id = :'dali' and actor_id is null), 2,
          'Diken: no notification row is left for a push that was not allowed');

-- bea: genel hatırlatma kapalı; grubun saati 19:00, kişisel saati 19:30
select pg_temp.mk_user('dk_bea') as dbea \gset
select pg_temp.token(:'dbea', 'ExponentPushToken[bea-000001]') as _n \gset
update public.user_settings set daily_reminder_time = null where user_id = :'dbea';
select pg_temp.mk_ch('Plank', date '2026-11-05', 30, '19:00') as dc3 \gset
update public.challenges set short_title = 'Plank' where id = :'dc3';
select pg_temp.add_member(:'dc3', :'dbea', date '2026-11-05') as _n \gset
update public.challenge_members set reminder_time = '19:30' where challenge_id = :'dc3' and user_id = :'dbea';
select is_empty(format($$select * from app.queue_diken_notifications('2026-11-10 16:10+00') where recipient_id = %L$$, :'dbea'),
                'Diken: the group time is replaced by the personal reminder time');
select results_eq(
  format($$select kind::text, challenge_id, body, url from app.queue_diken_notifications('2026-11-10 16:35+00') where recipient_id = %L$$, :'dbea'),
  format($$values ('daily_reminder', %L::uuid, 'Su yok mu su? Plank seni bekliyor.', %L)$$, :'dc3', '/challenge/' || :'dc3'),
  'Diken: challenge reminder at the personal time (19:35 local), linking to the challenge');

-- cem: bekleyen görev var ama push token'ı yok; dila: bugünü işaretledi
select pg_temp.mk_user('dk_cem') as dcem \gset
select pg_temp.add_member(:'dc1', :'dcem', date '2026-11-05') as _n \gset
select pg_temp.mk_user('dk_dila') as ddila \gset
select pg_temp.token(:'ddila', 'ExponentPushToken[dila-00001]') as _n \gset
select pg_temp.add_member(:'dc1', :'ddila', date '2026-11-05') as _n \gset
select pg_temp.ci(:'ddila', :'dc1', date '2026-11-05', date '2026-11-10') as _n \gset
select is_empty(
  format($$select * from app.queue_diken_notifications('2026-11-10 18:05+00') where recipient_id in (%L, %L)$$, :'dcem', :'ddila'),
  'Diken: no reminder without a push token, nor when today is already done');
select is((select count(*)::int from public.notifications where recipient_id = :'dcem'), 0,
          'Diken: users without a push token get no rows');

-- Sessiz saatler: 23:40'a ayarlı hatırlatma gitmez; 23:00'teki pencere gece yarısına taşmadan çalışır
select pg_temp.mk_user('dk_eda') as deda \gset
select pg_temp.token(:'deda', 'ExponentPushToken[eda-000001]') as _n \gset
select pg_temp.add_member(:'dc1', :'deda', date '2026-11-05') as _n \gset
update public.user_settings set daily_reminder_time = '23:40' where user_id = :'deda';
select is_empty(format($$select * from app.queue_diken_notifications('2026-11-10 20:45+00') where recipient_id = %L$$, :'deda'),
                'Diken: quiet hours (23:45 local) block the reminder');
update public.user_settings set daily_reminder_time = '23:00' where user_id = :'deda';
select is((select count(*)::int from app.queue_diken_notifications('2026-11-10 20:10+00') where recipient_id = :'deda'), 1,
          'Diken: a 23:00 reminder is sent at 23:10 local');

-- Seri koptu: dün (9 Kasım) kaçtı, sabah 09:05'te kurtarma hatırlatması
select pg_temp.mk_user('dk_fer') as dfer \gset
select pg_temp.token(:'dfer', 'ExponentPushToken[fer-000001]') as _n \gset
update public.user_settings set daily_reminder_time = null where user_id = :'dfer';
select pg_temp.mk_ch('Yürüyüş', date '2026-11-01', 30) as dc4 \gset
select pg_temp.add_member(:'dc4', :'dfer', date '2026-11-01') as _n \gset
select pg_temp.ci(:'dfer', :'dc4', date '2026-11-01', date '2026-11-08') as _n \gset
select is_empty(format($$select * from app.queue_diken_notifications('2026-11-10 05:30+00') where recipient_id = %L$$, :'dfer'),
                'Diken: nothing before the 09:00 "streak broken" time (08:30 local)');
select results_eq(
  format($$select kind::text, body, url from app.queue_diken_notifications('2026-11-10 06:05+00') where recipient_id = %L$$, :'dfer'),
  $$values ('streak_broken', 'Dün kaçtı. Beni sulamak için 24 saatin var.', '/streak-lost')$$,
  'Diken: "streak broken" at 09:05 local while the rescue is pending');
select is_empty(format($$select * from app.queue_diken_notifications('2026-11-10 06:20+00') where recipient_id = %L$$, :'dfer'),
                'Diken: "streak broken" once a day');

-- Günlük sınır gönderim anının yerel gününe göre: ertesi gün yeniden 2 hak
select is((select count(*)::int from app.queue_diken_notifications('2026-11-11 18:05+00') where recipient_id = :'dali'), 1,
          'Diken: the next local day the reminder is sent again');

-- Metinler (design/Notifications.dc.html)
select is(app.diken_text('daily_reminder'), 'Su yok mu su? Bugünkü görevlerin seni bekliyor.', 'copy: daily reminder');
select is(app.diken_text('day_ending', 3), 'Gün bitiyor, 3 görevin duruyor. Susuz kaldım burada.', 'copy: day ending');
select is(app.diken_text('streak_broken'), 'Dün kaçtı. Beni sulamak için 24 saatin var.', 'copy: streak broken');
select is(app.in_diken_window('23:30', '23:00'), true, 'window: 30 minutes after the target');
select is(app.in_diken_window('00:10', '23:30'), false, 'window: does not wrap past midnight');

-- Servis rolü sarmalayıcısı
select tests.authenticate_as_service_role();
select lives_ok($$select * from public.queue_diken_notifications()$$, 'service role can run queue_diken_notifications');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- ================================================================================================
-- E. pg_cron / pg_net yoksa
-- ================================================================================================

select is(app.call_edge_function('push', '{"mode":"schedule"}'),
          case when exists (select 1 from pg_extension where extname = 'pg_net') then app.call_edge_function('push', '{}') end,
          'call_edge_function is a no-op without pg_net / Vault secrets');
set local client_min_messages = warning;
select ok(case when exists (select 1 from pg_extension where extname = 'pg_cron') then true
               else app.install_cron_jobs() = '{}'::text[] end,
          'install_cron_jobs installs nothing without pg_cron');
select has_trigger('public', 'notifications', 'notifications_push_webhook', 'notifications INSERT → push webhook trigger');
select lives_ok(format($$insert into public.notifications (recipient_id, kind, actor_id, local_date)
                         values (%L, 'friend_request', %L, current_date)$$, :'dali', :'dbea'),
                'the webhook trigger never breaks the insert');
select has_trigger('auth', 'users', 'gazla_sync_email_hash', 'auth.users → email hash trigger');

select * from finish();
rollback;
