-- Gazla veri modeli · 2/10 — profiller, kullanıcı ayarları ve yerel gün hesapları.
--
-- profiles: başkalarının görebileceği alanlar (arkadaşlar, ortak challenge üyeleri).
-- user_settings: yalnızca sahibinin okuyabildiği alanlar (doğum yılı, saat dilimi, bildirim tercihleri).
-- RLS satır bazlıdır; sütun gizlemek için ayrı tablo gerekir.

-- Profiller --------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique,
  display_name text not null,
  avatar_path text,
  avatar_tint text not null default 'peach',
  harsh_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 3–20 karakter: küçük harf, rakam, nokta, alt çizgi; harf/rakamla başlayıp biter ("deniz.k")
  constraint profiles_username_format
    check (username::text ~ '^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$'),
  constraint profiles_display_name_length
    check (char_length(btrim(display_name)) between 1 and 40),
  constraint profiles_avatar_tint check (avatar_tint in ('peach', 'lavender', 'mint', 'butter')),
  constraint profiles_avatar_path check (avatar_path is null or avatar_path like id::text || '/%')
);

comment on table public.profiles is 'Herkese açık profil alanları; görünürlük RLS ile (arkadaş / ortak üye / engel).';
comment on column public.profiles.harsh_mode is 'Sert mod: açıksa arkadaşlar "laf sok" dürtmesi gönderebilir.';

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function app.touch_updated_at();

-- Ayrılmış kullanıcı adları
create function app.is_reserved_username(p_username text) returns boolean
language sql immutable parallel safe as $$
  select lower(p_username) in (
    'diken', 'spiky', 'gazla', 'noskip', 'admin', 'administrator', 'support', 'destek',
    'help', 'yardim', 'moderator', 'system', 'root', 'null', 'undefined'
  )
$$;

create function app.profiles_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if app.is_reserved_username(new.username::text) then
    raise exception 'Bu kullanıcı adı kullanılamaz' using errcode = '23514';
  end if;
  return new;
end
$$;

create trigger profiles_guard
  before insert or update of username on public.profiles
  for each row execute function app.profiles_guard();

-- Kullanıcı ayarları (yalnızca sahibi) -----------------------------------------------------

create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  birth_year smallint not null,
  timezone text not null default 'Europe/Istanbul',
  locale text not null default 'tr',
  poke_push_enabled boolean not null default true,
  -- Günlük hatırlatma saati (yerel); null = kapalı
  daily_reminder_time time default '21:00',
  discoverability public.discoverability not null default 'everyone',
  terms_accepted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_locale check (locale in ('tr', 'en')),
  constraint user_settings_birth_year check (birth_year between 1900 and 2100)
);

comment on table public.user_settings is 'Yalnızca sahibinin okuyabildiği ayarlar; zamanlanmış işler service role ile okur.';

create function app.user_settings_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  perform app.assert_valid_timezone(new.timezone);
  if new.birth_year > extract(year from now())::int - app.min_age() then
    raise exception 'En az % yaşında olmalısın', app.min_age() using errcode = '23514';
  end if;
  return new;
end
$$;

create trigger user_settings_guard
  before insert or update of timezone, birth_year on public.user_settings
  for each row execute function app.user_settings_guard();

create trigger user_settings_touch_updated_at
  before update on public.user_settings
  for each row execute function app.touch_updated_at();

-- Yerel gün kuralları ----------------------------------------------------------------------
-- Tüm zaman fonksiyonları açık bir "an" (p_at) alır; testler saati sabitleyebilsin.

create function app.user_timezone(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select s.timezone from public.user_settings s where s.user_id = p_user),
    app.default_timezone()
  )
$$;

-- Kullanıcının o andaki yerel takvim günü
create function app.local_date(p_user uuid, p_at timestamptz) returns date
language sql stable set search_path = '' as $$
  select (p_at at time zone app.user_timezone(p_user))::date
$$;

-- Hâlâ işaretlenebilen günler: bugün ve gece yarısından sonraki 2 saat içinde dün.
create function app.open_dates(p_user uuid, p_at timestamptz) returns date[]
language sql stable set search_path = '' as $$
  with t as (select p_at at time zone app.user_timezone(p_user) as local_ts)
  select array(
    select d::date
    from t, generate_series((t.local_ts - app.grace_period())::date, t.local_ts::date, interval '1 day') as g(d)
    order by d desc
  )
$$;

-- Bir günün kapandığı an: ertesi gün yerel 00:00 + tolerans
create function app.day_closes_at(p_user uuid, p_day date) returns timestamptz
language sql stable set search_path = '' as $$
  select ((p_day + 1)::timestamp + app.grace_period()) at time zone app.user_timezone(p_user)
$$;

-- RLS ---------------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

-- profiles: okuma politikası arkadaşlık/üyelik tabloları oluştuktan sonra (challenges migration'ı).
create policy "profiles: insert own" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Kimlik ve zaman damgaları istemciden değiştirilemez
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, username, display_name, avatar_path, avatar_tint, harsh_mode)
  on public.profiles to authenticated;
grant update (username, display_name, avatar_path, avatar_tint, harsh_mode)
  on public.profiles to authenticated;

create policy "user_settings: read own" on public.user_settings
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_settings: insert own" on public.user_settings
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_settings: update own" on public.user_settings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke insert, update on public.user_settings from anon, authenticated;
grant insert (user_id, birth_year, timezone, locale, poke_push_enabled, daily_reminder_time,
              discoverability, terms_accepted_at)
  on public.user_settings to authenticated;
grant update (timezone, locale, poke_push_enabled, daily_reminder_time, discoverability)
  on public.user_settings to authenticated;

revoke all on public.profiles, public.user_settings from anon;
