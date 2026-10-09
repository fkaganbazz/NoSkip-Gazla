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
  -- Uzunluk ham metinden ölçülür (boşlukla şişirilemez); boş/yalnız boşluk olamaz
  constraint profiles_display_name_length
    check (char_length(display_name) <= 40 and char_length(btrim(display_name)) >= 1),
  constraint profiles_avatar_tint check (avatar_tint in ('peach', 'lavender', 'mint', 'butter')),
  -- avatars kovasında {id}/{dosya}: tek dosya adı, "." ile başlamaz
  constraint profiles_avatar_path check (
    avatar_path is null or (
      avatar_path like id::text || '/%'
      and avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-][A-Za-z0-9._-]{0,99}$'
    )
  )
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

-- Görünen ad maskot, marka ya da destek ekibi gibi görünmesin ("Diken", "Gazla Destek",
-- "NoSkip Support"): Türkçe harfler sadeleştirilip harf/rakam dışı her şey atıldıktan sonra ad
-- yalnızca ayrılmış kelimelerden (ve "ekibi", "resmi", "bot" gibi eklerden) oluşamaz. "Diken Ali",
-- "Gazlayan Mehmet" gibi adlar geçer. En iyi çaba: istemci Diken bildirimlerini ayrı gösterir ve
-- görünen adın yanında hep @kullanıcıadı yazar.
create function app.is_reserved_display_name(p_name text) returns boolean
language sql immutable parallel safe as $$
  select regexp_replace(
           lower(translate(p_name, 'İIıĞğÜüŞşÖöÇçÂâÎîÛû', 'iiigguussoocc' || 'aaiiuu')),
           '[^a-z0-9]', '', 'g'
         ) ~ ('^(diken|spiky|gazla|noskip|admin|administrator|support|destek|help|yardim|moderator'
              '|system|root|null|undefined|ekibi|ekip|team|resmi|official|bot)+$')
$$;

create function app.profiles_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if app.is_reserved_username(new.username::text) then
    raise exception 'Bu kullanıcı adı kullanılamaz' using errcode = '23514';
  end if;
  if (tg_op = 'INSERT' or new.display_name is distinct from old.display_name)
     and app.is_reserved_display_name(new.display_name) then
    raise exception 'Bu görünen ad kullanılamaz' using errcode = '23514';
  end if;
  return new;
end
$$;

create trigger profiles_guard
  before insert or update of username, display_name on public.profiles
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
  -- Saat dilimi değişince bu günden önceki günler işaretlenemez (eski dilimde kapanmış günler
  -- yeni dilimde yeniden açılmasın: kurtarma yerine bedava geriye dönük işaretleme olurdu)
  checkin_floor date,
  updated_at timestamptz not null default now(),
  constraint user_settings_locale check (locale in ('tr', 'en')),
  constraint user_settings_birth_year check (birth_year between 1900 and 2100)
);

comment on table public.user_settings is 'Yalnızca sahibinin okuyabildiği ayarlar; zamanlanmış işler service role ile okur.';

create function app.user_settings_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform app.assert_valid_timezone(new.timezone);
  if new.birth_year > extract(year from now())::int - app.min_age() then
    raise exception 'En az % yaşında olmalısın', app.min_age() using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and new.timezone is distinct from old.timezone then
    -- Eski dilimde hâlâ açık olan en erken gün (bkz. app.open_dates)
    new.checkin_floor := greatest(
      old.checkin_floor, ((now() - app.grace_period()) at time zone old.timezone)::date
    );
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

-- Yerel günün başladığı an (o günün ilk anı). PostgreSQL belirsiz duvar saatini (saat geri
-- alınırken iki kez yaşanan saat) SONRAKİ ana çevirir; saatin gece yarısının üstünden geri alındığı
-- bölgelerde (America/Havana, Atlantic/Azores) gün ÖNCEKİ 00:00'da başlar: 00:00'ı bir gün önceki
-- farkla oku ve gerçekten o günün 00:00'ını gösteriyor ve daha erkense onu al.
create function app.local_day_start(p_tz text, p_day date) returns timestamptz
language sql stable set search_path = '' as $$
  with t as (select p_day::timestamp at time zone p_tz as later),
  e as (
    select t.later,
           (p_day::timestamp - (((t.later - interval '1 day') at time zone p_tz)
                                - ((t.later - interval '1 day') at time zone 'UTC'))) at time zone 'UTC' as earlier
    from t
  )
  select case when e.earlier < e.later and (e.earlier at time zone p_tz) = p_day::timestamp
              then e.earlier else e.later end
  from e
$$;

-- Bir günün kapandığı an: ertesi günün yerel gece yarısından 2 saat (geçen süre) sonra.
-- Geçen süreyle tanımlı olduğu için yaz saati gecelerinde de tam 2 saattir.
create function app.day_closes_at(p_user uuid, p_day date) returns timestamptz
language sql stable set search_path = '' as $$
  select app.local_day_start(app.user_timezone(p_user), p_day + 1) + app.grace_period()
$$;

-- Hâlâ işaretlenebilen günler (yeniden eskiye): bugün ve kapanmamışsa dün.
-- day_closes_at ile aynı kural: gün d açık ⇔ p_at < day_closes_at(d) ⇔ (p_at − tolerans)'ın yerel günü ≤ d.
create function app.open_dates(p_user uuid, p_at timestamptz) returns date[]
language sql stable set search_path = '' as $$
  with z as (select app.user_timezone(p_user) as tz)
  select array(
    select g::date
    from z, generate_series(((p_at - app.grace_period()) at time zone z.tz)::date,
                            (p_at at time zone z.tz)::date, interval '1 day') as g
    order by g desc
  )
$$;

-- İşaretleme ve geri almaya açık günler: açık günler, saat dilimi değişikliği tabanından itibaren
create function app.checkin_dates(p_user uuid, p_at timestamptz) returns date[]
language sql stable security definer set search_path = '' as $$
  select array(
    select d from unnest(app.open_dates(p_user, p_at)) as d
    where d >= coalesce((select s.checkin_floor from public.user_settings s where s.user_id = p_user),
                        '-infinity'::date)
    order by d desc
  )
$$;

-- Bundan sonra işaretlenebilecek ilk gün (katılma günü): bugün; saat dilimi tabanı bugünden
-- ilerideyse (bugün eski dilimde kapanmışsa) taban
create function app.first_checkin_date(p_user uuid, p_at timestamptz) returns date
language sql stable security definer set search_path = '' as $$
  select greatest(app.local_date(p_user, p_at),
                  (select s.checkin_floor from public.user_settings s where s.user_id = p_user))
$$;

-- RLS ---------------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

-- profiles: okuma politikası arkadaşlık/üyelik tabloları oluştuktan sonra (challenges migration'ı).
-- Profil ve ayarlar yalnızca public.complete_profile ile oluşturulur (yaş ve saat dilimi kontrolü,
-- şartların kabul zamanı aynı işlemde); istemci doğrudan ekleyemez.
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Kimlik ve zaman damgaları istemciden değiştirilemez
revoke insert, update on public.profiles from anon, authenticated;
grant update (username, display_name, avatar_path, avatar_tint, harsh_mode)
  on public.profiles to authenticated;

create policy "user_settings: read own" on public.user_settings
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "user_settings: update own" on public.user_settings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke insert, update on public.user_settings from anon, authenticated;
grant update (timezone, locale, poke_push_enabled, daily_reminder_time, discoverability)
  on public.user_settings to authenticated;

revoke all on public.profiles, public.user_settings from anon;
