-- Gazla veri modeli · 6/10 — seri motoru (CLAUDE.md: "Seri hesabı sunucuda, SQL fonksiyonu").
--
-- Tanımlar
-- * Kapsanan gün: o challenge için işaretleme ya da kurtarma olan gün.
-- * Açık gün: hâlâ işaretlenebilen gün (bugün; gece yarısından sonraki 2 saatte dün de).
--   Açık ve kapsanmamış gün seriyi bozmaz, sayılmaz da.
-- * Challenge serisi: üyenin o challenge'da, en son kırılmadan (kapanmış ve kapsanmamış gün)
--   sonraki kapsanan günleri. Katıldığı günden önce ve ayrıldıktan sonra sayılmaz.
-- * Genel seri: o gün üyesi olduğu tüm challenge'lar kapsanmışsa gün tamam. Hiç challenge'ı
--   olmayan gün seriyi dondurur (bozmaz, saymaz).
-- * Kurtarma: kapanan günün ardından 24 saat içinde, o güne kadar seri > 0 ise.
-- * Diken aşaması: 0–6 filiz, 7–9 genç, 10–29 tam, 30+ çiçek (Evolution.dc.html).

-- Üyenin bir challenge'da sorumlu olduğu gün aralığı
create function app.member_range(p_user uuid, p_challenge uuid, out range_start date, out range_end date)
language sql stable security definer set search_path = '' as $$
  select greatest(c.start_date, m.joined_on),
         least(c.end_date, coalesce(m.left_on - 1, c.end_date))
  from public.challenge_members m
  join public.challenges c on c.id = m.challenge_id
  where m.challenge_id = p_challenge and m.user_id = p_user
    and m.status in ('active', 'left') and m.joined_on is not null
$$;

create function app.is_covered(p_user uuid, p_challenge uuid, p_day date) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
           select 1 from public.checkins k
           where k.user_id = p_user and k.challenge_id = p_challenge and k.local_date = p_day
         )
      or exists (
           select 1 from public.streak_rescues r
           where r.user_id = p_user and r.challenge_id = p_challenge and r.rescued_date = p_day
         )
$$;

-- Bir üyenin bir challenge'da kapsanan günleri
create function app.covered_dates(p_user uuid, p_challenge uuid) returns setof date
language sql stable security definer set search_path = '' as $$
  select k.local_date from public.checkins k
  where k.user_id = p_user and k.challenge_id = p_challenge
  union
  select r.rescued_date from public.streak_rescues r
  where r.user_id = p_user and r.challenge_id = p_challenge
$$;

-- p_last'ta biten ardışık kapsanan gün sayısı (aralığın başından öteye gitmez)
create function app.covered_run_ending(p_user uuid, p_challenge uuid, p_last date) returns integer
language sql stable security definer set search_path = '' as $$
  with r as (select * from app.member_range(p_user, p_challenge)),
  days as (
    select g::date as d, c.d is not null as covered
    from r
    cross join generate_series(r.range_start, least(p_last, r.range_end), interval '1 day') as g
    left join app.covered_dates(p_user, p_challenge) as c(d) on c.d = g::date
  )
  select count(*)::int
  from days
  where covered
    and d > coalesce((select max(d) from days where not covered), (select range_start - 1 from r))
$$;

-- Challenge serisi (Detail sıralaması, StreakLost "12 günlük serin")
create function app.challenge_streak(p_user uuid, p_challenge uuid, p_at timestamptz) returns integer
language sql stable security definer set search_path = '' as $$
  with r as (select * from app.member_range(p_user, p_challenge)),
  t as (
    select least(app.local_date(p_user, p_at), r.range_end) as anchor,
           app.open_dates(p_user, p_at) as open
    from r
  ),
  days as (
    select g::date as d, c.d is not null as covered, g::date = any (t.open) as is_open
    from r
    cross join t
    cross join generate_series(r.range_start, t.anchor, interval '1 day') as g
    left join app.covered_dates(p_user, p_challenge) as c(d) on c.d = g::date
  )
  select coalesce((
    select count(*)::int
    from days
    where covered
      and d > coalesce((select max(d) from days where not covered and not is_open),
                       (select range_start - 1 from r))
  ), 0)
$$;

-- Kullanıcının gün gün durumu: kaç challenge'tan sorumlu, kaçı kapsandı, gün açık mı
create function app.user_day_status(p_user uuid, p_at timestamptz)
returns table (day date, required integer, covered integer, is_open boolean)
language sql stable security definer set search_path = '' as $$
  with ranges as (
    select m.challenge_id,
           greatest(c.start_date, m.joined_on) as s,
           least(c.end_date, coalesce(m.left_on - 1, c.end_date)) as e
    from public.challenge_members m
    join public.challenges c on c.id = m.challenge_id
    where m.user_id = p_user and m.status in ('active', 'left') and m.joined_on is not null
  ),
  t as (select app.local_date(p_user, p_at) as today, app.open_dates(p_user, p_at) as open),
  days as (
    select g::date as day, g::date = any (t.open) as is_open
    from t, generate_series((select min(s) from ranges), t.today, interval '1 day') as g
  ),
  req as (
    select d.day, r.challenge_id
    from days d
    join ranges r on d.day between r.s and r.e
  ),
  cov as (
    select q.day, q.challenge_id,
           app.is_covered(p_user, q.challenge_id, q.day) as covered
    from req q
  )
  select d.day,
         count(c.challenge_id)::int as required,
         (count(c.challenge_id) filter (where c.covered))::int as covered,
         d.is_open
  from days d
  left join cov c on c.day = d.day
  group by d.day, d.is_open
  order by d.day
$$;

-- Genel seri (Bugün "12 GÜNLÜK SERİ", Bahçe "Aktif seri")
create function app.user_streak(p_user uuid, p_at timestamptz) returns integer
language sql stable security definer set search_path = '' as $$
  with s as (select * from app.user_day_status(p_user, p_at)),
  b as (select max(day) as last_break from s where required > 0 and covered < required and not is_open)
  select count(*)::int
  from s, b
  where s.required > 0 and s.covered = s.required
    and (b.last_break is null or s.day > b.last_break)
$$;

-- En uzun genel seri (Bahçe "En uzun seri")
create function app.user_longest_streak(p_user uuid, p_at timestamptz) returns integer
language sql stable security definer set search_path = '' as $$
  with s as (select * from app.user_day_status(p_user, p_at)),
  g as (
    select s.*,
           sum(case when required > 0 and covered < required and not is_open then 1 else 0 end)
             over (order by day) as grp
    from s
  )
  select coalesce(max(n), 0)::int
  from (
    select (count(*) filter (where required > 0 and covered = required)) as n
    from g group by grp
  ) as runs
$$;

create function public.diken_stage_for(p_streak integer) returns public.diken_stage
language sql immutable parallel safe set search_path = '' as $$
  select case
    when p_streak >= 30 then 'cicek'::public.diken_stage
    when p_streak >= 10 then 'tam'::public.diken_stage
    when p_streak >= 7 then 'genc'::public.diken_stage
    else 'filiz'::public.diken_stage
  end
$$;

-- Kurtarma ----------------------------------------------------------------------------------

-- Kurtarılabilecek gün: en son kapanan gün (kapanıştan itibaren 24 saat içinde), kapsanmamış ve
-- öncesinde seri > 0. Her challenge için en fazla bir gün.
create function app.pending_rescues(p_user uuid, p_at timestamptz)
returns table (challenge_id uuid, missed_date date, streak_before integer, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with t as (
    select ((p_at at time zone app.user_timezone(p_user)) - app.grace_period())::date - 1 as d
  ),
  candidates as (
    select m.challenge_id, t.d
    from t
    cross join public.challenge_members m
    join public.challenges c on c.id = m.challenge_id
    where m.user_id = p_user and m.status = 'active'
      and t.d between greatest(c.start_date, m.joined_on) and c.end_date
      and not app.is_covered(p_user, m.challenge_id, t.d)
  )
  select x.challenge_id, x.d, x.run, app.day_closes_at(p_user, x.d) + app.rescue_window()
  from (
    select c.challenge_id, c.d, app.covered_run_ending(p_user, c.challenge_id, c.d - 1) as run
    from candidates c
  ) as x
  where x.run > 0
$$;

-- Bu ay ücretsiz kurtarma hakkı kaldı mı (kullanıcının yerel ayı)
create function app.free_rescue_month(p_user uuid, p_at timestamptz) returns date
language sql stable set search_path = '' as $$
  select date_trunc('month', app.local_date(p_user, p_at))::date
$$;

create function app.free_rescue_available(p_user uuid, p_at timestamptz) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from public.streak_rescues r
    where r.user_id = p_user and r.method = 'free'
      and r.quota_month = app.free_rescue_month(p_user, p_at)
  )
$$;

-- Kurtarmayı kaydeder; kuralları doğrular. Yetki kontrolü çağıran RPC'dedir.
create function app.apply_rescue(
  p_user uuid, p_challenge uuid, p_missed_date date, p_method public.rescue_method,
  p_ad_reward_id text, p_at timestamptz
) returns public.streak_rescues
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.streak_rescues;
begin
  if not exists (
    select 1 from app.pending_rescues(p_user, p_at) pr
    where pr.challenge_id = p_challenge and pr.missed_date = p_missed_date
  ) then
    raise exception 'Bu gün için kurtarma yapılamaz' using errcode = 'P0001';
  end if;

  if p_method = 'free' and not app.free_rescue_available(p_user, p_at) then
    raise exception 'Bu ayın ücretsiz kurtarma hakkı kullanıldı' using errcode = 'P0001';
  end if;

  insert into public.streak_rescues (user_id, challenge_id, rescued_date, method, quota_month, ad_reward_id, created_at)
  values (
    p_user, p_challenge, p_missed_date, p_method,
    case when p_method = 'free' then app.free_rescue_month(p_user, p_at) end,
    case when p_method = 'ad' then p_ad_reward_id end,
    p_at
  )
  returning * into v_row;
  return v_row;
end
$$;

-- Challenge bitişi --------------------------------------------------------------------------

-- Sayı görevinde günün hedefi: taban + (gün - 1) × artış
create function app.number_target(p_challenge uuid, p_day_index integer) returns numeric
language sql stable security definer set search_path = '' as $$
  select case when c.task_type = 'number'
              then c.number_base_target + greatest(p_day_index - 1, 0) * c.number_daily_increment end
  from public.challenges c where c.id = p_challenge
$$;

-- Üyenin bir challenge'daki kapsanan gün sayısı (kurtarılanlar dahil)
create function app.days_done(p_user uuid, p_challenge uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::int
  from app.member_range(p_user, p_challenge) r
  cross join app.covered_dates(p_user, p_challenge) as c(d)
  where c.d between r.range_start and r.range_end
$$;

-- Son gün kapandıysa üyenin sonucunu kaydeder (Finished: "30/30 gün · 1 kurtarma · 1. sıra").
-- Tüm günleri kapsayan üye "bitirmiş" sayılır: bahçeye kaktüs eklenir, arkadaşlara bildirim gider.
create function app.finalize_member(p_user uuid, p_challenge uuid, p_at timestamptz) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_c public.challenges;
  v_m public.challenge_members;
  v_days integer;
  v_rescues integer;
  v_rank integer;
begin
  select * into v_m from public.challenge_members m
  where m.challenge_id = p_challenge and m.user_id = p_user
  for update;
  if not found or v_m.status <> 'active' or v_m.finished_at is not null then
    return false;
  end if;

  select * into v_c from public.challenges c where c.id = p_challenge;
  if app.day_closes_at(p_user, v_c.end_date) > p_at then
    return false;
  end if;

  v_days := app.days_done(p_user, p_challenge);
  select count(*)::int into v_rescues from public.streak_rescues r
  where r.user_id = p_user and r.challenge_id = p_challenge;

  -- Sıra: kapsanan gün sayısı, sonra katılma zamanı (erken katılan önde)
  select 1 + count(*)::int into v_rank
  from public.challenge_members o
  where o.challenge_id = p_challenge and o.status = 'active' and o.user_id <> p_user
    and (app.days_done(o.user_id, p_challenge) > v_days
         or (app.days_done(o.user_id, p_challenge) = v_days and o.joined_at < v_m.joined_at));

  update public.challenge_members m
  set finished_at = p_at, final_days_done = v_days, final_rescues = v_rescues, final_rank = v_rank
  where m.challenge_id = p_challenge and m.user_id = p_user;

  if v_days >= v_c.duration_days then
    insert into public.notifications (recipient_id, kind, actor_id, challenge_id, payload, local_date)
    select f.friend_id, 'friend_finished_challenge', p_user, p_challenge,
           jsonb_build_object('title', v_c.title, 'duration_days', v_c.duration_days),
           app.local_date(f.friend_id, p_at)
    from (
      select case when fr.requester_id = p_user then fr.addressee_id else fr.requester_id end as friend_id
      from public.friendships fr
      where fr.status = 'accepted' and p_user in (fr.requester_id, fr.addressee_id)
    ) as f
    where not app.is_blocked(p_user, f.friend_id);
  end if;
  return true;
end
$$;

-- Kullanıcının süresi dolan tüm challenge'larını kapatır (Bugün açılırken tembel çağrılır)
create function app.finalize_user(p_user uuid, p_at timestamptz) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer := 0;
  r record;
begin
  for r in
    select m.challenge_id
    from public.challenge_members m
    join public.challenges c on c.id = m.challenge_id
    where m.user_id = p_user and m.status = 'active' and m.finished_at is null
      and c.end_date < app.local_date(p_user, p_at)
  loop
    if app.finalize_member(p_user, r.challenge_id, p_at) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end
$$;
