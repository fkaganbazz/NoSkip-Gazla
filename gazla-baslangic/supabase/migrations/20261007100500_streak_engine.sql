-- Gazla veri modeli · 6/10 — seri motoru (CLAUDE.md: "Seri hesabı sunucuda, SQL fonksiyonu").
--
-- Tanımlar
-- * Kapsanan gün: o challenge için işaretleme ya da kurtarma olan gün.
-- * Açık gün: hâlâ işaretlenebilen gün (bugün; gece yarısından sonraki 2 saatte dün de).
--   Açık ve kapsanmamış gün seriyi bozmaz, sayılmaz da; ama sonraki bir gün kapsanmışsa bozar
--   (boş bir dünün üstünden atlanmaz).
-- * Challenge serisi: üyenin o challenge'da, en son kırılmadan (kapanmış ve kapsanmamış gün)
--   sonraki kapsanan günleri. Katıldığı günden önce ve ayrıldıktan sonra sayılmaz.
-- * Genel seri: o gün üyesi olduğu tüm challenge'lar kapsanmışsa gün tamam. Hiç challenge'ı
--   olmayan gün seriyi dondurur (bozmaz, saymaz).
-- * Kurtarma: günün kapanışından itibaren 24 saat içinde, o güne kadar challenge serisi > 0 ise
--   (üyenin challenge'daki ilk günüyse genel seri > 0 ise).
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
  days as materialized (
    select g::date as d, c.d is not null as covered, g::date = any (t.open) as is_open
    from r
    cross join t
    cross join generate_series(r.range_start, t.anchor, interval '1 day') as g
    left join app.covered_dates(p_user, p_challenge) as c(d) on c.d = g::date
  ),
  lc as (select max(d) as last_covered from days where covered)
  select coalesce((
    select count(*)::int
    from days, lc
    where days.covered
      and days.d > coalesce((select max(u.d) from days u
                             where not u.covered and (not u.is_open or u.d < lc.last_covered)),
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
  t as materialized (select app.local_date(p_user, p_at) as today, app.open_dates(p_user, p_at) as open),
  days as (
    select g::date as day, g::date = any (t.open) as is_open
    from t, generate_series((select min(s) from ranges), t.today, interval '1 day') as g
  ),
  covered_days as (
    select k.challenge_id, k.local_date as day from public.checkins k where k.user_id = p_user
    union
    select r.challenge_id, r.rescued_date from public.streak_rescues r where r.user_id = p_user
  ),
  cov as (
    select d.day, r.challenge_id, cd.day is not null as covered
    from days d
    join ranges r on d.day between r.s and r.e
    left join covered_days cd on cd.challenge_id = r.challenge_id and cd.day = d.day
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
  with s as materialized (select * from app.user_day_status(p_user, p_at)),
  lc as (select max(day) as last_complete from s where required > 0 and covered = required),
  b as (
    select max(s.day) as last_break
    from s, lc
    where s.required > 0 and s.covered < s.required
      and (not s.is_open or s.day < lc.last_complete)
  )
  select count(*)::int
  from s, b
  where s.required > 0 and s.covered = s.required
    and (b.last_break is null or s.day > b.last_break)
$$;

-- En uzun genel seri (Bahçe "En uzun seri")
create function app.user_longest_streak(p_user uuid, p_at timestamptz) returns integer
language sql stable security definer set search_path = '' as $$
  with s as materialized (select * from app.user_day_status(p_user, p_at)),
  lc as (select max(day) as last_complete from s where required > 0 and covered = required),
  g as (
    select s.*,
           sum(case when s.required > 0 and s.covered < s.required
                         and (not s.is_open or s.day < lc.last_complete) then 1 else 0 end)
             over (order by s.day) as grp
    from s, lc
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

-- Kurtarılabilecek gün: kapanmış, kapanışından bu yana 24 saat geçmemiş, kapsanmamış ve öncesinde
-- seri > 0. Üyenin challenge'daki ilk günü kaçtıysa challenge serisi yoktur; o gün genel seriyi
-- bozduğu için genel seri > 0 ise kurtarılabilir. Kurtarılmış günün ertesi kurtarılamaz (kurtarma
-- zinciriyle işaretlemeden seri sürmez); böylece her challenge için en fazla bir gün açıktır.
create function app.pending_rescues(p_user uuid, p_at timestamptz)
returns table (challenge_id uuid, missed_date date, streak_before integer, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with t as (
    select x.d, app.day_closes_at(p_user, x.d) + app.rescue_window() as expires_at
    from (select app.local_date(p_user, p_at) as today) as l
    cross join lateral unnest(array[l.today - 1, l.today - 2]) as x(d)
    where app.day_closes_at(p_user, x.d) <= p_at
      and p_at < app.day_closes_at(p_user, x.d) + app.rescue_window()
  ),
  candidates as (
    select m.challenge_id, t.d, t.expires_at, greatest(c.start_date, m.joined_on) as first_day
    from t
    cross join public.challenge_members m
    join public.challenges c on c.id = m.challenge_id
    where m.user_id = p_user and m.status = 'active'
      and t.d between greatest(c.start_date, m.joined_on) and c.end_date
      and not app.is_covered(p_user, m.challenge_id, t.d)
      and not exists (select 1 from public.streak_rescues r
                      where r.user_id = p_user and r.challenge_id = m.challenge_id
                        and r.rescued_date = t.d - 1)
  )
  select x.challenge_id, x.d, x.run, x.expires_at
  from (
    select c.challenge_id, c.d, c.expires_at,
           case when c.d = c.first_day
                then app.user_streak(p_user, app.day_closes_at(p_user, c.d - 1))
                else app.covered_run_ending(p_user, c.challenge_id, c.d - 1) end as run
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

-- Sayı görevinde günün hedefi: taban + (gün - 1) × artış, en çok number_max (least null'ı atlar)
create function app.number_target(p_challenge uuid, p_day_index integer) returns numeric
language sql stable security definer set search_path = '' as $$
  select case when c.task_type = 'number'
              then least(c.number_base_target + greatest(p_day_index - 1, 0) * c.number_daily_increment,
                         c.number_max) end
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

-- Üyenin sonucunu kaydeder (Finished: "30/30 gün · 1 kurtarma · 1. sıra"). Sonuç ve sıra, hiçbir
-- aktif üyenin sonucu artık değişemeyecekken alınır: son gün herkesin saat diliminde kapanmış ve
-- bu challenge için bekleyen kurtarma yok. Böylece son günü kurtaran da sonuca girer ve sıralar
-- tutarlı olur. Sorumlu olduğu tüm günleri kapsayan üye "bitirmiş" sayılır: bahçeye kaktüs
-- eklenir, arkadaşlara bildirim gider.
create function app.finalize_member(p_user uuid, p_challenge uuid, p_at timestamptz) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_c public.challenges;
  v_m public.challenge_members;
  v_days integer;
  v_required integer;
  v_rescues integer;
  v_rank integer;
begin
  -- Kilit sırası her yerde aynı: önce challenge, sonra üye satırı (katılma ile sıralı çalışır)
  perform 1 from public.challenges c where c.id = p_challenge for no key update;
  select * into v_m from public.challenge_members m
  where m.challenge_id = p_challenge and m.user_id = p_user
  for update;
  if not found or v_m.status <> 'active' or v_m.finished_at is not null then
    return false;
  end if;

  select * into v_c from public.challenges c where c.id = p_challenge;
  if exists (
    select 1 from public.challenge_members o
    where o.challenge_id = p_challenge and o.status = 'active'
      and (app.day_closes_at(o.user_id, v_c.end_date) > p_at
           or exists (select 1 from app.pending_rescues(o.user_id, p_at) pr
                      where pr.challenge_id = p_challenge))
  ) then
    return false;
  end if;

  v_days := app.days_done(p_user, p_challenge);
  select (mr.range_end - mr.range_start + 1)::int into v_required
  from app.member_range(p_user, p_challenge) mr;
  -- Yalnızca üyenin aralığındaki kurtarmalar
  select count(*)::int into v_rescues
  from public.streak_rescues r
  cross join app.member_range(p_user, p_challenge) mr
  where r.user_id = p_user and r.challenge_id = p_challenge
    and r.rescued_date between mr.range_start and mr.range_end;

  -- Sıra: kapsanan gün sayısı, sonra katılma zamanı (erken katılan önde)
  select 1 + count(*)::int into v_rank
  from public.challenge_members o
  where o.challenge_id = p_challenge and o.status = 'active' and o.user_id <> p_user
    and (app.days_done(o.user_id, p_challenge) > v_days
         or (app.days_done(o.user_id, p_challenge) = v_days and o.joined_at < v_m.joined_at));

  update public.challenge_members m
  set finished_at = p_at, final_days_done = v_days, final_required_days = v_required,
      final_rescues = v_rescues, final_rank = v_rank
  where m.challenge_id = p_challenge and m.user_id = p_user;

  -- Biri sonuçlandıktan sonra aktif üye kümesi değişebilir (en batıdaki biri kendi son gününde
  -- katılır ya da sonuçlanmamış bir üye ayrılır). Son aktif üye sonuçlanınca tüm sıralar kayıtlı
  -- sonuçlardan aynı kuralla yeniden yazılır; iki kişi aynı sırayı almaz.
  if not exists (
    select 1 from public.challenge_members o
    where o.challenge_id = p_challenge and o.status = 'active' and o.finished_at is null
  ) then
    update public.challenge_members m
    set final_rank = r.rnk
    from (
      select o.user_id,
             row_number() over (order by o.final_days_done desc, o.joined_at, o.user_id)::smallint as rnk
      from public.challenge_members o
      where o.challenge_id = p_challenge and o.status = 'active'
    ) as r
    where m.challenge_id = p_challenge and m.user_id = r.user_id
      and m.final_rank is distinct from r.rnk;
  end if;

  if v_days >= v_required then
    insert into public.notifications (recipient_id, kind, actor_id, challenge_id, payload, local_date)
    select f.friend_id, 'friend_finished_challenge', p_user, p_challenge,
           -- Bitirdiği gün sayısı kendi günleri (sonradan katılan için süreden az olabilir)
           jsonb_build_object('title', v_c.title, 'duration_days', v_required,
                              'challenge_duration_days', v_c.duration_days),
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
    order by m.challenge_id
  loop
    if app.finalize_member(p_user, r.challenge_id, p_at) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end
$$;
