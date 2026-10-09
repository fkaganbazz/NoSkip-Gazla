-- Gazla veri modeli · 1/10 — uzantılar, enum'lar, özel yardımcı şema ve zaman kuralları.
--
-- `app` şeması API'ye açık değildir (PostgREST yalnızca public'i sunar). RLS politikalarının
-- kullandığı SECURITY DEFINER yardımcılar burada durur; böylece istemci onları doğrudan çağırıp
-- örneğin "kim kimi engelledi" bilgisini sızdıramaz.
--
-- Fonksiyon yetkileri varsayılan olarak kapalıdır: PostgreSQL her yeni fonksiyonu PUBLIC'e açar,
-- burada bu varsayılan kaldırılır. app fonksiyonlarını yalnızca service_role çalıştırır;
-- authenticated'a RLS politikalarının çağırdıkları açıkça verilir (20261007100700, Yetkiler).

create extension if not exists citext with schema extensions;

create schema if not exists app;
grant usage on schema app to authenticated, service_role;

alter default privileges revoke execute on functions from public;
alter default privileges in schema app grant execute on functions to service_role;

-- Enum'lar ---------------------------------------------------------------------------------

create type public.task_type as enum ('check', 'photo', 'number');
create type public.challenge_category as enum (
  'detox', 'social_courage', 'sport', 'food_drink', 'reading', 'money', 'quirky'
);
create type public.challenge_difficulty as enum ('easy', 'medium', 'hard');
create type public.member_role as enum ('owner', 'member');
create type public.member_status as enum ('invited', 'active', 'declined', 'left');
create type public.friendship_status as enum ('pending', 'accepted');
create type public.poke_tone as enum ('hype', 'roast');
create type public.rescue_method as enum ('ad', 'free');
create type public.report_target as enum ('user', 'photo', 'challenge');
create type public.report_reason as enum (
  'harassment', 'inappropriate_photo', 'spam_or_fake', 'dangerous_challenge', 'other'
);
create type public.report_status as enum ('pending', 'reviewing', 'actioned', 'dismissed');
create type public.notification_kind as enum (
  'daily_reminder', 'day_ending', 'streak_broken', 'weekly_summary', 'streak_milestone',
  'poke_hype', 'poke_roast', 'friend_request', 'challenge_invite', 'friend_finished_challenge'
);
create type public.discoverability as enum ('everyone', 'nobody');
create type public.diken_stage as enum ('filiz', 'genc', 'tam', 'cicek');

-- Sabitler (ürün kuralları tek yerde) ------------------------------------------------------

-- Gece yarısından sonra önceki günü işaretleme toleransı (CLAUDE.md: 2 saat)
create function app.grace_period() returns interval
language sql immutable parallel safe as $$ select interval '2 hours' $$;

-- Seri koptuktan sonra kurtarma süresi; günün kapanışından (gece yarısı + tolerans) itibaren
create function app.rescue_window() returns interval
language sql immutable parallel safe as $$ select interval '24 hours' $$;

-- Saat dilimi bilinmeyen kullanıcı için varsayılan
create function app.default_timezone() returns text
language sql immutable parallel safe as $$ select 'Europe/Istanbul' $$;

-- En küçük yaş (doğum yılı kontrolü)
create function app.min_age() returns integer
language sql immutable parallel safe as $$ select 13 $$;

-- Bir challenge'daki en fazla aktif üye
create function app.max_members() returns integer
language sql immutable parallel safe as $$ select 20 $$;

-- Bir kullanıcının aynı anda sürdürebileceği en fazla challenge (bitmemiş, aktif üyelik)
create function app.max_active_challenges() returns integer
language sql immutable parallel safe as $$ select 20 $$;

-- Aynı kişiye, alıcının yerel gününde en fazla dürtme
create function app.poke_daily_limit() returns integer
language sql immutable parallel safe as $$ select 3 $$;

-- Aynı kişiye 24 saatte en fazla arkadaşlık isteği (geri çekip yeniden gönderme dahil)
create function app.friend_request_daily_limit() returns integer
language sql immutable parallel safe as $$ select 3 $$;

-- Gönderilen dürtmeyi geri alma süresi ("Geri al" tostu)
create function app.poke_undo_window() returns interval
language sql immutable parallel safe as $$ select interval '30 seconds' $$;

-- Diken bildirimleri: günde en fazla 2, sessiz saatler 23:30–08:00 (yerel)
create function app.diken_daily_limit() returns integer
language sql immutable parallel safe as $$ select 2 $$;
create function app.quiet_hours_start() returns time
language sql immutable parallel safe as $$ select time '23:30' $$;
create function app.quiet_hours_end() returns time
language sql immutable parallel safe as $$ select time '08:00' $$;

-- Ortak tetikleyiciler ---------------------------------------------------------------------

create function app.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- IANA saat dilimi doğrulaması (CHECK kısıtı değişmez fonksiyon ister; bu yüzden tetikleyicide)
create function app.assert_valid_timezone(p_tz text) returns void
language plpgsql stable set search_path = '' as $$
begin
  if p_tz is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then
    raise exception 'Geçersiz saat dilimi: %', p_tz using errcode = '22023';
  end if;
end
$$;
