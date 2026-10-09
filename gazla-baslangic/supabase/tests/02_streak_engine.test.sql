-- pgTAP: streak engine (migration 500) and the read RPCs that expose it (migration 700).
--
-- Time is driven explicitly through the p_at parameter of the app.* functions (run as postgres);
-- the now()-based public RPCs (my_streak, my_today, my_pending_rescues, rescue_streak,
-- grant_ad_rescue, my_garden, finish_due_challenges) get data built relative to now().
-- Everything is created inside the transaction and rolled back. Only basejump-compatible test helpers
-- are used (create_supabase_user, authenticate_as[_service_role], clear_authentication); going back to
-- postgres is a plain RESET ROLE.
--
-- Run:  supabase test db   (or the local testbed: ./test.sh supabase/tests/02_streak_engine.test.sql)
begin;
select plan(188);
-- This file tests behaviour, not privileges (01_rls_privileges does). Expected values are computed
-- with app.* helpers, sometimes while signed in, so the helpers are opened inside this transaction.
grant execute on all functions in schema app to authenticated;

-- ------------------------------------------------------------------------------------------------
-- Helpers (pg_temp: disappear with the session; only called as postgres)
-- ------------------------------------------------------------------------------------------------

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

create function pg_temp.mk_ch(
  p_title text, p_start date, p_days integer, p_type public.task_type default 'check',
  p_base numeric default null, p_inc numeric default 0, p_max numeric default null
) returns uuid
language sql as $$
  insert into public.challenges (title, task_type, duration_days, start_date, number_unit,
                                 number_base_target, number_daily_increment, number_step, number_max)
  values (p_title, p_type, p_days, p_start,
          case when p_type = 'number' then 'sn' end, p_base, coalesce(p_inc, 0),
          case when p_type = 'number' then 5 end, p_max)
  returning id
$$;

create function pg_temp.add_member(
  p_ch uuid, p_user uuid, p_joined_on date, p_joined_at timestamptz default null,
  p_status public.member_status default 'active', p_left_on date default null
) returns integer
language sql as $$
  insert into public.challenge_members (challenge_id, user_id, status, joined_at, joined_on, left_on)
  values (p_ch, p_user, p_status, coalesce(p_joined_at, p_joined_on::timestamptz), p_joined_on, p_left_on)
  returning 1
$$;

-- Check-ins for every day in [p_from, p_to] except p_skip (direct insert, as if done on time)
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

-- A rescue row inserted directly (ad method, unique fake reward id)
create function pg_temp.rescue(p_user uuid, p_ch uuid, p_day date) returns integer
language sql as $$
  insert into public.streak_rescues (user_id, challenge_id, rescued_date, method, ad_reward_id)
  values (p_user, p_ch, p_day, 'ad', 'direct-' || gen_random_uuid())
  returning 1
$$;

-- day_closes_at(d) must be exactly the instant open_dates stops offering d
create function pg_temp.close_consistent(p_user uuid, p_day date) returns boolean
language sql as $$
  select (p_day = any (app.open_dates(p_user, app.day_closes_at(p_user, p_day) - interval '1 microsecond')))
     and not (p_day = any (app.open_dates(p_user, app.day_closes_at(p_user, p_day))))
$$;

-- Runs a statement whose outcome is not under test (setup steps that a fix might legitimately reject)
create function pg_temp.try_sql(p_sql text) returns text
language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return sqlstate || ': ' || sqlerrm;
end
$$;

-- ================================================================================================
-- A. Local day, 2 h grace, day close (app.local_date / app.open_dates / app.day_closes_at)
-- ================================================================================================

select pg_temp.mk_user('sk_ist', 'Europe/Istanbul') as ist \gset
select pg_temp.mk_user('sk_nyc', 'America/New_York') as nyc \gset
select pg_temp.mk_user('sk_ber', 'Europe/Berlin') as ber \gset
select pg_temp.mk_user('sk_ppg', 'Pacific/Pago_Pago') as ppg \gset
select pg_temp.mk_user('sk_kat', 'Asia/Kathmandu') as kat \gset
select pg_temp.mk_user('sk_kir', 'Pacific/Kiritimati') as kir \gset

select is(app.grace_period(), interval '2 hours', 'grace period is 2 hours');
select is(app.rescue_window(), interval '24 hours', 'rescue window is 24 hours');

-- Istanbul (UTC+3, no DST)
select is(app.local_date(:'ist', '2026-09-10 20:59:59+00'), date '2026-09-10',
          'Istanbul: 23:59:59 local is still the same local day');
select is(app.local_date(:'ist', '2026-09-10 21:00+00'), date '2026-09-11',
          'Istanbul: local midnight starts the next local day although UTC is still on the 10th');
select is(app.open_dates(:'ist', '2026-09-10 12:00+00'), array[date '2026-09-10'],
          'Istanbul afternoon: only today is open');
select is(app.open_dates(:'ist', '2026-09-10 21:00+00'), array[date '2026-09-11', date '2026-09-10'],
          'Istanbul 00:00 local: today and yesterday are open (today first)');
select is(app.open_dates(:'ist', '2026-09-10 22:59:59+00'), array[date '2026-09-11', date '2026-09-10'],
          'Istanbul 01:59:59 local: yesterday still open in the grace period');
select is(app.open_dates(:'ist', '2026-09-10 23:00+00'), array[date '2026-09-11'],
          'Istanbul 02:00 local: yesterday is closed');
select is(app.day_closes_at(:'ist', '2026-09-10'), '2026-09-10 23:00+00'::timestamptz,
          'Istanbul: 2026-09-10 closes at 2026-09-11 02:00 local (23:00 UTC)');
select is(app.user_timezone(gen_random_uuid()), 'Europe/Istanbul',
          'a user without settings falls back to Europe/Istanbul');

-- New York (UTC-4 in September): negative offset, UTC date runs ahead of the local date
select is(app.local_date(:'nyc', '2026-09-11 03:00+00'), date '2026-09-10',
          'New York: 23:00 local on the 10th is still the 10th although UTC is on the 11th');
select is(app.open_dates(:'nyc', '2026-09-11 05:59:59+00'), array[date '2026-09-11', date '2026-09-10'],
          'New York 01:59:59 local: yesterday still open');
select is(app.open_dates(:'nyc', '2026-09-11 06:00+00'), array[date '2026-09-11'],
          'New York 02:00 local: yesterday closed');
select is(app.day_closes_at(:'nyc', '2026-09-10'), '2026-09-11 06:00+00'::timestamptz,
          'New York: 2026-09-10 closes at 02:00 EDT (06:00 UTC)');

-- Pago Pago (UTC-11), Kathmandu (UTC+05:45), Kiritimati (UTC+14)
select is(app.local_date(:'ppg', '2026-09-11 10:59+00'), date '2026-09-10',
          'Pago Pago (UTC-11): 10:59 UTC on the 11th is still the 10th locally');
select is(app.open_dates(:'ppg', '2026-09-11 12:59:59+00'), array[date '2026-09-11', date '2026-09-10'],
          'Pago Pago 01:59:59 local: yesterday still open');
select is(app.open_dates(:'ppg', '2026-09-11 13:00+00'), array[date '2026-09-11'],
          'Pago Pago 02:00 local: yesterday closed');
select is(app.day_closes_at(:'kat', '2026-09-10'), '2026-09-10 20:15+00'::timestamptz,
          'Kathmandu (+05:45): day closes at 02:00 local = 20:15 UTC');
select is(app.open_dates(:'kat', '2026-09-10 20:14:59+00'), array[date '2026-09-11', date '2026-09-10'],
          'Kathmandu: one second before the close the previous day is still open');
select is(app.local_date(:'kir', '2026-09-10 10:00+00'), date '2026-09-11',
          'Kiritimati (+14): 10:00 UTC is already the next local day');
select is(app.day_closes_at(:'kir', '2026-09-10'), '2026-09-10 12:00+00'::timestamptz,
          'Kiritimati: 2026-09-10 closes at 12:00 UTC the same UTC day');

-- Europe/Berlin, fall-back night 2026-10-25 (03:00 CEST -> 02:00 CET)
select is(app.open_dates(:'ber', '2026-10-24 23:59:59+00'), array[date '2026-10-25', date '2026-10-24'],
          'Berlin DST night: 01:59:59 CEST still in the grace period for 10-24');
select is(app.open_dates(:'ber', '2026-10-25 00:00+00'), array[date '2026-10-25'],
          'Berlin DST night: at 02:00 CEST 10-24 is closed');
select is(app.open_dates(:'ber', '2026-10-25 01:30+00'), array[date '2026-10-25'],
          'Berlin DST night: 10-24 does not reopen during the repeated 02:00-03:00 hour (02:30 CET)');
select is(app.local_date(:'ber', '2026-10-25 22:59:59+00'), date '2026-10-25',
          'Berlin: 23:59:59 CET on the 25-hour day is still 10-25');
select is(app.day_closes_at(:'ber', '2026-10-25'), '2026-10-26 01:00+00'::timestamptz,
          'Berlin: the day after the switch closes at 02:00 CET (01:00 UTC)');
select ok(pg_temp.close_consistent(:'ber', '2026-10-24'),
          'Berlin DST: day_closes_at(2026-10-24) is exactly when open_dates stops offering 10-24');
select ok(pg_temp.close_consistent(:'nyc', '2026-10-31') and pg_temp.close_consistent(:'nyc', '2026-11-01')
          and pg_temp.close_consistent(:'nyc', '2026-03-07'),
          'New York DST (fall back 11-01, spring forward 03-08): day_closes_at agrees with open_dates');

-- Invariant over many zones and every day of a year that contains DST transitions
create temp table sk_zone_users (u uuid, tz text) on commit drop;
insert into sk_zone_users
select pg_temp.mk_user('sk_z' || i, tz), tz
from unnest(array['Europe/Istanbul', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles',
                  'Australia/Sydney', 'America/Santiago', 'Asia/Kathmandu', 'Pacific/Kiritimati',
                  'Pacific/Pago_Pago', 'Australia/Lord_Howe']) with ordinality as z(tz, i);
select is_empty(
  $$select z.tz, d::date from sk_zone_users z,
           generate_series(date '2026-03-01', date '2027-04-30', interval '1 day') d
    where not pg_temp.close_consistent(z.u, d::date)$$,
  'day_closes_at agrees with open_dates for every day 2026-03..2027-04 in 10 zones (DST, +14, -11, +05:45)');

-- ================================================================================================
-- B. Per-challenge streak (app.challenge_streak), range boundaries, outside-range check-ins
-- ================================================================================================

select pg_temp.mk_ch('sk streak 30', '2026-09-01', 30) as ca \gset
select pg_temp.mk_ch('sk streak 7', '2026-09-01', 7) as cb \gset
select pg_temp.mk_ch('sk future', '2026-09-20', 10) as cc \gset

select pg_temp.mk_user('sk_cs1') as cs1 \gset
select pg_temp.add_member(:'ca', :'cs1', '2026-09-01') as _n \gset
select pg_temp.ci(:'cs1', :'ca', '2026-09-01', '2026-09-10', array['2026-09-06'::date]) as _n \gset
-- stray: before start
select pg_temp.ci(:'cs1', :'ca', '2026-08-31', '2026-08-31') as _n \gset

-- joined mid-challenge
select pg_temp.mk_user('sk_cs2') as cs2 \gset
select pg_temp.add_member(:'ca', :'cs2', '2026-09-05') as _n \gset
select pg_temp.ci(:'cs2', :'ca', '2026-09-05', '2026-09-09') as _n \gset
-- stray: before joined_on
select pg_temp.ci(:'cs2', :'ca', '2026-09-03', '2026-09-03') as _n \gset

-- left on 09-06
select pg_temp.mk_user('sk_cs3') as cs3 \gset
select pg_temp.add_member(:'ca', :'cs3', '2026-09-01', null, 'left', '2026-09-06') as _n \gset
select pg_temp.ci(:'cs3', :'ca', '2026-09-01', '2026-09-08') as _n \gset

-- negative offset
select pg_temp.mk_user('sk_cs4', 'America/Los_Angeles') as cs4 \gset
select pg_temp.add_member(:'ca', :'cs4', '2026-09-01') as _n \gset
select pg_temp.ci(:'cs4', :'ca', '2026-09-01', '2026-09-02') as _n \gset

-- ended challenge
select pg_temp.mk_user('sk_cs5') as cs5 \gset
select pg_temp.add_member(:'cb', :'cs5', '2026-09-01') as _n \gset
-- 09-08 is after end
select pg_temp.ci(:'cs5', :'cb', '2026-09-01', '2026-09-08') as _n \gset

-- missed the last day
select pg_temp.mk_user('sk_cs6') as cs6 \gset
select pg_temp.add_member(:'cb', :'cs6', '2026-09-01') as _n \gset
select pg_temp.ci(:'cs6', :'cb', '2026-09-01', '2026-09-06') as _n \gset

-- not started yet
select pg_temp.mk_user('sk_cs7') as cs7 \gset
select pg_temp.add_member(:'cc', :'cs7', '2026-09-14') as _n \gset

-- joins during grace
select pg_temp.mk_user('sk_cs8') as cs8 \gset
select pg_temp.add_member(:'ca', :'cs8', '2026-09-12', '2026-09-12 01:00+03') as _n \gset

-- covered 09-01..09-03, 09-04 forgotten, 09-05 checked in right after midnight
select pg_temp.mk_user('sk_cs9') as cs9 \gset
select pg_temp.add_member(:'ca', :'cs9', '2026-09-01') as _n \gset
select pg_temp.ci(:'cs9', :'ca', '2026-09-01', '2026-09-05', array['2026-09-04'::date]) as _n \gset

select is(app.challenge_streak(:'cs1', :'ca', '2026-09-10 18:00+03'), 4,
          'challenge streak counts covered days after the last gap (09-07..09-10) when today is done');
select is(app.challenge_streak(:'cs1', :'ca', '2026-09-11 12:00+03'), 4,
          'today not yet done (open) does not break the streak');
select is(app.challenge_streak(:'cs1', :'ca', '2026-09-12 01:59:59+03'), 4,
          'yesterday still open in the 2h grace does not break the streak');
select is(app.challenge_streak(:'cs1', :'ca', '2026-09-12 02:00+03'), 0,
          'yesterday closed without coverage breaks the streak at 02:00 local');
select is(app.challenge_streak(:'cs1', :'ca', '2026-09-06 23:00+03'), 5,
          'a check-in before start_date does not extend the streak (09-01..09-05 = 5)');
select is(app.challenge_streak(:'cs1', :'ca', '2026-09-07 02:00+03'), 1,
          'after the 09-06 gap closes only the new run (09-07) counts');
select is(app.challenge_streak(:'cs1', :'ca', '2026-08-31 12:00+03'), 0,
          'before start_date the streak is 0 even with a stray check-in');
select is(app.covered_run_ending(:'cs1', :'ca', '2026-09-05'), 5,
          'covered_run_ending: 5 consecutive covered days end on 09-05');
select is(app.covered_run_ending(:'cs1', :'ca', '2026-09-06'), 0,
          'covered_run_ending: an uncovered day ends the run');
select is(app.challenge_streak(:'cs2', :'ca', '2026-09-09 20:00+03'), 5,
          'joined mid-challenge: range starts at joined_on, earlier days are not gaps');
select is(app.days_done(:'cs2', :'ca'), 5,
          'joined mid-challenge: a check-in before joined_on is not counted in days_done');
select is(app.challenge_streak(:'cs3', :'ca', '2026-09-10 12:00+03'), 5,
          'left member: days from left_on on are not counted (09-01..09-05)');
select is(app.days_done(:'cs3', :'ca'), 5,
          'left member: check-ins on/after left_on are not counted in days_done');
select is(app.challenge_streak(:'cs4', :'ca', '2026-09-04 08:59:59+00'), 2,
          'Los Angeles: at 01:59:59 PDT 09-03 is still open (streak kept at 2)');
select is(app.challenge_streak(:'cs4', :'ca', '2026-09-04 09:00+00'), 0,
          'Los Angeles: at 02:00 PDT 09-03 is closed (uses the user timezone, not UTC)');
select is(app.challenge_streak(:'cs5', :'cb', '2026-09-20 12:00+03'), 7,
          'ended challenge: streak stops at end_date and ignores a check-in after it');
select is(app.days_done(:'cs5', :'cb'), 7,
          'ended challenge: days_done ignores check-ins after end_date');
select is(app.challenge_streak(:'cs6', :'cb', '2026-09-08 01:59+03'), 6,
          'last day still in grace after the challenge ended: streak kept');
select is(app.challenge_streak(:'cs6', :'cb', '2026-09-08 02:00+03'), 0,
          'last day closed uncovered: streak broken');
select is(app.challenge_streak(:'cs7', :'cc', '2026-09-15 12:00+03'), 0,
          'challenge not started yet: streak 0');
select is(app.challenge_streak(:'cs1', :'cb', '2026-09-05 12:00+03'), 0,
          'non-member: streak 0');
select results_eq(
  format($$select day, is_open from app.user_day_status(%L, '2026-09-12 01:00+03') where day >= '2026-09-10' order by day$$, :'cs1'),
  $$values ('2026-09-10'::date, false), ('2026-09-11'::date, true), ('2026-09-12'::date, true)$$,
  'user_day_status: during the grace period yesterday and today are open, earlier days closed');
select is(app.user_streak(:'cs2', '2026-09-09 20:00+03'), 5,
          'overall streak ignores a check-in dated before joined_on');
select is(app.user_streak(:'cs3', '2026-09-10 12:00+03'), 5,
          'overall streak ignores check-ins dated on/after left_on');
select ok(app.challenge_streak(:'cs9', :'ca', '2026-09-05 01:30+03') in (1, 3),
          'grace period: a still-open uncovered yesterday is not bridged (streak is 1 or 3, never 4)');
select ok(app.user_streak(:'cs9', '2026-09-05 01:30+03') in (1, 3),
          'grace period: the overall streak does not bridge a still-open uncovered yesterday either');
select throws_ok(
  format($$select app.do_checkin(%L, %L, null, null, null, null, '2026-09-15 12:00+03')$$, :'cs7', :'cc'),
  'P0001', 'Challenge bu gün sürmüyor', 'cannot check in before the challenge starts');
select throws_ok(
  format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-11', '2026-09-12 01:00+03')$$, :'cs8', :'ca'),
  'P0001', 'Challenge bu gün sürmüyor',
  'joined during the grace period: the still-open previous day is outside the member range');
select throws_ok(
  format($$select app.do_checkin(%L, %L, null, null, null, null, '2026-09-07 12:00+03')$$, :'cs3', :'ca'),
  '42501', 'Bu challenge''da değilsin', 'a member who left cannot check in');
select throws_ok(
  format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-05', '2026-09-06 02:00+03')$$, :'cs1', :'ca'),
  'P0001', 'Bu gün artık işaretlenemez', 'a closed day cannot be checked in (02:00 local)');
select lives_ok(
  format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-11', '2026-09-12 01:59+03')$$, :'cs1', :'ca'),
  'yesterday can be checked in at 01:59 local');
select is(app.challenge_streak(:'cs1', :'ca', '2026-09-12 02:00+03'), 5,
          'after the grace check-in the run continues (09-07..09-11)');
select throws_ok(
  format($$select app.do_undo_checkin(%L, %L, '2026-09-11', '2026-09-12 02:00+03')$$, :'cs1', :'ca'),
  'P0001', 'Geçmiş günler değiştirilemez', 'a closed day cannot be undone');

-- ================================================================================================
-- C. Overall streak (app.user_streak / user_day_status / user_longest_streak)
-- ================================================================================================

select pg_temp.mk_user('sk_us1') as us1 \gset
-- 08-01..08-10
select pg_temp.mk_ch('sk overall A', '2026-08-01', 10) as ua \gset
-- 08-04..08-10
select pg_temp.mk_ch('sk overall B', '2026-08-04', 7) as ub \gset
-- 08-15..08-21 (gap 08-11..08-14)
select pg_temp.mk_ch('sk overall C', '2026-08-15', 7) as uc \gset
select pg_temp.add_member(:'ua', :'us1', '2026-07-31') as _n \gset
select pg_temp.add_member(:'ub', :'us1', '2026-07-31') as _n \gset
select pg_temp.add_member(:'uc', :'us1', '2026-08-10') as _n \gset
select pg_temp.ci(:'us1', :'ua', '2026-08-01', '2026-08-10') as _n \gset
select pg_temp.ci(:'us1', :'ub', '2026-08-04', '2026-08-10', array['2026-08-06'::date]) as _n \gset
select pg_temp.ci(:'us1', :'uc', '2026-08-15', '2026-08-18') as _n \gset

select is(app.user_streak(:'us1', '2026-07-31 12:00+03'), 0, 'overall streak is 0 before any challenge');
select is(app.user_streak(:'us1', '2026-08-05 20:00+03'), 5,
          'two challenges with different start dates: every required challenge covered for 5 days');
select is(app.user_streak(:'us1', '2026-08-06 20:00+03'), 5,
          'today partially done (1 of 2) is open: not counted, not a break');
select results_eq(
  format($$select required, covered, is_open from app.user_day_status(%L, '2026-08-07 12:00+03') where day = '2026-08-06'$$, :'us1'),
  $$values (2, 1, false)$$, 'user_day_status: 08-06 required 2, covered 1, closed');
select is(app.user_streak(:'us1', '2026-08-07 12:00+03'), 1,
          'overall streak breaks when one of the required challenges was missed');
select is(app.user_streak(:'us1', '2026-08-10 20:00+03'), 4, 'overall streak rebuilds after the break');
select results_eq(
  format($$select required from app.user_day_status(%L, '2026-08-14 12:00+03') where day = '2026-08-12'$$, :'us1'),
  $$values (0)$$, 'user_day_status: a day without any active challenge requires nothing');
select is(app.user_streak(:'us1', '2026-08-14 12:00+03'), 4,
          'days without any active challenge freeze the streak (no break)');
select is(app.user_streak(:'us1', '2026-08-18 20:00+03'), 8,
          'overall streak spans challenge boundaries across a no-challenge gap');
select is(app.user_longest_streak(:'us1', '2026-08-10 20:00+03'), 5,
          'longest streak picks the longest island (5 vs 4)');
select is(app.user_streak(:'us1', '2026-08-20 12:00+03'), 0, 'missing 08-19 breaks the overall streak');
select results_eq(
  format($$select current_streak, longest_streak, stage, wilted, done_today, total_today, free_rescue_available
           from app.streak_summary(%L, '2026-08-20 12:00+03')$$, :'us1'),
  $$values (0, 8, 'filiz'::public.diken_stage, true, 0, 1, true)$$,
  'streak_summary after a break: current 0, longest 8, wilted (rescue pending), 0/1 today');

-- ================================================================================================
-- D. Diken stage thresholds
-- ================================================================================================

select is(public.diken_stage_for(0), 'filiz'::public.diken_stage, 'stage 0 days = filiz');
select is(public.diken_stage_for(6), 'filiz'::public.diken_stage, 'stage 6 days = filiz');
select is(public.diken_stage_for(7), 'genc'::public.diken_stage, 'stage 7 days = genc');
select is(public.diken_stage_for(9), 'genc'::public.diken_stage, 'stage 9 days = genc');
select is(public.diken_stage_for(10), 'tam'::public.diken_stage, 'stage 10 days = tam');
select is(public.diken_stage_for(29), 'tam'::public.diken_stage, 'stage 29 days = tam');
select is(public.diken_stage_for(30), 'cicek'::public.diken_stage, 'stage 30 days = cicek');

-- ================================================================================================
-- E. Rescues: candidates, window, quota, restore
-- ================================================================================================

select pg_temp.mk_ch('sk rescue', '2026-09-01', 30) as ra \gset
select pg_temp.mk_user('sk_pr1') as pr1 \gset
select pg_temp.add_member(:'ra', :'pr1', '2026-09-01') as _n \gset
-- 09-05 missed
select pg_temp.ci(:'pr1', :'ra', '2026-09-01', '2026-09-04') as _n \gset

select is_empty(format($$select * from app.pending_rescues(%L, '2026-09-06 01:59:59+03')$$, :'pr1'),
                'no rescue while the missed day is still open (grace)');
select results_eq(
  format($$select challenge_id, missed_date, streak_before, expires_at from app.pending_rescues(%L, '2026-09-06 02:00+03')$$, :'pr1'),
  format($$values (%L::uuid, '2026-09-05'::date, 4, '2026-09-07 02:00+03'::timestamptz)$$, :'ra'),
  'rescue offered once the day closes: streak_before 4, expires 24h after the close');
select is((select expires_at from app.pending_rescues(:'pr1', '2026-09-06 12:00+03')),
          app.day_closes_at(:'pr1', '2026-09-05') + app.rescue_window(),
          'expires_at = day_closes_at(missed day) + rescue_window');
select isnt_empty(format($$select * from app.pending_rescues(%L, '2026-09-07 01:59:59+03')$$, :'pr1'),
                  'rescue still offered one second before expiry');
select is_empty(format($$select * from app.pending_rescues(%L, '2026-09-07 02:00+03')$$, :'pr1'),
                'rescue no longer offered at expiry');
select throws_ok(
  format($$select app.apply_rescue(%L, %L, '2026-09-05', 'free', null, '2026-09-07 02:00+03')$$, :'pr1', :'ra'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'apply_rescue rejects an expired window');
select is(app.challenge_streak(:'pr1', :'ra', '2026-09-06 12:00+03'), 0, 'streak is broken before the rescue');
select results_eq(
  format($$select wilted, current_streak from app.streak_summary(%L, '2026-09-06 12:00+03')$$, :'pr1'),
  $$values (true, 0)$$, 'streak_summary: wilted while a rescue is pending');
select results_eq(
  format($$select rescued_date, method, quota_month, ad_reward_id, created_at
           from app.apply_rescue(%L, %L, '2026-09-05', 'free', null, '2026-09-06 12:00+03')$$, :'pr1', :'ra'),
  $$values ('2026-09-05'::date, 'free'::public.rescue_method, '2026-09-01'::date, null::text, '2026-09-06 12:00+03'::timestamptz)$$,
  'free rescue recorded with the local month as quota_month');
select is(app.challenge_streak(:'pr1', :'ra', '2026-09-06 12:00+03'), 5, 'rescue restores the challenge streak');
select is(app.user_streak(:'pr1', '2026-09-06 12:00+03'), 5, 'rescue restores the overall streak');
select is(app.days_done(:'pr1', :'ra'), 5, 'a rescued day counts in days_done');
select results_eq(
  format($$select wilted, free_rescue_available from app.streak_summary(%L, '2026-09-06 12:00+03')$$, :'pr1'),
  $$values (false, false)$$, 'after the rescue: not wilted, free right used for this month');
select throws_ok(
  format($$select app.apply_rescue(%L, %L, '2026-09-05', 'ad', 'ssv-dup-0001', '2026-09-06 12:30+03')$$, :'pr1', :'ra'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'an already-rescued day is not offered again');

-- missed own first day
select pg_temp.mk_user('sk_pr2') as pr2 \gset
select pg_temp.add_member(:'ra', :'pr2', '2026-09-05') as _n \gset
select is_empty(format($$select * from app.pending_rescues(%L, '2026-09-06 12:00+03')$$, :'pr2'),
                'no rescue when the run before the missed day is 0 (missed the first day)');

select pg_temp.mk_user('sk_pr4') as pr4 \gset
select pg_temp.add_member(:'ra', :'pr4', '2026-09-01', null, 'left', '2026-09-06') as _n \gset
select pg_temp.ci(:'pr4', :'ra', '2026-09-01', '2026-09-04') as _n \gset
select is_empty(format($$select * from app.pending_rescues(%L, '2026-09-06 12:00+03')$$, :'pr4'),
                'no rescue offered to a member who left the challenge');

-- missed two days
select pg_temp.mk_user('sk_pr2b') as pr2b \gset
select pg_temp.add_member(:'ra', :'pr2b', '2026-09-01') as _n \gset
select pg_temp.ci(:'pr2b', :'ra', '2026-09-01', '2026-09-03') as _n \gset
select is_empty(format($$select * from app.pending_rescues(%L, '2026-09-06 12:00+03')$$, :'pr2b'),
                'no rescue for the second of two missed days (run before is 0)');
select throws_ok(
  format($$select app.apply_rescue(%L, %L, '2026-09-04', 'free', null, '2026-09-06 12:00+03')$$, :'pr2b', :'ra'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'an older missed day (window expired) cannot be rescued');
select throws_ok(
  format($$select app.apply_rescue(%L, %L, '2026-09-06', 'free', null, '2026-09-06 12:00+03')$$, :'pr2b', :'ra'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'today (still open) cannot be rescued');
select throws_ok(
  format($$select app.apply_rescue(%L, %L, '2026-09-05', 'free', null, '2026-09-06 12:00+03')$$, :'pr2b', :'cb'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'a challenge the user is not a member of cannot be rescued');
select is_empty(format($$select * from app.pending_rescues(%L, '2026-09-05 12:00+03')$$, :'cs1'),
                'a covered day is never a rescue candidate');

-- Monthly free quota (user's local month)
-- 08-20..09-18
select pg_temp.mk_ch('sk quota', '2026-08-20', 30) as rq \gset
select pg_temp.mk_user('sk_pr3') as pr3 \gset
select pg_temp.add_member(:'rq', :'pr3', '2026-08-20') as _n \gset
select pg_temp.ci(:'pr3', :'rq', '2026-08-20', '2026-09-18',
                  array['2026-08-24', '2026-08-27', '2026-09-02']::date[]) as _n \gset

select results_eq(
  format($$select method, quota_month from app.apply_rescue(%L, %L, '2026-08-24', 'free', null, '2026-08-25 10:00+03')$$, :'pr3', :'rq'),
  $$values ('free'::public.rescue_method, '2026-08-01'::date)$$, 'first free rescue of August accepted');
select throws_ok(
  format($$select app.apply_rescue(%L, %L, '2026-08-27', 'free', null, '2026-08-28 10:00+03')$$, :'pr3', :'rq'),
  'P0001', 'Bu ayın ücretsiz kurtarma hakkı kullanıldı', 'second free rescue in the same local month rejected');
select is(app.free_rescue_available(:'pr3', '2026-08-28 10:00+03'), false, 'free right shown as used for August');
select results_eq(
  format($$select method, quota_month, ad_reward_id from app.apply_rescue(%L, %L, '2026-08-27', 'ad', 'ssv-aug-0001', '2026-08-28 10:00+03')$$, :'pr3', :'rq'),
  $$values ('ad'::public.rescue_method, null::date, 'ssv-aug-0001'::text)$$,
  'ad rescue still possible after the free right is used');
select is(app.free_rescue_month(:'pr3', '2026-08-31 21:30+00'), date '2026-09-01',
          'quota month follows the local month (00:30 on 09-01 Istanbul while UTC is still August)');
select is(app.free_rescue_available(:'pr3', '2026-08-31 21:30+00'), true, 'a new local month restores the free right');
select results_eq(
  format($$select quota_month from app.apply_rescue(%L, %L, '2026-09-02', 'free', null, '2026-09-03 10:00+03')$$, :'pr3', :'rq'),
  $$values ('2026-09-01'::date)$$, 'free rescue in the next month accepted');
select is(app.challenge_streak(:'pr3', :'rq', '2026-09-03 10:00+03'), 15,
          'three rescued days keep the 15-day run intact (08-20..09-03)');
select throws_ok(
  format($$insert into public.streak_rescues (user_id, challenge_id, rescued_date, method, quota_month)
           values (%L, %L, '2026-09-10', 'free', '2026-09-01')$$, :'pr3', :'rq'),
  '23505', null, 'the database itself refuses a second free rescue in the same quota month');

-- DST and the 24h window
select pg_temp.mk_user('sk_nyfb', 'America/New_York') as nyfb \gset
select pg_temp.mk_ch('sk ny fall', '2026-10-25', 10) as dfb \gset
select pg_temp.add_member(:'dfb', :'nyfb', '2026-10-25') as _n \gset
select pg_temp.ci(:'nyfb', :'dfb', '2026-10-25', '2026-10-31', array['2026-10-30'::date]) as _n \gset
select results_eq(
  format($$select missed_date, expires_at from app.pending_rescues(%L, '2026-11-01 05:30+00')$$, :'nyfb'),
  $$values ('2026-10-30'::date, '2026-11-01 06:00+00'::timestamptz)$$,
  'New York: 10-30 rescue offered before the fall-back hour, expiring 06:00 UTC');
select is_empty(
  format($$select * from app.pending_rescues(%L, '2026-11-01 06:30+00') where expires_at <= '2026-11-01 06:30+00'$$, :'nyfb'),
  'New York fall-back hour: pending_rescues never offers an already expired rescue');
select throws_ok(
  format($$select app.apply_rescue(%L, %L, '2026-10-30', 'ad', 'ssv-dst-0001', '2026-11-01 06:30+00')$$, :'nyfb', :'dfb'),
  'P0001', 'Bu gün için kurtarma yapılamaz', 'New York fall-back hour: an expired rescue is rejected');

select pg_temp.mk_user('sk_nysf', 'America/New_York') as nysf \gset
select pg_temp.mk_ch('sk ny spring', '2027-03-08', 10) as dsf \gset
select pg_temp.add_member(:'dsf', :'nysf', '2027-03-08') as _n \gset
select pg_temp.ci(:'nysf', :'dsf', '2027-03-08', '2027-03-14', array['2027-03-13'::date]) as _n \gset
select is(app.day_closes_at(:'nysf', '2027-03-13') + app.rescue_window(), '2027-03-15 07:00+00'::timestamptz,
          'New York spring forward: 03-13 rescue window ends 07:00 UTC on 03-15');
select isnt_empty(
  format($$select * from app.pending_rescues(%L, '2027-03-15 06:30+00') where missed_date = '2027-03-13'$$, :'nysf'),
  'New York spring forward (23h day): 03-13 is still rescuable inside its 24h window');

-- ================================================================================================
-- F. Number target progression
-- ================================================================================================

select pg_temp.mk_user('sk_nt') as nt \gset
select (app.do_create_challenge(:'nt', (select id from public.challenge_templates where slug = 'plank'),
        null, null, null, null, null, null, null, null, 0, null, null, '{}', '2026-09-01 10:00+03')).id as pl \gset
select pg_temp.ci(:'nt', :'pl', '2026-09-01', '2026-09-02') as _n \gset

select results_eq(
  format($$select app.number_target(%L, d) from unnest(array[0, 1, 2, 3, 10]) d$$, :'pl'),
  $$values (60::numeric), (60), (65), (70), (105)$$,
  'plank target: base 60 + 5 per day (day 0 clamps to base)');
select results_eq(
  format($$select day_index, target, done from app.today_tasks(%L, '2026-09-03 12:00+03') where challenge_id = %L$$, :'nt', :'pl'),
  $$values (3, 70::numeric, false)$$, 'today_tasks: day 3 of plank targets 70');
select results_eq(
  format($$select day_index, target from app.today_tasks(%L, '2026-09-10 12:00+03') where challenge_id = %L$$, :'nt', :'pl'),
  $$values (10, 105::numeric)$$, 'today_tasks: day 10 of plank targets 105');
select lives_ok(
  format($$select app.do_checkin(%L, %L, 10, null, null, null, '2026-09-03 12:00+03')$$, :'nt', :'pl'),
  'a number check-in below the target is accepted');
select is(app.challenge_streak(:'nt', :'pl', '2026-09-03 12:00+03'), 3, 'a below-target number check-in still counts');
select throws_ok(
  format($$select app.do_checkin(%L, %L, 601, null, null, null, '2026-09-04 12:00+03')$$, :'nt', :'pl'),
  '22023', 'Geçersiz değer', 'a number above number_max is rejected');
select is(app.number_target(:'ca', 5), null, 'check challenges have no number target');
select pg_temp.try_sql($$insert into public.challenges (title, task_type, duration_days, start_date, number_unit,
                         number_base_target, number_daily_increment, number_step, number_max)
                         values ('sk steep', 'number', 10, '2026-09-01', 'sn', 100, 50, 10, 300)$$) as _r \gset
select is_empty(
  $$select c.id, g from public.challenges c, generate_series(1, c.duration_days) g
    where c.task_type = 'number' and c.number_max is not null and app.number_target(c.id, g) > c.number_max$$,
  'a number target never exceeds number_max (the value a check-in may enter)');

-- ================================================================================================
-- G. Finalization snapshots and the garden
-- ================================================================================================

-- 09-01..09-07
select pg_temp.mk_ch('sk finish', '2026-09-01', 7) as fz \gset
select pg_temp.mk_user('sk_fa') as fa \gset
select pg_temp.mk_user('sk_fb') as fb \gset
select pg_temp.mk_user('sk_fc') as fc \gset
select pg_temp.mk_user('sk_fd') as fd \gset
select pg_temp.mk_user('sk_fx') as fx \gset
select pg_temp.mk_user('sk_fy') as fy \gset
select pg_temp.add_member(:'fz', :'fa', '2026-08-31', '2026-08-31 10:00+03') as _n \gset
select pg_temp.add_member(:'fz', :'fb', '2026-08-31', '2026-08-31 11:00+03') as _n \gset
select pg_temp.add_member(:'fz', :'fc', '2026-08-31', '2026-08-31 12:00+03') as _n \gset
select pg_temp.add_member(:'fz', :'fd', '2026-08-31', '2026-08-31 09:00+03', 'left', '2026-09-04') as _n \gset
select pg_temp.ci(:'fa', :'fz', '2026-09-01', '2026-09-07', array['2026-09-03'::date]) as _n \gset
select pg_temp.rescue(:'fa', :'fz', '2026-09-03') as _n \gset
select pg_temp.ci(:'fb', :'fz', '2026-09-01', '2026-09-07', array['2026-09-05'::date]) as _n \gset
select pg_temp.ci(:'fc', :'fz', '2026-09-01', '2026-09-07', array['2026-09-02'::date]) as _n \gset
select pg_temp.ci(:'fd', :'fz', '2026-09-01', '2026-09-03') as _n \gset
insert into public.friendships (requester_id, addressee_id, status, accepted_at)
values (:'fa', :'fx', 'accepted', now()), (:'fy', :'fb', 'accepted', now());

select is(app.finalize_user(:'fa', '2026-09-07 12:00+03'), 0, 'finalize_user: nothing to finish before end_date');
select is(app.finalize_member(:'fa', :'fz', '2026-09-08 01:59:59+03'), false,
          'finalize_member waits while the last day is still open (grace)');
select is((select finished_at from public.challenge_members where challenge_id = :'fz' and user_id = :'fa'), null,
          'no snapshot taken before the end day closes');
select is(app.finalize_member(:'fa', :'fz', '2026-09-09 03:00+03'), true, 'finalize_member snapshots after the end day closed');
select results_eq(
  format($$select finished_at, final_days_done::int, final_rescues::int, final_rank::int
           from public.challenge_members where challenge_id = %L and user_id = %L$$, :'fz', :'fa'),
  $$values ('2026-09-09 03:00+03'::timestamptz, 7, 1, 1)$$,
  'snapshot: 7/7 days (rescued day included), 1 rescue, rank 1');
select is(app.finalize_member(:'fa', :'fz', '2026-09-10 03:00+03'), false, 'finalize_member is not repeated');
select is(app.finalize_user(:'fb', '2026-09-09 03:00+03'), 1, 'finalize_user finishes the ended challenge');
select is(app.finalize_member(:'fc', :'fz', '2026-09-09 03:00+03'), true, 'third member finalized');
select results_eq(
  format($$select user_id, final_days_done::int, final_rank::int from public.challenge_members
           where challenge_id = %L and status = 'active' order by final_rank$$, :'fz'),
  format($$values (%L::uuid, 7, 1), (%L::uuid, 6, 2), (%L::uuid, 6, 3)$$, :'fa', :'fb', :'fc'),
  'ranks by days done; a tie is broken by the earlier joined_at');
select is(app.finalize_member(:'fd', :'fz', '2026-09-09 03:00+03'), false, 'a member who left is not finalized');
select results_eq(
  format($$select recipient_id, actor_id, payload->>'title' from public.notifications
           where kind = 'friend_finished_challenge' and challenge_id = %L$$, :'fz'),
  format($$values (%L::uuid, %L::uuid, 'sk finish')$$, :'fx', :'fa'),
  'only the full finisher notifies friends (fa -> fx; fb with 6/7 does not notify fy)');

select tests.authenticate_as('sk_fa');
select results_eq(
  $$select title, duration_days, stage, final_rescues, final_rank from public.my_garden()$$,
  $$values ('sk finish'::text, 7, 'genc'::public.diken_stage, 1, 1)$$,
  'my_garden lists the fully completed 7-day challenge as a genc cactus');
select tests.authenticate_as('sk_fb');
select is_empty($$select * from public.my_garden()$$, 'my_garden excludes a challenge finished with a missed day');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- Leaving a finished solo challenge (last active member -> challenge deleted) must not erase results
select pg_temp.mk_user('sk_gl') as gl \gset
select (app.do_create_challenge(:'gl', null, 'sk solo', 'check', 7, null, null, null, null, null, 0, null, null,
        '{}', '2026-08-01 10:00+03')).id as gs \gset
select pg_temp.ci(:'gl', :'gs', '2026-08-01', '2026-08-07') as _n \gset
select app.finalize_member(:'gl', :'gs', '2026-08-09 03:00+03') as _r \gset
select is(app.user_streak(:'gl', '2026-08-20 10:00+03'), 7, 'solo finisher: 7-day overall streak, frozen after the end');
select pg_temp.try_sql(format($$select app.do_leave_challenge(%L, %L, '2026-08-20 10:00+03')$$, :'gl', :'gs')) as _r \gset
select is(app.user_streak(:'gl', '2026-08-20 10:00+03'), 7,
          'leaving a finished solo challenge does not erase the overall streak history');
select tests.authenticate_as('sk_gl');
select isnt_empty($$select * from public.my_garden()$$, 'leaving a finished solo challenge does not remove its garden cactus');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- The last day is missed and rescued inside its 24h window
select pg_temp.mk_ch('sk last day', '2026-09-01', 7) as fl \gset
select pg_temp.mk_user('sk_ga') as ga \gset
select pg_temp.add_member(:'fl', :'ga', '2026-09-01') as _n \gset
select pg_temp.ci(:'ga', :'fl', '2026-09-01', '2026-09-06') as _n \gset
-- my_today right after the close
select app.finalize_member(:'ga', :'fl', '2026-09-08 03:00+03') as _r \gset
select lives_ok(
  format($$select app.apply_rescue(%L, %L, '2026-09-07', 'free', null, '2026-09-08 10:00+03')$$, :'ga', :'fl'),
  'the missed last day can be rescued inside its window');
select app.finalize_member(:'ga', :'fl', '2026-09-09 03:00+03') as _r \gset
select results_eq(
  format($$select final_days_done::int, final_rescues::int from public.challenge_members
           where challenge_id = %L and user_id = %L$$, :'fl', :'ga'),
  $$values (7, 1)$$,
  'a last day rescued inside the window is part of the final snapshot (7/7, 1 rescue -> garden)');

-- Members in different timezones finish at different instants
select pg_temp.mk_ch('sk cross tz', '2026-09-01', 7) as fx2 \gset
select pg_temp.mk_user('sk_ha') as ha \gset
select pg_temp.mk_user('sk_hb', 'America/Los_Angeles') as hb \gset
select pg_temp.add_member(:'fx2', :'ha', '2026-08-31', '2026-08-31 10:00+03') as _n \gset
select pg_temp.add_member(:'fx2', :'hb', '2026-08-31', '2026-08-31 12:00+03') as _n \gset
select pg_temp.ci(:'ha', :'fx2', '2026-09-01', '2026-09-07', array['2026-09-03'::date]) as _n \gset
select pg_temp.ci(:'hb', :'fx2', '2026-09-01', '2026-09-06') as _n \gset
-- Istanbul day closed
select app.finalize_member(:'ha', :'fx2', '2026-09-08 00:00+00') as _r \gset
-- 20:00 PDT on 09-07
select pg_temp.ci(:'hb', :'fx2', '2026-09-07', '2026-09-07') as _n \gset
select app.finalize_member(:'ha', :'fx2', '2026-09-10 12:00+00') as _r \gset
select app.finalize_member(:'hb', :'fx2', '2026-09-10 12:00+00') as _r \gset
select results_eq(
  format($$select user_id, final_days_done::int, final_rank::int from public.challenge_members
           where challenge_id = %L order by user_id = %L desc$$, :'fx2', :'hb'),
  format($$values (%L::uuid, 7, 1), (%L::uuid, 6, 2)$$, :'hb', :'ha'),
  'final ranks stay consistent when members in other timezones are still checking in the last day');

-- Rescues outside the member range (left and rejoined later)
select pg_temp.mk_ch('sk rejoin finish', '2026-09-01', 10) as fr \gset
select pg_temp.mk_user('sk_ia') as ia \gset
-- current stint
select pg_temp.add_member(:'fr', :'ia', '2026-09-06') as _n \gset
-- from the earlier stint
select pg_temp.rescue(:'ia', :'fr', '2026-09-03') as _n \gset
select pg_temp.ci(:'ia', :'fr', '2026-09-06', '2026-09-10') as _n \gset
select app.finalize_member(:'ia', :'fr', '2026-09-12 12:00+03') as _r \gset
select results_eq(
  format($$select final_days_done::int, final_rescues::int from public.challenge_members
           where challenge_id = %L and user_id = %L$$, :'fr', :'ia'),
  $$values (5, 0)$$, 'final_rescues counts only rescues inside the member range, like final_days_done');

-- ================================================================================================
-- H. now()-based RPCs: my_streak, my_today, my_pending_rescues, rescue_streak, grant_ad_rescue,
--    my_garden via my_today's lazy finalization, challenge_board
-- ================================================================================================

select pg_temp.mk_user('sk_nw') as nw \gset
select (app.open_dates(:'nw', now()))[1] as t \gset
-- last closed day
select (select min(d) from unnest(app.open_dates(:'nw', now())) d) - 1 as lc \gset
select pg_temp.mk_ch('sk now check', (:'t'::date - 5), 30) as n1 \gset
select pg_temp.mk_ch('sk now plank', (:'t'::date - 2), 10, 'number', 60, 5, 600) as n2 \gset
select pg_temp.add_member(:'n1', :'nw', :'t'::date - 5, now() - interval '6 days') as _n \gset
select pg_temp.add_member(:'n2', :'nw', :'t'::date - 2, now() - interval '3 days') as _n \gset
select pg_temp.ci(:'nw', :'n1', :'t'::date - 5, :'t'::date - 1) as _n \gset
select pg_temp.ci(:'nw', :'n2', :'t'::date - 2, :'t'::date - 1) as _n \gset

select tests.authenticate_as('sk_nw');
select results_eq(
  $$select current_streak, longest_streak, stage, wilted, done_today, total_today, free_rescue_available from public.my_streak()$$,
  $$values (5, 5, 'filiz'::public.diken_stage, false, 0, 2, true)$$,
  'my_streak: 5-day streak, today 0/2 done, not wilted, free right available');
select results_eq(
  $$select title, day_index, done, target from public.my_today() order by title$$,
  $$values ('sk now check'::text, 6, false, null::numeric), ('sk now plank'::text, 3, false, 70::numeric)$$,
  'my_today: day index per challenge and the day-3 number target');
select lives_ok(format($$select public.checkin(%L)$$, :'n1'), 'check-in of the check task');
select results_eq($$select current_streak, done_today, total_today from public.my_streak()$$,
                  $$values (5, 1, 2)$$, 'today half done: done_today 1/2, streak unchanged');
select lives_ok(format($$select public.checkin(%L, 50)$$, :'n2'), 'number check-in below target');
select results_eq($$select current_streak, done_today, total_today, stage from public.my_streak()$$,
                  $$values (6, 2, 2, 'filiz'::public.diken_stage)$$, 'all done today: streak 6, 2/2');
select is(public.undo_checkin(:'n2'), true, 'undo of today''s check-in succeeds');
select results_eq($$select current_streak, done_today from public.my_streak()$$,
                  $$values (5, 1)$$, 'undo brings the streak and done_today back');
select is_empty($$select * from public.my_pending_rescues()$$, 'my_pending_rescues is empty when nothing was missed');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

select pg_temp.mk_user('sk_nw2') as nw2 \gset
select pg_temp.mk_ch('sk now wilted', (:'t'::date - 6), 30) as n3 \gset
select pg_temp.add_member(:'n3', :'nw2', :'t'::date - 6) as _n \gset
-- last closed day missed
select pg_temp.ci(:'nw2', :'n3', :'t'::date - 6, :'lc'::date - 1) as _n \gset

select tests.authenticate_as('sk_nw2');
select results_eq($$select current_streak, wilted from public.my_streak()$$,
                  $$values (0, true)$$, 'my_streak: wilted with streak 0 while yesterday''s rescue is pending');
select results_eq(
  $$select challenge_id, missed_date, streak_before, expires_at, free_rescue_available from public.my_pending_rescues()$$,
  format($$values (%L::uuid, %L::date, %s, %L::timestamptz, true)$$,
         :'n3', :'lc', (:'lc'::date - (:'t'::date - 6)),
         app.day_closes_at(:'nw2', :'lc') + interval '24 hours'),
  'my_pending_rescues: the missed day, the streak at risk and the expiry');
select results_eq(format($$select rescued_date, method from public.rescue_streak(%L, %L)$$, :'n3', :'lc'),
                  format($$values (%L::date, 'free'::public.rescue_method)$$, :'lc'),
                  'rescue_streak uses the free right');
select results_eq($$select current_streak, wilted, free_rescue_available from public.my_streak()$$,
                  format($$values (%s, false, false)$$, (:'lc'::date - (:'t'::date - 6) + 1)),
                  'after rescue_streak: streak restored, no longer wilted, free right used');
select throws_ok(format($$select public.rescue_streak(%L, %L)$$, :'n3', :'lc'),
                 'P0001', 'Bu gün için kurtarma yapılamaz', 'rescue_streak cannot rescue the same day twice');
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'ssv-client-0001')$$, :'nw2', :'n3', :'lc'),
                 '42501', null, 'a signed-in user cannot call grant_ad_rescue');
select throws_ok(format($$insert into public.streak_rescues (user_id, challenge_id, rescued_date, method, ad_reward_id)
                          values (%L, %L, %L, 'ad', 'forged-0001')$$, :'nw2', :'n3', :'t'),
                 '42501', null, 'a signed-in user cannot insert rescues directly');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- Ad rescue via the service role (AdMob SSV callback)
select pg_temp.mk_user('sk_adr') as adr \gset
select pg_temp.mk_ch('sk ad one', (:'t'::date - 6), 30) as a1 \gset
select pg_temp.mk_ch('sk ad two', (:'t'::date - 6), 30) as a2 \gset
select pg_temp.add_member(:'a1', :'adr', :'t'::date - 6) as _n \gset
select pg_temp.add_member(:'a2', :'adr', :'t'::date - 6) as _n \gset
select pg_temp.ci(:'adr', :'a1', :'t'::date - 6, :'lc'::date - 1) as _n \gset
select pg_temp.ci(:'adr', :'a2', :'t'::date - 6, :'lc'::date - 1) as _n \gset

select tests.authenticate_as_service_role();
select results_eq(format($$select method, ad_reward_id, quota_month from public.grant_ad_rescue(%L, %L, %L, 'ssv-tx-000001')$$, :'adr', :'a1', :'lc'),
                  $$values ('ad'::public.rescue_method, 'ssv-tx-000001'::text, null::date)$$,
                  'grant_ad_rescue records an ad rescue without touching the free quota');
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'ssv-tx-000001')$$, :'adr', :'a2', :'lc'),
                 '23505', null, 'one ad reward cannot rescue a second challenge');
select lives_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'ssv-tx-000001')$$, :'adr', :'a1', :'lc'),
                'a retried SSV callback for the same reward is idempotent (no error)');
select is((select count(*)::int from public.streak_rescues where ad_reward_id = 'ssv-tx-000001'), 1,
          'a replayed reward never creates a second rescue');
select throws_ok(format($$select public.grant_ad_rescue(%L, %L, %L, 'short')$$, :'adr', :'a2', :'lc'),
                 '22023', 'Geçersiz ödül kimliği', 'grant_ad_rescue rejects a malformed reward id');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- require_user paths
select tests.create_supabase_user('sk_noprofile') as noprof \gset
select tests.authenticate_as('sk_noprofile');
select throws_ok($$select * from public.my_streak()$$, 'P0001', 'Önce profilini tamamla',
                 'my_streak requires a completed profile');
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true) as _r \gset
select throws_ok($$select * from public.my_streak()$$, '42501', 'Oturum açman gerekiyor',
                 'my_streak without a user id in the JWT is rejected');
select tests.clear_authentication();
select throws_ok($$select * from public.my_streak()$$, '42501', null, 'anon cannot call my_streak');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset

-- my_today finalizes ended challenges lazily; my_garden shows the cactus stage by duration
select pg_temp.mk_user('sk_gd') as gd \gset
select pg_temp.mk_ch('sk garden 7', (:'t'::date - 20), 7) as g7 \gset
select pg_temp.mk_ch('sk garden 10', (:'t'::date - 30), 10) as g10 \gset
select pg_temp.mk_ch('sk garden 30', (:'t'::date - 45), 30) as g30 \gset
select pg_temp.mk_ch('sk garden miss', (:'t'::date - 12), 7) as gx \gset
select sum(pg_temp.add_member(c, :'gd', :'t'::date - 50)) as _n
from unnest(array[:'g7', :'g10', :'g30', :'gx']::uuid[]) c \gset
select sum(pg_temp.ci(:'gd', c.id, c.start_date, c.end_date, array[:'t'::date - 10])) as _n
from public.challenges c where c.id in (:'g7', :'g10', :'g30', :'gx') \gset
select tests.authenticate_as('sk_gd');
select is((select count(*)::int from public.my_today()), 0, 'my_today: no task today for a user whose challenges ended');
select results_eq($$select duration_days, stage, final_rank from public.my_garden() order by duration_days$$,
                  $$values (7, 'genc'::public.diken_stage, 1), (10, 'tam'::public.diken_stage, 1), (30, 'cicek'::public.diken_stage, 1)$$,
                  'my_garden after lazy finalization: 7 -> genc, 10 -> tam, 30 -> cicek; the missed one is absent');
reset role;
select set_config('request.jwt.claims', '', true) as _r \gset
select is((select count(*)::int from public.challenge_members where user_id = :'gd' and finished_at is not null), 4,
          'my_today finalized all four ended memberships');

-- ================================================================================================
-- I. Group board and friends strip (each member in their own timezone)
-- ================================================================================================

select pg_temp.mk_ch('sk board', '2026-09-01', 30) as bd \gset
select pg_temp.mk_user('sk_bi') as bi \gset
select pg_temp.mk_user('sk_bl', 'America/Los_Angeles') as bl \gset
select pg_temp.mk_user('sk_bm') as bm \gset
select pg_temp.mk_user('sk_bk') as bk \gset
select pg_temp.mk_user('sk_bo') as bo \gset
select pg_temp.add_member(:'bd', :'bi', '2026-09-01', '2026-08-31 10:00+03') as _n \gset
select pg_temp.add_member(:'bd', :'bl', '2026-09-01', '2026-08-31 11:00+03') as _n \gset
select pg_temp.add_member(:'bd', :'bm', '2026-09-01', '2026-08-31 12:00+03') as _n \gset
select pg_temp.add_member(:'bd', :'bk', '2026-09-01', '2026-08-31 13:00+03') as _n \gset
select pg_temp.ci(:'bi', :'bd', '2026-09-01', '2026-09-10') as _n \gset
select pg_temp.ci(:'bl', :'bd', '2026-09-01', '2026-09-10') as _n \gset
select pg_temp.ci(:'bm', :'bd', '2026-09-04', '2026-09-10', array['2026-09-07'::date]) as _n \gset
select pg_temp.ci(:'bk', :'bd', '2026-09-01', '2026-09-10') as _n \gset
insert into public.blocks (blocker_id, blocked_id) values (:'bi', :'bk');
insert into public.friendships (requester_id, addressee_id, status, accepted_at)
values (:'bi', :'bl', 'accepted', now());

-- 2026-09-10 22:00 UTC = 09-11 01:00 in Istanbul, 09-10 15:00 in Los Angeles
select results_eq(
  format($$select user_id, streak, days_done, done_today, rank from app.challenge_board(%L, %L, '2026-09-10 22:00+00') order by rank$$, :'bi', :'bd'),
  format($$values (%L::uuid, 10, 10, false, 1), (%L::uuid, 10, 10, true, 2), (%L::uuid, 3, 6, false, 3)$$, :'bi', :'bl', :'bm'),
  'challenge_board: streak desc, days_done, joined_at; done_today per member''s own local day; blocked member hidden');
select is_empty(format($$select * from app.challenge_board(%L, %L, '2026-09-10 22:00+00')$$, :'bo', :'bd'),
                'challenge_board is empty for a non-member viewer');
select results_eq(
  format($$select user_id, streak, done_today, active_challenges, shared_challenge_id from app.friends_today(%L, '2026-09-10 22:00+00')$$, :'bi'),
  format($$values (%L::uuid, 10, true, 1, %L::uuid)$$, :'bl', :'bd'),
  'friends_today: the friend''s overall streak and done state in the friend''s own timezone');

-- ================================================================================================
-- J. Timezone change, leave/rejoin, long histories, scheduled finalization
-- ================================================================================================

-- Changing the timezone must not reopen a day that already closed
select pg_temp.mk_ch('sk tz change', '2026-09-01', 10) as zc \gset
select pg_temp.mk_user('sk_tzc') as tzc \gset
select pg_temp.add_member(:'zc', :'tzc', '2026-09-01') as _n \gset
select pg_temp.ci(:'tzc', :'zc', '2026-09-01', '2026-09-04') as _n \gset
select throws_ok(
  format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-05', '2026-09-06 00:00+00')$$, :'tzc', :'zc'),
  'P0001', 'Bu gün artık işaretlenemez', '09-05 is closed at 03:00 Istanbul');
select throws_ok(format($$update public.user_settings set timezone = 'Mars/Olympus' where user_id = %L$$, :'tzc'),
                 '22023', 'Geçersiz saat dilimi: Mars/Olympus', 'an unknown timezone is rejected');
select pg_temp.try_sql(format($$update public.user_settings set timezone = 'Pacific/Honolulu' where user_id = %L$$, :'tzc')) as _r \gset
select throws_ok(
  format($$select app.do_checkin(%L, %L, null, null, null, '2026-09-05', '2026-09-06 00:00+00')$$, :'tzc', :'zc'),
  'P0001', null, 'switching to a timezone 13h behind does not reopen the closed 09-05 (no free backfill)');

-- Leaving and rejoining must not rewrite past days of the overall streak
select pg_temp.mk_ch('sk rejoin A', '2026-09-01', 30) as rja \gset
select pg_temp.mk_ch('sk rejoin B', '2026-09-01', 30) as rjb \gset
select pg_temp.mk_user('sk_rj') as rj \gset
select pg_temp.mk_user('sk_rjm') as rjm \gset
select pg_temp.add_member(:'rja', :'rj', '2026-09-01', '2026-08-31 10:00+03') as _n \gset
select pg_temp.add_member(:'rjb', :'rj', '2026-09-01', '2026-08-31 10:00+03') as _n \gset
select pg_temp.add_member(:'rja', :'rjm', '2026-09-01', '2026-08-31 11:00+03') as _n \gset
insert into public.challenge_invites (code, challenge_id, inviter_id) values ('SKrejoin01', :'rja', :'rjm');
select pg_temp.ci(:'rj', :'rja', '2026-09-01', '2026-09-10', array['2026-09-05'::date]) as _n \gset
select pg_temp.ci(:'rj', :'rjb', '2026-09-01', '2026-09-10') as _n \gset
select is(app.user_streak(:'rj', '2026-09-10 20:00+03'), 5, 'overall streak broken by the 09-05 miss (09-06..09-10)');
select app.do_leave_challenge(:'rj', :'rja', '2026-09-10 20:00+03') as _r \gset
select is(app.user_streak(:'rj', '2026-09-10 20:00+03'), 5, 'leaving keeps the past days of that challenge required');
select pg_temp.try_sql(format($$select app.do_join_by_invite(%L, 'SKrejoin01', '2026-09-10 20:05+03')$$, :'rj')) as _r \gset
select is(app.user_streak(:'rj', '2026-09-10 20:05+03'), 5,
          'rejoining via an invite link does not erase the earlier miss from the overall streak');
select is(app.user_longest_streak(:'rj', '2026-09-10 20:05+03'), 5,
          'rejoining does not inflate the longest streak');

-- 1140-day history with two concurrent challenges per day (performance, set-based behaviour)
select pg_temp.mk_user('sk_perf') as pf \gset
create temp table sk_perf_ch on commit drop as
select pg_temp.mk_ch('sk perf ' || l || '-' || i, date '2026-09-30' - 1139 + 60 * i, 60) as id, l, i
from generate_series(0, 18) i, generate_series(1, 2) l;
select sum(pg_temp.add_member(p.id, :'pf', c.start_date)) as _n
from sk_perf_ch p join public.challenges c on c.id = p.id \gset
select sum(pg_temp.ci(:'pf', c.id, c.start_date, c.end_date)) as _n
from sk_perf_ch p join public.challenges c on c.id = p.id \gset
select is(app.user_streak(:'pf', '2026-09-30 20:00+03'), 1140, 'overall streak over 1140 consecutive days');
select is(app.user_longest_streak(:'pf', '2026-09-30 20:00+03'), 1140, 'longest streak over 1140 days');
select is((select count(*)::int from app.user_day_status(:'pf', '2026-09-30 20:00+03') where required = 2 and covered = 2), 1140,
          'user_day_status: one row per day, two required and covered each day');
select is(app.challenge_streak(:'pf', (select id from sk_perf_ch where l = 1 and i = 18), '2026-09-30 20:00+03'), 60,
          'challenge streak of the last 60-day challenge');
select performs_ok(format($$select app.user_streak(%L, '2026-09-30 20:00+03')$$, :'pf'), 3000,
                   'user_streak over 1140 days x 2 challenges stays well under 3 s');
select performs_ok(format($$select * from app.streak_summary(%L, '2026-09-30 20:00+03')$$, :'pf'), 6000,
                   'streak_summary over 1140 days x 2 challenges stays under 6 s');

-- Scheduled job: every active membership whose end day has closed (in the member's own timezone)
-- is finalized. Kiritimati is UTC+14: its end day closes while UTC is still on that date.
select pg_temp.mk_ch('sk kiritimati', app.local_date(:'kir', now()) - 7, 7) as kc \gset
select pg_temp.add_member(:'kc', :'kir', app.local_date(:'kir', now()) - 7) as _n \gset
select pg_temp.ci(:'kir', :'kc', app.local_date(:'kir', now()) - 7, app.local_date(:'kir', now()) - 1) as _n \gset
select public.finish_due_challenges() as _r \gset
select is(app.finalize_member(:'kir', :'kc', now()), false,
          'finish_due_challenges leaves no finalizable UTC+14 membership behind (no server-date prefilter)');

select * from finish();
rollback;
