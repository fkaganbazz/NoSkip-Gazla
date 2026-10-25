-- Gazla veri modeli · 13/14 — reklamla kurtarma: AdMob SSV sonucu (StreakLost).
--
-- Akış: uygulama rewarded reklamı `user_id` + `custom_data` ({"challengeId","missedDate"}) ile
-- gösterir → Google ödülü kazanılınca Edge Function `admob-ssv`'yi çağırır → fonksiyon imzayı
-- doğrular ve service role ile `grant_ad_rescue(user, challenge, gün, transaction_id)` çağırır
-- (kurallar orada: kurtarılabilir gün, aynı ödül bir kez). Kural reddederse (süre geçti, gün zaten
-- kurtarıldı …) `record_ad_rescue_failure` sebebi kaydeder.
--
-- Uygulama reklam kapanınca `ad_rescue_result(challenge, gün)` ile sonucu sorar: 'granted' (gün
-- kurtarıldı), 'pending' (geri çağrı henüz gelmedi; istemci kısa aralıklarla yeniden sorar) ya da
-- reddin hatası (son 10 dakikadaki ret; mesaj Türkçe, `hint` kararlı anahtar: istemci uygulama dilindeki
-- metni gösterir).
--
-- Not: SSV'de user_id ve custom_data'yı istemci verir, Google yalnızca imzalar. Bu yüzden ödül yalnızca
-- kurtarma kurallarına uyan bir gün için ve bir kez kullanılabilir (grant_ad_rescue).

create table app.ad_rescue_failures (
  ad_reward_id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  missed_date date not null,
  message text not null,
  code text,
  -- grant_ad_rescue hatasının kararlı anahtarı (`raise … hint`; istemci sözlüğü serverErrors)
  hint text,
  created_at timestamptz not null default now(),
  constraint ad_rescue_failures_message check (char_length(message) between 1 and 300),
  constraint ad_rescue_failures_hint check (hint is null or hint ~ '^[a-z0-9_]{1,64}$')
);
create index ad_rescue_failures_lookup_idx
  on app.ad_rescue_failures (user_id, challenge_id, missed_date, created_at desc);
alter table app.ad_rescue_failures enable row level security;
revoke all on app.ad_rescue_failures from public, anon, authenticated;

-- Retten sonra istemcinin hatayı göstereceği süre (sonraki reklam yeni bir deneme sayılır)
create function app.ad_rescue_failure_ttl() returns interval
language sql immutable parallel safe as $$ select interval '10 minutes' $$;

-- Edge Function admob-ssv: grant_ad_rescue reddettiğinde (service role). Kullanıcı ya da challenge
-- yoksa (silinmiş, uydurma custom_data) kaydedilmez. Aynı ödül ikinci kez gelirse ilk kayıt kalır.
-- p_hint: hatanın anahtarı (PostgREST `hint`); biçimi geçersizse saklanmaz.
create function public.record_ad_rescue_failure(
  p_user uuid, p_challenge uuid, p_missed_date date, p_ad_reward_id text, p_message text, p_code text,
  p_hint text default null
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if p_ad_reward_id is null or char_length(p_ad_reward_id) not between 8 and 200 then
    raise exception 'Geçersiz ödül kimliği' using errcode = '22023', hint = 'invalid_reward_id';
  end if;
  insert into app.ad_rescue_failures (ad_reward_id, user_id, challenge_id, missed_date, message, code, hint)
  select p_ad_reward_id, p_user, p_challenge, p_missed_date,
         left(coalesce(nullif(btrim(p_message), ''), 'Bu gün için kurtarma yapılamaz'), 300),
         left(p_code, 10),
         case when p_hint ~ '^[a-z0-9_]{1,64}$' then p_hint end
  where exists (select 1 from public.profiles p where p.id = p_user)
    and exists (select 1 from public.challenges c where c.id = p_challenge)
  on conflict (ad_reward_id) do nothing;
  return found;
end
$$;

-- Uygulama: reklam izlendikten sonra kurtarma sonucu. Gün kurtarıldıysa 'granted'; son retten sonra
-- kurtarılmadıysa reddin hatası (anahtarı saklanmadıysa — Postgres'in kendi hatası — 'rescue_unavailable');
-- ikisi de yoksa 'pending'.
create function app.ad_rescue_result(p_user uuid, p_challenge uuid, p_missed_date date, p_at timestamptz)
returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  v_fail app.ad_rescue_failures;
begin
  if exists (
    select 1 from public.streak_rescues r
    where r.user_id = p_user and r.challenge_id = p_challenge and r.rescued_date = p_missed_date
  ) then
    return 'granted';
  end if;

  select * into v_fail from app.ad_rescue_failures f
  where f.user_id = p_user and f.challenge_id = p_challenge and f.missed_date = p_missed_date
    and f.created_at > p_at - app.ad_rescue_failure_ttl()
  order by f.created_at desc
  limit 1;
  if found then
    raise exception '%', v_fail.message using errcode = 'P0001', hint = coalesce(v_fail.hint, 'rescue_unavailable');
  end if;
  return 'pending';
end
$$;

create function public.ad_rescue_result(p_challenge uuid, p_missed_date date) returns text
language sql stable security definer set search_path = '' as $$
  select app.ad_rescue_result(app.require_user(), p_challenge, p_missed_date, now())
$$;

revoke execute on function public.record_ad_rescue_failure(uuid, uuid, date, text, text, text, text),
  public.ad_rescue_result(uuid, date) from public, anon, authenticated;
grant execute on function public.ad_rescue_result(uuid, date) to authenticated;
grant execute on function public.record_ad_rescue_failure(uuid, uuid, date, text, text, text, text) to service_role;
revoke execute on function app.ad_rescue_result(uuid, uuid, date, timestamptz), app.ad_rescue_failure_ttl()
  from public, anon, authenticated;
grant execute on function app.ad_rescue_result(uuid, uuid, date, timestamptz), app.ad_rescue_failure_ttl()
  to service_role;
