-- Sunucu eksikleri (2026-11-21): ekranların beklediği ayarlar ve işler.
--
-- 1. Ayarlar (user_settings):
--    - Bildirim anahtarları: "arkadaşın bitirdi" push'u, "seri koptu" Diken bildirimi, haftalık özet.
--      Dürtme anahtarı (poke_push_enabled) gibi yalnızca push'u keser; arkadaş satırı Aktivite'de kalır.
--    - Görünüm tercihi (theme: system | light | dark): cihazlar arasında aynı kalsın diye sunucuda da.
--    - Reklam izni sonucu (ads_personalized; null = henüz akış tamamlanmadı). Zamanını tetikleyici yazar
--      (ads_consent_at). Karar cihazda (UMP + iOS ATT) verilir; burası yalnızca kayıt.
--    - Doğum yılı değiştirilebilir; yaş sınırı aynı tetikleyicide (app.user_settings_guard).
-- 2. Haftalık özet ("Haftan", Pazar 19:00 yerel): son 7 günde görevi olan günlerden kaçının tamamı
--    yapıldı ve en kalabalık aktif grubundaki sıran. Diken bildirimidir: sessiz saat ve günde 2 kuralı
--    geçerli. queue_diken_notifications artık `title` da döner (null = "Diken").
-- 3. Expo push makbuzları: gönderilen bildirimlerin bilet (ticket) kimlikleri saklanır; 15 dakikalık
--    turda en az 15 dakikalık biletlerin makbuzu okunur, DeviceNotRegistered token'lar silinir.
-- 4. create_challenge: özel challenge'a ikon ve renk (p_icon, p_tint). Sayı adımı zaten vardı (p_number_step).

-- 1. Ayarlar -----------------------------------------------------------------------------------------

alter table public.user_settings
  add column friend_finished_push_enabled boolean not null default true,
  add column streak_lost_push_enabled boolean not null default true,
  add column weekly_summary_enabled boolean not null default true,
  add column theme text not null default 'system',
  add column ads_personalized boolean,
  add column ads_consent_at timestamptz,
  add constraint user_settings_theme check (theme in ('system', 'light', 'dark'));

comment on column public.user_settings.ads_personalized is
  'Son reklam izni sonucu: true kişiselleştirilmiş, false kişiselleştirilmemiş, null henüz yok. Zamanı ads_consent_at.';

create function app.user_settings_ads_consent() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.ads_personalized is distinct from old.ads_personalized then
    new.ads_consent_at := now();
  end if;
  return new;
end
$$;

create trigger user_settings_ads_consent
  before update of ads_personalized on public.user_settings
  for each row execute function app.user_settings_ads_consent();

grant update (birth_year, friend_finished_push_enabled, streak_lost_push_enabled, weekly_summary_enabled,
              theme, ads_personalized)
  on public.user_settings to authenticated;

create or replace function app.claim_social_push(p_notification uuid, p_at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v record;
begin
  select n.id, n.recipient_id, n.kind, n.actor_id, n.challenge_id, n.payload,
         ap.display_name as actor_name, c.title as challenge_title,
         coalesce(s.locale, 'tr') as locale,
         case when s.locale = 'en' then coalesce(pm.text_en, pm.text_tr) else pm.text_tr end as poke_text,
         coalesce(s.poke_push_enabled, true) as poke_push_enabled,
         coalesce(s.friend_finished_push_enabled, true) as friend_finished_push_enabled
  into v
  from public.notifications n
  join public.profiles ap on ap.id = n.actor_id
  left join public.challenges c on c.id = n.challenge_id
  left join public.pokes pk on pk.id = n.poke_id
  left join public.poke_messages pm on pm.key = pk.message_key and pm.tone = pk.tone
  left join public.user_settings s on s.user_id = n.recipient_id
  where n.id = p_notification and n.actor_id is not null and n.pushed_at is null
  for update of n;
  if not found then
    return null;
  end if;
  if v.kind in ('poke_hype', 'poke_roast') and not v.poke_push_enabled then
    return null;
  end if;
  -- "Arkadaşın bitirdi" kapalıysa push gitmez (satır Aktivite'de kalır)
  if v.kind = 'friend_finished_challenge' and not v.friend_finished_push_enabled then
    return null;
  end if;
  if app.is_blocked(v.recipient_id, v.actor_id) then
    return null;
  end if;

  update public.notifications n set pushed_at = p_at where n.id = p_notification;
  return jsonb_build_object(
    'notification_id', v.id,
    'recipient_id', v.recipient_id,
    'locale', v.locale,
    'kind', v.kind,
    'actor_id', v.actor_id,
    'actor_name', v.actor_name,
    'challenge_id', v.challenge_id,
    'challenge_title', coalesce(v.challenge_title, v.payload ->> 'title'),
    'poke_text', v.poke_text,
    'payload', v.payload,
    'tokens', to_jsonb(array(
      select pt.token from public.push_tokens pt where pt.user_id = v.recipient_id order by pt.last_seen_at desc
    ))
  );
end
$$;

-- 2. Haftalık özet -------------------------------------------------------------------------------------

-- Pazar (ISO haftanın 7. günü), 19:00 yerel
create function app.weekly_summary_isodow() returns integer
language sql immutable parallel safe as $$ select 7 $$;
create function app.weekly_summary_time() returns time
language sql immutable parallel safe as $$ select time '19:00' $$;

-- Son 7 yerel gün (bugün dahil): görevi olan gün sayısı (total), hepsi kapsanan gün sayısı (done) ve
-- en kalabalık aktif grubundaki sırası (rank; tek kişilikse null)
create function app.weekly_summary(p_user uuid, p_at timestamptz)
returns table (done integer, total integer, rank integer)
language sql stable security definer set search_path = '' as $$
  with d as (
    select s.required, s.covered from app.user_day_status(p_user, p_at) s
    where s.day > app.local_date(p_user, p_at) - 7 and s.required > 0
  ),
  g as (
    select m.challenge_id from public.challenge_members m
    where m.user_id = p_user and m.status = 'active'
      and app.active_member_count(m.challenge_id) > 1
    order by app.active_member_count(m.challenge_id) desc, m.joined_at desc
    limit 1
  )
  select (select count(*) filter (where d.covered >= d.required) from d)::int,
         (select count(*) from d)::int,
         (select b.rank from g cross join app.challenge_board(p_user, g.challenge_id, p_at) b
          where b.user_id = p_user)
$$;

-- "7 günün 5'ini tamamladın. Grupta 2. sıradasın." (design/Notifications.dc.html), alıcının dilinde
create function app.weekly_summary_text(p_done integer, p_total integer, p_rank integer, p_locale text)
returns text
language sql immutable parallel safe set search_path = '' as $$
  select case when p_locale = 'en' then
    case when p_done = 0 then 'No full days this week. New week, fresh start.'
         else format('You finished %s of %s days.', p_done, p_total) end
    || case when p_rank is null then ''
            else format(' You''re %s in your group.',
                        p_rank || case when p_rank % 100 between 11 and 13 then 'th'
                                       when p_rank % 10 = 1 then 'st' when p_rank % 10 = 2 then 'nd'
                                       when p_rank % 10 = 3 then 'rd' else 'th' end) end
  else
    case when p_done = 0 then 'Bu hafta tam gün yok. Yeni hafta, yeni başlangıç.'
         -- Sayıdan sonra iyelik + belirtme eki (son rakama göre): 5'ini, 2'sini, 3'ünü, 6'sını
         else format('%s günün %s''%s tamamladın.', p_total, p_done,
                     case p_done % 10 when 1 then 'ini' when 2 then 'sini' when 3 then 'ünü' when 4 then 'ünü'
                                      when 5 then 'ini' when 6 then 'sını' when 7 then 'sini' when 8 then 'ini'
                                      when 9 then 'unu' else 'unu' end) end
    || case when p_rank is null then '' else format(' Grupta %s. sıradasın.', p_rank) end
  end
$$;

-- Dönüş tipi değişti (title): önce sarmalayıcı, sonra kendisi
drop function public.queue_diken_notifications();
drop function app.queue_diken_notifications(timestamptz);

create function app.queue_diken_notifications(p_at timestamptz)
returns table (
  notification_id uuid, recipient_id uuid, kind public.notification_kind, challenge_id uuid,
  title text, body text, url text, tokens text[]
)
language plpgsql security definer set search_path = '' as $$
declare
  u record;
  t record;
  v_local timestamp;
  v_time time;
  v_today date;
  v_pending integer;
  v_id uuid;
  v_text text;
  v_url text;
  v_rescue uuid;
  w record;
begin
  delete from app.diken_schedule_log l where l.local_date < (p_at at time zone 'UTC')::date - 3;

  for u in
    select s.user_id, s.daily_reminder_time, s.locale, s.streak_lost_push_enabled, s.weekly_summary_enabled
    from public.user_settings s
    join public.profiles p on p.id = s.user_id
    where exists (select 1 from public.push_tokens pt where pt.user_id = s.user_id)
    order by s.user_id
  loop
    -- Sessiz saat ya da bugünün 2 hakkı doldu: bu tur bu kullanıcıya hiçbir şey yok
    continue when not app.can_send_diken_push(u.user_id, p_at);

    v_local := p_at at time zone app.user_timezone(u.user_id);
    v_time := v_local::time;
    v_today := v_local::date;

    select count(*) into v_pending from app.diken_pending_challenges(u.user_id, p_at);

    -- Seri koptu: sabah, bekleyen kurtarma varsa. Uygulama yolu ilk bekleyen kurtarmanın challenge'ı
    -- (my_pending_rescues sırası: en uzun seri önce); ekran sıradakilere kendisi geçer. Günde bir bildirim.
    v_rescue := null;
    if u.streak_lost_push_enabled and app.in_diken_window(v_time, app.streak_broken_time()) then
      select pr.challenge_id into v_rescue
      from app.pending_rescues(u.user_id, p_at) pr
      order by pr.streak_before desc, pr.challenge_id
      limit 1;
    end if;
    if v_rescue is not null then
      v_text := app.diken_text('streak_broken', null, null, u.locale);
      v_url := '/streak-lost/' || v_rescue;
      v_id := app.queue_diken(u.user_id, 'streak_broken', v_today, null,
                              jsonb_build_object('text', v_text, 'url', v_url), p_at);
      if v_id is not null then
        notification_id := v_id; recipient_id := u.user_id; kind := 'streak_broken'; challenge_id := null;
        title := null; body := v_text; url := v_url;
        tokens := array(select pt.token from public.push_tokens pt where pt.user_id = u.user_id order by pt.last_seen_at desc);
        return next;
      end if;
    end if;

    -- Genel günlük hatırlatma
    if v_pending > 0 and app.in_diken_window(v_time, u.daily_reminder_time) then
      v_text := app.diken_text('daily_reminder', null, null, u.locale);
      v_url := '/';
      v_id := app.queue_diken(u.user_id, 'daily_reminder', v_today, null,
                              jsonb_build_object('text', v_text, 'url', v_url), p_at);
      if v_id is not null then
        notification_id := v_id; recipient_id := u.user_id; kind := 'daily_reminder'; challenge_id := null;
        title := null; body := v_text; url := v_url;
        tokens := array(select pt.token from public.push_tokens pt where pt.user_id = u.user_id order by pt.last_seen_at desc);
        return next;
      end if;
    end if;

    -- Challenge hatırlatmaları (etkin saat genel hatırlatmayla aynıysa o yeter)
    for t in
      select dp.challenge_id, dp.title from app.diken_pending_challenges(u.user_id, p_at) dp
      where app.in_diken_window(v_time, dp.remind_at)
        and dp.remind_at is distinct from u.daily_reminder_time
      order by dp.remind_at, dp.challenge_id
    loop
      v_text := app.diken_text('daily_reminder', null, t.title, u.locale);
      v_url := '/challenge/' || t.challenge_id;
      v_id := app.queue_diken(u.user_id, 'daily_reminder', v_today, t.challenge_id,
                              jsonb_build_object('text', v_text, 'url', v_url, 'title', t.title), p_at);
      if v_id is not null then
        notification_id := v_id; recipient_id := u.user_id; kind := 'daily_reminder'; challenge_id := t.challenge_id;
        title := null; body := v_text; url := v_url;
        tokens := array(select pt.token from public.push_tokens pt where pt.user_id = u.user_id order by pt.last_seen_at desc);
        return next;
      end if;
    end loop;

    -- Gün bitiyor
    if v_pending > 0 and app.in_diken_window(v_time, app.day_ending_time()) then
      v_text := app.diken_text('day_ending', v_pending, null, u.locale);
      v_url := '/';
      v_id := app.queue_diken(u.user_id, 'day_ending', v_today, null,
                              jsonb_build_object('text', v_text, 'url', v_url, 'pending', v_pending), p_at);
      if v_id is not null then
        notification_id := v_id; recipient_id := u.user_id; kind := 'day_ending'; challenge_id := null;
        title := null; body := v_text; url := v_url;
        tokens := array(select pt.token from public.push_tokens pt where pt.user_id = u.user_id order by pt.last_seen_at desc);
        return next;
      end if;
    end if;
    -- Haftalık özet ("Haftan"): Pazar 19:00, bu hafta görevi olan günler varsa
    if u.weekly_summary_enabled and extract(isodow from v_local) = app.weekly_summary_isodow()
       and app.in_diken_window(v_time, app.weekly_summary_time()) then
      select * into w from app.weekly_summary(u.user_id, p_at);
      if w.total > 0 then
        v_text := app.weekly_summary_text(w.done, w.total, w.rank, u.locale);
        v_url := '/';
        v_id := app.queue_diken(u.user_id, 'weekly_summary', v_today, null,
                                jsonb_build_object('text', v_text, 'url', v_url, 'done', w.done,
                                                   'total', w.total, 'rank', w.rank), p_at);
        if v_id is not null then
          notification_id := v_id; recipient_id := u.user_id; kind := 'weekly_summary'; challenge_id := null;
          title := case when u.locale = 'en' then 'Your week' else 'Haftan' end;
          body := v_text; url := v_url;
          tokens := array(select pt.token from public.push_tokens pt where pt.user_id = u.user_id order by pt.last_seen_at desc);
          return next;
        end if;
      end if;
    end if;
  end loop;
end
$$;

create function public.queue_diken_notifications()
returns table (
  notification_id uuid, recipient_id uuid, kind public.notification_kind, challenge_id uuid,
  title text, body text, url text, tokens text[]
)
language sql security definer set search_path = '' as $$
  select * from app.queue_diken_notifications(now())
$$;

-- 3. Expo push makbuzları ----------------------------------------------------------------------------

create table app.push_tickets (
  id text primary key,
  token text not null,
  created_at timestamptz not null default now()
);
alter table app.push_tickets enable row level security;
revoke all on app.push_tickets from public, anon, authenticated;

-- Edge Function `push`: Expo'nun döndürdüğü biletler ([{"id", "token"}])
create function public.record_push_tickets(p_tickets jsonb) returns integer
language sql security definer set search_path = '' as $$
  with ins as (
    insert into app.push_tickets (id, token)
    select t ->> 'id', t ->> 'token' from jsonb_array_elements(coalesce(p_tickets, '[]'::jsonb)) t
    where t ->> 'id' is not null and t ->> 'token' is not null
    on conflict do nothing
    returning 1
  )
  select count(*)::int from ins
$$;

-- Makbuzu okunacak biletleri alır ve siler (en az 15 dakikalık; Expo makbuzları ~24 saat tutar,
-- daha eskiler okunmadan atılır). Makbuz isteği başarısız olursa biletler kaybolur: yalnızca temizlik.
create function public.claim_push_receipts(p_limit integer default 1000)
returns table (id text, token text)
language plpgsql security definer set search_path = '' as $$
begin
  delete from app.push_tickets t where t.created_at < now() - interval '1 day';
  return query
  delete from app.push_tickets t
  where t.id in (
    select x.id from app.push_tickets x
    where x.created_at < now() - interval '15 minutes'
    order by x.created_at
    limit least(greatest(coalesce(p_limit, 1000), 1), 1000)
  )
  returning t.id, t.token;
end
$$;

-- 4. create_challenge: özel challenge'ın ikonu ve rengi --------------------------------------------

-- İstemcideki anahtarlarla aynı (src/data/types.ts ChallengeIconKey, ChallengeTintKey)
create function app.challenge_icons() returns text[]
language sql immutable parallel safe as $$
  select array['check', 'coffee', 'phoneOff', 'chatHeart', 'timer', 'book', 'wallet', 'toothbrush', 'candy']
$$;
create function app.challenge_tints() returns text[]
language sql immutable parallel safe as $$
  select array['lilac', 'rose', 'green', 'butter', 'peach', 'teal', 'sky']
$$;

drop function public.create_challenge(uuid, text, public.task_type, integer, date, time, text, text, numeric,
                                      numeric, numeric, numeric, uuid[], public.challenge_visibility);
drop function app.do_create_challenge(uuid, uuid, text, public.task_type, integer, date, time, text, text,
                                      numeric, numeric, numeric, numeric, uuid[], timestamptz,
                                      public.challenge_visibility);

create function app.do_create_challenge(
  p_user uuid,
  p_template uuid,
  p_title text,
  p_task_type public.task_type,
  p_duration_days integer,
  p_start_date date,
  p_reminder_time time,
  p_invite_message text,
  p_number_unit text,
  p_number_base_target numeric,
  p_number_daily_increment numeric,
  p_number_step numeric,
  p_number_max numeric,
  p_invitees uuid[],
  p_at timestamptz,
  -- Sonda ve varsayılanlı: zamanı sabitleyen çağrılar (testler) sırayla vermeye devam edebilsin
  p_visibility public.challenge_visibility default 'invited',
  -- Özel challenge'ın ikonu ve rengi (şablonluda şablonunki); listede yoksa varsayılan
  p_icon text default null,
  p_tint text default null
) returns public.challenges
language plpgsql security definer set search_path = '' as $$
declare
  v_t public.challenge_templates;
  v_today date := app.local_date(p_user, p_at);
  v_start date := coalesce(p_start_date, v_today);
  v_locale text := coalesce((select s.locale from public.user_settings s where s.user_id = p_user), 'tr');
  v_row public.challenges;
begin
  -- Sayı ayarları 4 ondalığa yuvarlanır (JS kayan nokta kırıntısı)
  p_number_base_target := trim_scale(round(p_number_base_target, 4));
  p_number_daily_increment := trim_scale(round(p_number_daily_increment, 4));
  p_number_step := trim_scale(round(p_number_step, 4));
  p_number_max := trim_scale(round(p_number_max, 4));
  -- Başlangıç bugün ya da en fazla 7 gün sonra ("Yarın başlıyor")
  if v_start < v_today or v_start > v_today + 7 then
    raise exception 'Başlangıç günü bugün ile 7 gün sonrası arasında olmalı' using errcode = '22023', hint = 'start_date_out_of_range';
  end if;
  perform app.assert_can_take_challenge(p_user, p_at);

  if p_template is not null then
    select * into v_t from public.challenge_templates t where t.id = p_template and t.is_active;
    if not found then
      raise exception 'Şablon bulunamadı' using errcode = 'P0002', hint = 'template_not_found';
    end if;
    -- Süre şablonun izin verdiklerinden biri olmalı (ChallengePreview süre seçicisi)
    if p_duration_days is not null and not (p_duration_days = any (v_t.allowed_durations)) then
      raise exception 'Bu challenge için bu süre seçilemez' using errcode = '23514', hint = 'duration_not_allowed';
    end if;
    insert into public.challenges (
      template_id, created_by, title, short_title, task_type, duration_days, start_date,
      reminder_time, invite_message, category, icon, tint,
      number_unit, number_base_target, number_daily_increment, number_step, number_max, visibility
    ) values (
      v_t.id, p_user,
      case when v_locale = 'en' then coalesce(v_t.title_en, v_t.title_tr) else v_t.title_tr end,
      case when v_locale = 'en' then coalesce(v_t.short_title_en, v_t.short_title_tr) else v_t.short_title_tr end,
      v_t.task_type, coalesce(p_duration_days, v_t.default_duration_days), v_start,
      p_reminder_time, nullif(btrim(p_invite_message), ''), v_t.category, v_t.icon, v_t.tint,
      case when v_locale = 'en' then coalesce(v_t.number_unit_en, v_t.number_unit) else v_t.number_unit end,
      v_t.number_base_target, v_t.number_daily_increment, v_t.number_step, v_t.number_max,
      coalesce(p_visibility, 'invited')
    ) returning * into v_row;
  else
    if p_title is null or p_task_type is null or p_duration_days is null then
      raise exception 'Ad, süre ve tamamlama şekli gerekli' using errcode = '22023', hint = 'challenge_fields_required';
    end if;
    insert into public.challenges (
      created_by, title, task_type, duration_days, start_date, reminder_time, invite_message,
      icon, tint,
      number_unit, number_base_target, number_daily_increment, number_step, number_max, visibility
    ) values (
      p_user, btrim(p_title), p_task_type, p_duration_days, v_start, p_reminder_time,
      nullif(btrim(p_invite_message), ''),
      case when p_icon = any (app.challenge_icons()) then p_icon else 'check' end,
      case when p_tint = any (app.challenge_tints()) then p_tint else 'green' end,
      p_number_unit, p_number_base_target, coalesce(p_number_daily_increment, 0), p_number_step, p_number_max,
      coalesce(p_visibility, 'invited')
    ) returning * into v_row;
  end if;

  insert into public.challenge_members (challenge_id, user_id, role, status, joined_at, joined_on)
  values (v_row.id, p_user, 'owner', 'active', p_at, app.first_checkin_date(p_user, p_at));

  if coalesce(array_length(p_invitees, 1), 0) > 0 then
    perform app.do_invite(p_user, v_row.id, p_invitees, p_at);
  end if;
  return v_row;
end
$$;

create function public.create_challenge(
  p_template uuid default null,
  p_title text default null,
  p_task_type public.task_type default null,
  p_duration_days integer default null,
  p_start_date date default null,
  p_reminder_time time default null,
  p_invite_message text default null,
  p_number_unit text default null,
  p_number_base_target numeric default null,
  p_number_daily_increment numeric default 0,
  p_number_step numeric default null,
  p_number_max numeric default null,
  p_invitees uuid[] default '{}',
  -- Create "Kimler görebilir": 'invited' (Davetliler) ya da 'friends' (Arkadaşlarım)
  p_visibility public.challenge_visibility default 'invited',
  p_icon text default null,
  p_tint text default null
) returns public.challenges
language sql security definer set search_path = '' as $$
  select * from app.do_create_challenge(
    app.require_user(), p_template, p_title, p_task_type, p_duration_days, p_start_date,
    p_reminder_time, p_invite_message, p_number_unit, p_number_base_target,
    p_number_daily_increment, p_number_step, p_number_max, p_invitees, now(), p_visibility, p_icon, p_tint
  )
$$;

-- Yetkiler ------------------------------------------------------------------------------------------

revoke execute on function
  public.queue_diken_notifications(), public.record_push_tickets(jsonb), public.claim_push_receipts(integer),
  public.create_challenge(uuid, text, public.task_type, integer, date, time, text, text, numeric,
                          numeric, numeric, numeric, uuid[], public.challenge_visibility, text, text)
from public, anon, authenticated;
grant execute on function
  public.queue_diken_notifications(), public.record_push_tickets(jsonb), public.claim_push_receipts(integer)
to service_role;
grant execute on function
  public.create_challenge(uuid, text, public.task_type, integer, date, time, text, text, numeric,
                          numeric, numeric, numeric, uuid[], public.challenge_visibility, text, text)
to authenticated;

revoke execute on function
  app.user_settings_ads_consent(), app.weekly_summary_isodow(), app.weekly_summary_time(),
  app.weekly_summary(uuid, timestamptz), app.weekly_summary_text(integer, integer, integer, text),
  app.queue_diken_notifications(timestamptz), app.challenge_icons(), app.challenge_tints(),
  app.do_create_challenge(uuid, uuid, text, public.task_type, integer, date, time, text, text,
                          numeric, numeric, numeric, numeric, uuid[], timestamptz,
                          public.challenge_visibility, text, text)
from public, anon, authenticated;
grant execute on function
  app.user_settings_ads_consent(), app.weekly_summary_isodow(), app.weekly_summary_time(),
  app.weekly_summary(uuid, timestamptz), app.weekly_summary_text(integer, integer, integer, text),
  app.queue_diken_notifications(timestamptz), app.challenge_icons(), app.challenge_tints(),
  app.do_create_challenge(uuid, uuid, text, public.task_type, integer, date, time, text, text,
                          numeric, numeric, numeric, numeric, uuid[], timestamptz,
                          public.challenge_visibility, text, text)
to service_role;
