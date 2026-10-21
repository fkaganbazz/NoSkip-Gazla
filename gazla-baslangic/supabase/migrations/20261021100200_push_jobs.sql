-- Gazla veri modeli · 14/14 — bildirim gönderimi (Edge Function `push`) ve zamanlanmış işler.
--
-- İki tür push var:
-- 1. Arkadaş bildirimleri (actor_id dolu: dürt, gaz, arkadaşlık isteği, challenge daveti, arkadaşın
--    bitirdi): satırı mevcut tetikleyiciler ekler; bu migration'daki tetikleyici satırı Edge Function
--    `push`'a gönderir (pg_net; Database Webhook biçiminde). Fonksiyon `claim_social_push` ile hakkı
--    alır: alıcı dürtme bildirimlerini kapattıysa (poke_push_enabled) dürtme push'u gitmez; aynı satır
--    iki kez gönderilmez (pushed_at). Diken sınırına sayılmaz.
-- 2. Diken bildirimleri (actor_id null): Edge Function `push` 15 dakikada bir (pg_cron + pg_net)
--    `queue_diken_notifications()` çağırır. Kurallar burada, kullanıcının yerel saatinde:
--    - günlük hatırlatma: user_settings.daily_reminder_time (bugün bekleyen görev varsa)
--    - challenge hatırlatması: app.member_reminder_time (kişisel saat, yoksa grubun saati; o challenge
--      bugün işaretlenmediyse; saat genel hatırlatmayla aynıysa genel olan yeter)
--    - gün bitiyor: 22:00 ("gün bitimine 2 saat kala"; bekleyen görev varsa, sayısıyla)
--    - seri koptu: 09:00 ("ertesi sabah"; bekleyen kurtarma varsa)
--    Her biri günde bir kez (app.diken_schedule_log), hedef saatten sonraki 1 saat içinde; sessiz saatler
--    (23:30–08:00) ve günde en çok 2 kuralı claim_diken_push'ta (atomik). Hakkı alınamayan bildirim satırı
--    eklenmez (sonraki turda pencere içindeyse yeniden denenir).
--    Metinler design/Notifications.dc.html (src/features/settings/notificationCopy.ts); satırın
--    payload.text'inde saklanır, Aktivite de aynı metni gösterir.
--
-- pg_cron / pg_net / Vault yoksa (yerel test ortamı) tetikleyici ve iş kurulumu sessizce atlanır;
-- uzantılar sonradan açılırsa `select app.install_cron_jobs();` yeniden çalıştırılır (supabase/README.md).

-- Diken metinleri ve saatleri -----------------------------------------------------------------------

create function app.diken_text(p_kind public.notification_kind, p_count integer default null, p_title text default null)
returns text
language sql immutable parallel safe set search_path = '' as $$
  select case p_kind
    when 'daily_reminder' then
      case when p_title is null then 'Su yok mu su? Bugünkü görevlerin seni bekliyor.'
           else format('Su yok mu su? %s seni bekliyor.', p_title) end
    when 'day_ending' then format('Gün bitiyor, %s görevin duruyor. Susuz kaldım burada.', coalesce(p_count, 1))
    when 'streak_broken' then 'Dün kaçtı. Beni sulamak için 24 saatin var.'
  end
$$;

-- "Gün bitimine 2 saat kala" (yerel gece yarısından 2 saat önce)
create function app.day_ending_time() returns time
language sql immutable parallel safe as $$ select time '22:00' $$;
-- "Seri koptu (ertesi sabah 09:00)"
create function app.streak_broken_time() returns time
language sql immutable parallel safe as $$ select time '09:00' $$;
-- Hedef saatten sonra gönderilebilen süre (zamanlayıcı 15 dakikada bir; kaçan tur telafi edilir)
create function app.diken_push_window() returns interval
language sql immutable parallel safe as $$ select interval '1 hour' $$;

create function app.in_diken_window(p_local time, p_target time) returns boolean
language sql immutable parallel safe set search_path = '' as $$
  select p_target is not null and p_local >= p_target and p_local - p_target < app.diken_push_window()
$$;

-- Aynı Diken bildirimi günde bir kez (kullanıcı, tür, yerel gün, challenge)
create table app.diken_schedule_log (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.notification_kind not null,
  local_date date not null,
  challenge_key uuid not null default '00000000-0000-0000-0000-000000000000',
  notification_id uuid,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, local_date, challenge_key)
);
alter table app.diken_schedule_log enable row level security;
revoke all on app.diken_schedule_log from public, anon, authenticated;

-- Bir Diken bildirimini kaydet ve gönderim hakkını al. Bugün zaten kaydedildiyse ya da hak yoksa
-- (sessiz saat, günde 2) null; hak yoksa satır geri alınır ki pencere içinde sonra denensin.
create function app.queue_diken(
  p_user uuid, p_kind public.notification_kind, p_day date, p_challenge uuid, p_payload jsonb, p_at timestamptz
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_key uuid := coalesce(p_challenge, '00000000-0000-0000-0000-000000000000'::uuid);
  v_id uuid;
begin
  insert into app.diken_schedule_log (user_id, kind, local_date, challenge_key, created_at)
  values (p_user, p_kind, p_day, v_key, p_at)
  on conflict do nothing;
  if not found then
    return null;
  end if;

  insert into public.notifications (recipient_id, kind, challenge_id, payload, local_date, created_at)
  values (p_user, p_kind, p_challenge, p_payload, p_day, p_at)
  returning id into v_id;

  if not app.claim_diken_push(v_id, p_at) then
    delete from public.notifications n where n.id = v_id;
    delete from app.diken_schedule_log l
    where l.user_id = p_user and l.kind = p_kind and l.local_date = p_day and l.challenge_key = v_key;
    return null;
  end if;

  update app.diken_schedule_log l set notification_id = v_id
  where l.user_id = p_user and l.kind = p_kind and l.local_date = p_day and l.challenge_key = v_key;
  return v_id;
end
$$;

-- Bugün (yerel) işaretlenmesi beklenen challenge'lar: aktif üyelik, gün challenge aralığında ve hâlâ
-- işaretlenebilir, kapsanmamış. Kısa ad varsa o (bildirim metni), etkin hatırlatma saatiyle.
create function app.diken_pending_challenges(p_user uuid, p_at timestamptz)
returns table (challenge_id uuid, title text, remind_at time)
language sql stable security definer set search_path = '' as $$
  with d as (select app.local_date(p_user, p_at) as today, app.checkin_dates(p_user, p_at) as open)
  select m.challenge_id, coalesce(c.short_title, c.title), app.member_reminder_time(p_user, m.challenge_id)
  from d
  join public.challenge_members m on m.user_id = p_user and m.status = 'active'
  join public.challenges c on c.id = m.challenge_id
  where d.today between greatest(c.start_date, coalesce(m.joined_on, c.start_date)) and c.end_date
    and d.today = any (d.open)
    and not app.is_covered(p_user, m.challenge_id, d.today)
$$;

-- Şu an gönderilecek Diken bildirimleri: satırları ekler, hakkı alır, gönderilecekleri token'larıyla
-- döner (Edge Function `push` Expo'ya iletir). Push token'ı olmayan kullanıcıya satır eklenmez.
create function app.queue_diken_notifications(p_at timestamptz)
returns table (
  notification_id uuid, recipient_id uuid, kind public.notification_kind, challenge_id uuid,
  body text, url text, tokens text[]
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
begin
  delete from app.diken_schedule_log l where l.local_date < (p_at at time zone 'UTC')::date - 3;

  for u in
    select s.user_id, s.daily_reminder_time
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
    if app.in_diken_window(v_time, app.streak_broken_time()) then
      select pr.challenge_id into v_rescue
      from app.pending_rescues(u.user_id, p_at) pr
      order by pr.streak_before desc, pr.challenge_id
      limit 1;
    end if;
    if v_rescue is not null then
      v_text := app.diken_text('streak_broken');
      v_url := '/streak-lost/' || v_rescue;
      v_id := app.queue_diken(u.user_id, 'streak_broken', v_today, null,
                              jsonb_build_object('text', v_text, 'url', v_url), p_at);
      if v_id is not null then
        notification_id := v_id; recipient_id := u.user_id; kind := 'streak_broken'; challenge_id := null;
        body := v_text; url := v_url;
        tokens := array(select pt.token from public.push_tokens pt where pt.user_id = u.user_id order by pt.last_seen_at desc);
        return next;
      end if;
    end if;

    -- Genel günlük hatırlatma
    if v_pending > 0 and app.in_diken_window(v_time, u.daily_reminder_time) then
      v_text := app.diken_text('daily_reminder');
      v_url := '/';
      v_id := app.queue_diken(u.user_id, 'daily_reminder', v_today, null,
                              jsonb_build_object('text', v_text, 'url', v_url), p_at);
      if v_id is not null then
        notification_id := v_id; recipient_id := u.user_id; kind := 'daily_reminder'; challenge_id := null;
        body := v_text; url := v_url;
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
      v_text := app.diken_text('daily_reminder', null, t.title);
      v_url := '/challenge/' || t.challenge_id;
      v_id := app.queue_diken(u.user_id, 'daily_reminder', v_today, t.challenge_id,
                              jsonb_build_object('text', v_text, 'url', v_url, 'title', t.title), p_at);
      if v_id is not null then
        notification_id := v_id; recipient_id := u.user_id; kind := 'daily_reminder'; challenge_id := t.challenge_id;
        body := v_text; url := v_url;
        tokens := array(select pt.token from public.push_tokens pt where pt.user_id = u.user_id order by pt.last_seen_at desc);
        return next;
      end if;
    end loop;

    -- Gün bitiyor
    if v_pending > 0 and app.in_diken_window(v_time, app.day_ending_time()) then
      v_text := app.diken_text('day_ending', v_pending);
      v_url := '/';
      v_id := app.queue_diken(u.user_id, 'day_ending', v_today, null,
                              jsonb_build_object('text', v_text, 'url', v_url, 'pending', v_pending), p_at);
      if v_id is not null then
        notification_id := v_id; recipient_id := u.user_id; kind := 'day_ending'; challenge_id := null;
        body := v_text; url := v_url;
        tokens := array(select pt.token from public.push_tokens pt where pt.user_id = u.user_id order by pt.last_seen_at desc);
        return next;
      end if;
    end if;
  end loop;
end
$$;

create function public.queue_diken_notifications()
returns table (
  notification_id uuid, recipient_id uuid, kind public.notification_kind, challenge_id uuid,
  body text, url text, tokens text[]
)
language sql security definer set search_path = '' as $$
  select * from app.queue_diken_notifications(now())
$$;

-- Arkadaş bildirimleri ----------------------------------------------------------------------------

-- Arkadaş bildiriminin push'u: gönderilecekse pushed_at'i işaretler ve metin için gerekenleri döner
-- (aktörün adı, dürtme metni, challenge adı, alıcının token'ları); gönderilmeyecekse null.
create function app.claim_social_push(p_notification uuid, p_at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v record;
begin
  select n.id, n.recipient_id, n.kind, n.actor_id, n.challenge_id, n.payload,
         ap.display_name as actor_name, c.title as challenge_title, pm.text_tr as poke_text,
         coalesce(s.poke_push_enabled, true) as poke_push_enabled
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
  if app.is_blocked(v.recipient_id, v.actor_id) then
    return null;
  end if;

  update public.notifications n set pushed_at = p_at where n.id = p_notification;
  return jsonb_build_object(
    'notification_id', v.id,
    'recipient_id', v.recipient_id,
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

create function public.claim_social_push(p_notification uuid) returns jsonb
language sql security definer set search_path = '' as $$
  select app.claim_social_push(p_notification, now())
$$;

-- Edge Function çağrısı (pg_net + Vault) ------------------------------------------------------------

-- Vault'taki `gazla_project_url` (https://<ref>.supabase.co) ve `gazla_push_secret` (Edge Function'ın
-- PUSH_WEBHOOK_SECRET'ı) ile Edge Function'a POST. pg_net, Vault ya da sırlar yoksa null (iş sessizce
-- atlanır). İstek eşzamansızdır (pg_net kuyruğu); işlem geri alınırsa gitmez.
create function app.call_edge_function(p_name text, p_body jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_url text;
  v_secret text;
  v_id bigint;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_net')
     or to_regclass('vault.decrypted_secrets') is null then
    return null;
  end if;
  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1 limit 1'
    into v_url using 'gazla_project_url';
  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1 limit 1'
    into v_secret using 'gazla_push_secret';
  if v_url is null or v_secret is null then
    return null;
  end if;
  execute 'select net.http_post(url := $1, body := $2, headers := $3, timeout_milliseconds := $4)'
    into v_id
    using rtrim(v_url, '/') || '/functions/v1/' || p_name, p_body,
          jsonb_build_object('Content-Type', 'application/json', 'x-gazla-secret', v_secret), 10000;
  return v_id;
exception when others then
  -- Bildirim gönderilemedi diye asıl işlem (dürtme, istek …) bozulmasın
  raise warning 'gazla: % Edge Function çağrılamadı: %', p_name, sqlerrm;
  return null;
end
$$;

-- notifications INSERT → Edge Function `push` (Supabase Database Webhook ile aynı gövde)
create function app.notifications_push_webhook() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform app.call_edge_function('push', jsonb_build_object(
    'type', 'INSERT', 'table', 'notifications', 'schema', 'public', 'record', to_jsonb(new), 'old_record', null
  ));
  return null;
end
$$;

create trigger notifications_push_webhook
  after insert on public.notifications
  for each row when (new.actor_id is not null)
  execute function app.notifications_push_webhook();

-- Zamanlanmış işler (pg_cron) -------------------------------------------------------------------

-- Kurulu işlerin adları. pg_cron yoksa boş; pg_net yoksa yalnızca challenge bitişi. Aynı adla yeniden
-- çağırmak işi günceller (pg_cron ≥ 1.4).
create function app.install_cron_jobs() returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  v_jobs text[] := '{}';
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'gazla: pg_cron kurulu değil, zamanlanmış işler eklenmedi';
    return v_jobs;
  end if;
  execute $q$select cron.schedule('gazla-finish-due-challenges', '7 * * * *',
                                  'select public.finish_due_challenges()')$q$;
  v_jobs := v_jobs || 'gazla-finish-due-challenges'::text;
  if exists (select 1 from pg_extension where extname = 'pg_net') then
    execute $q$select cron.schedule('gazla-diken-push', '*/15 * * * *',
                                    $job$select app.call_edge_function('push', '{"mode":"schedule"}'::jsonb)$job$)$q$;
    v_jobs := v_jobs || 'gazla-diken-push'::text;
  else
    raise notice 'gazla: pg_net kurulu değil, Diken bildirim işi eklenmedi';
  end if;
  return v_jobs;
end
$$;

do $$
begin
  perform app.install_cron_jobs();
exception when others then
  raise warning 'gazla: zamanlanmış işler kurulamadı: %', sqlerrm;
end
$$;

-- Yetkiler ------------------------------------------------------------------------------------------

revoke execute on function public.queue_diken_notifications(), public.claim_social_push(uuid)
  from public, anon, authenticated;
grant execute on function public.queue_diken_notifications(), public.claim_social_push(uuid) to service_role;

revoke execute on function
  app.diken_text(public.notification_kind, integer, text), app.day_ending_time(), app.streak_broken_time(),
  app.diken_push_window(), app.in_diken_window(time, time), app.diken_pending_challenges(uuid, timestamptz),
  app.queue_diken(uuid, public.notification_kind, date, uuid, jsonb, timestamptz),
  app.queue_diken_notifications(timestamptz), app.claim_social_push(uuid, timestamptz),
  app.call_edge_function(text, jsonb), app.notifications_push_webhook(), app.install_cron_jobs()
from public, anon, authenticated;
grant execute on function
  app.diken_text(public.notification_kind, integer, text), app.day_ending_time(), app.streak_broken_time(),
  app.diken_push_window(), app.in_diken_window(time, time), app.diken_pending_challenges(uuid, timestamptz),
  app.queue_diken(uuid, public.notification_kind, date, uuid, jsonb, timestamptz),
  app.queue_diken_notifications(timestamptz), app.claim_social_push(uuid, timestamptz),
  app.call_edge_function(text, jsonb), app.notifications_push_webhook(), app.install_cron_jobs()
to service_role;
