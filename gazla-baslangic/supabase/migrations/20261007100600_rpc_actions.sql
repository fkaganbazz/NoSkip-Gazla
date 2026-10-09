-- Gazla veri modeli · 7/10 — yazma RPC'leri (istemcinin çağırdığı işlemler).
--
-- Her public fonksiyon çağıranı auth.uid() ile sabitler; zamanı now() ile alır (istemci zamanı
-- değiştiremez). Zamanı parametre alan app.* sürümleri testler ve zamanlanmış işler içindir ve
-- API rollerine kapalıdır.

-- Ortak yardımcılar -------------------------------------------------------------------------

create function app.require_user() returns uuid
language plpgsql stable set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Oturum açman gerekiyor' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'Önce profilini tamamla' using errcode = 'P0001';
  end if;
  return v_uid;
end
$$;

-- URL'de güvenle kullanılabilen rastgele kod (A–Z, a–z, 0–9)
create function app.random_code(p_length integer) returns text
language plpgsql volatile set search_path = '' as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  v_bytes bytea := extensions.gen_random_bytes(p_length);
  v_out text := '';
begin
  for i in 0 .. p_length - 1 loop
    v_out := v_out || substr(v_alphabet, 1 + (get_byte(v_bytes, i) % length(v_alphabet)), 1);
  end loop;
  return v_out;
end
$$;

-- Profil ------------------------------------------------------------------------------------

create function public.is_username_available(p_username text) returns boolean
language sql stable security definer set search_path = '' as $$
  with u as (select lower(btrim(ltrim(btrim(p_username), '@'))) as name)
  select u.name ~ '^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$'
     and not app.is_reserved_username(u.name)
     and not exists (
       select 1 from public.profiles p
       where p.username = u.name::extensions.citext and p.id is distinct from auth.uid()
     )
  from u
$$;

-- Onboarding'in Profil adımı: profil ve ayarları birlikte oluşturur (ya da günceller).
create function public.complete_profile(
  p_username text,
  p_display_name text,
  p_birth_year integer,
  p_timezone text default null,
  p_locale text default null
) returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_row public.profiles;
begin
  if v_uid is null then
    raise exception 'Oturum açman gerekiyor' using errcode = '42501';
  end if;

  insert into public.profiles (id, username, display_name, avatar_tint)
  values (
    v_uid,
    lower(btrim(ltrim(btrim(p_username), '@'))),
    btrim(p_display_name),
    (array['peach', 'lavender', 'mint', 'butter'])[1 + abs(hashtext(v_uid::text)) % 4]
  )
  on conflict (id) do update
    set username = excluded.username, display_name = excluded.display_name
  returning * into v_row;

  -- Tekrar çağrıda (profili düzenle) verilmeyen saat dilimi ve dil korunur; doğum yılı değişmez
  insert into public.user_settings as s (user_id, birth_year, timezone, locale)
  values (v_uid, p_birth_year, coalesce(p_timezone, app.default_timezone()), coalesce(p_locale, 'tr'))
  on conflict (user_id) do update
    set timezone = coalesce(p_timezone, s.timezone), locale = coalesce(p_locale, s.locale);

  return v_row;
end
$$;

-- Kullanıcı adıyla arama: yalnızca "Beni herkes bulabilir" diyenler (ya da zaten ilişkili olanlar),
-- iki yönde de engel yoksa; yalnızca herkese açık alanlar.
create function public.search_profiles(p_query text, p_limit integer default 20)
returns table (
  id uuid, username text, display_name text, avatar_path text, avatar_tint text,
  is_friend boolean, request_pending boolean
)
language sql stable security definer set search_path = '' as $$
  with q as (select lower(btrim(ltrim(btrim(p_query), '@'))) as term, auth.uid() as viewer)
  select p.id, p.username::text, p.display_name, p.avatar_path, p.avatar_tint,
         app.are_friends(q.viewer, p.id),
         app.has_friendship_row(q.viewer, p.id) and not app.are_friends(q.viewer, p.id)
  from q
  join public.profiles p on p.username::text like replace(replace(q.term, '_', '\_'), '%', '\%') || '%'
  left join public.user_settings s on s.user_id = p.id
  where q.viewer is not null
    and char_length(q.term) >= 2
    and p.id <> q.viewer
    and not app.is_blocked(q.viewer, p.id)
    and (coalesce(s.discoverability, 'everyone') = 'everyone' or app.can_see_profile(q.viewer, p.id))
  order by p.username
  limit least(greatest(p_limit, 1), 50)
$$;

-- Arkadaşlık --------------------------------------------------------------------------------

create function public.send_friend_request(p_user uuid) returns public.friendships
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.require_user();
  v_row public.friendships;
begin
  if p_user = v_uid then
    raise exception 'Kendine istek gönderemezsin' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_user) or app.is_blocked(v_uid, p_user) then
    raise exception 'Kullanıcı bulunamadı' using errcode = 'P0002';
  end if;

  select * into v_row from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(v_uid, p_user)
    and greatest(f.requester_id, f.addressee_id) = greatest(v_uid, p_user);

  if found then
    -- Karşı taraf zaten istek göndermişse kabul edilmiş sayılır
    if v_row.status = 'pending' and v_row.addressee_id = v_uid then
      update public.friendships f set status = 'accepted', accepted_at = now()
      where f.id = v_row.id returning * into v_row;
    end if;
    return v_row;
  end if;

  if not (
    coalesce((select s.discoverability from public.user_settings s where s.user_id = p_user), 'everyone') = 'everyone'
    or app.are_co_members(v_uid, p_user)
  ) then
    raise exception 'Kullanıcı bulunamadı' using errcode = 'P0002';
  end if;

  -- Geri çekip yeniden göndererek (her seferinde yeni bildirim) istek yağdırılamasın
  delete from app.friend_request_log l
  where l.requester_id = v_uid and l.created_at <= now() - interval '24 hours';
  if (
    select count(*) from app.friend_request_log l
    where l.requester_id = v_uid and l.addressee_id = p_user
  ) >= app.friend_request_daily_limit() then
    raise exception 'Bu kişiye bugün yeterince istek gönderdin' using errcode = 'P0001';
  end if;

  insert into public.friendships (requester_id, addressee_id)
  values (v_uid, p_user)
  returning * into v_row;
  insert into app.friend_request_log (requester_id, addressee_id) values (v_uid, p_user);
  return v_row;
end
$$;

create function public.accept_friend_request(p_friendship uuid) returns public.friendships
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.require_user();
  v_row public.friendships;
begin
  update public.friendships f
  set status = 'accepted', accepted_at = now()
  where f.id = p_friendship and f.addressee_id = v_uid and f.status = 'pending'
  returning * into v_row;
  if not found then
    raise exception 'İstek bulunamadı' using errcode = 'P0002';
  end if;
  return v_row;
end
$$;

-- Dürtme ------------------------------------------------------------------------------------

create function app.do_send_poke(
  p_sender uuid, p_recipient uuid, p_tone public.poke_tone, p_message_key text,
  p_challenge uuid, p_at timestamptz
) returns public.pokes
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.pokes;
  v_tz text := app.user_timezone(p_recipient);
  v_day date := app.local_date(p_recipient, p_at);
begin
  if p_recipient = p_sender then
    raise exception 'Kendini dürtemezsin' using errcode = 'P0001';
  end if;
  if app.is_blocked(p_sender, p_recipient) then
    raise exception 'Bu kişiyi dürtemezsin' using errcode = 'P0001';
  end if;

  -- Challenge bağlamı yalnızca süren bir challenge: üyelik bitişten sonra da 'active' kalır, ama
  -- alıcının son günü kapandıktan sonra (gece yarısı + tolerans) dürtme gerekçesi olmaz.
  if p_challenge is not null then
    if not (app.is_active_member(p_sender, p_challenge) and app.is_active_member(p_recipient, p_challenge))
       or not exists (
         select 1 from public.challenges c
         where c.id = p_challenge and app.day_closes_at(p_recipient, c.end_date) > p_at
       ) then
      raise exception 'Bu kişiyi dürtemezsin' using errcode = 'P0001';
    end if;
  elsif not app.are_friends(p_sender, p_recipient) then
    raise exception 'Bu kişiyi dürtemezsin' using errcode = 'P0001';
  end if;

  -- Laf sokma yalnızca alıcının sert modu açıksa
  if p_tone = 'roast'
     and not coalesce((select p.harsh_mode from public.profiles p where p.id = p_recipient), false) then
    raise exception 'Sert modu kapalı; sadece gaz verebilirsin' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.poke_messages pm
    where pm.key = p_message_key and pm.tone = p_tone and pm.is_active
  ) then
    raise exception 'Geçersiz mesaj' using errcode = '22023';
  end if;

  -- Aynı kişiye, alıcının yerel gününde en fazla N dürtme. Sınır alıcıyı korur; gönderen kendi
  -- saat dilimini değiştirerek pencereyi sıfırlayamaz. Çift için kilit: eşzamanlı gönderimler
  -- sınırı aşamaz.
  -- Geri alınan dürtme de sayılır (bildirimi ve push'u çoktan gitti): sayım app.poke_log'dan.
  -- Sayım alıcının bütün günü üzerinden (p_at işlemin başlangıcıdır; kilidi önce alan daha geç
  -- başlamış bir işlemin dürtmesini kaçırmamak için üst sınır p_at değil, günün sonu).
  perform pg_advisory_xact_lock(hashtextextended('poke:' || p_sender::text || '>' || p_recipient::text, 0));
  delete from app.poke_log l where l.sender_id = p_sender and l.created_at < p_at - interval '2 days';
  if (
    select count(*) from app.poke_log l
    where l.sender_id = p_sender and l.recipient_id = p_recipient
      and l.created_at >= app.local_day_start(v_tz, v_day)
      and l.created_at < app.local_day_start(v_tz, v_day + 1)
  ) >= app.poke_daily_limit() then
    raise exception 'Bugün bu kişiyi yeterince dürttün' using errcode = 'P0001';
  end if;

  insert into public.pokes (sender_id, recipient_id, challenge_id, tone, message_key, created_at)
  values (p_sender, p_recipient, p_challenge, p_tone, p_message_key, p_at)
  returning * into v_row;
  return v_row;
end
$$;

create function public.send_poke(
  p_recipient uuid, p_tone public.poke_tone, p_message_key text, p_challenge uuid default null
) returns public.pokes
language sql security definer set search_path = '' as $$
  select * from app.do_send_poke(app.require_user(), p_recipient, p_tone, p_message_key, p_challenge, now())
$$;

-- Şikayet -----------------------------------------------------------------------------------

create function public.submit_report(
  p_user uuid,
  p_reason public.report_reason,
  p_details text default null,
  p_also_block boolean default true,
  p_target public.report_target default 'user',
  p_checkin uuid default null,
  p_challenge uuid default null,
  -- Davet linkinden görülen challenge (InviteLanding): üye olmadan şikayet edilebilsin
  p_invite_code text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.require_user();
  v_via_invite boolean := false;
  v_inv public.challenge_invites;
  v_evidence jsonb;
  v_id uuid;
begin
  -- Davet linkinden: istemci (InviteLanding) challenge ve davet edenin id'sini bilmez; ikisi de
  -- koddan alınır. Verilmişlerse koddakiyle aynı olmalı.
  if p_target = 'challenge' and p_invite_code is not null then
    select * into v_inv from public.challenge_invites i where i.code = p_invite_code;
    if found and coalesce(p_challenge, v_inv.challenge_id) = v_inv.challenge_id
       and coalesce(p_user, v_inv.inviter_id) = v_inv.inviter_id then
      p_challenge := v_inv.challenge_id;
      p_user := v_inv.inviter_id;
      v_via_invite := true;
    end if;
  end if;

  if p_user is null or not exists (select 1 from public.profiles p where p.id = p_user) then
    raise exception 'Kullanıcı bulunamadı' using errcode = 'P0002';
  end if;
  if p_user = v_uid then
    raise exception 'Kendini şikayet edemezsin' using errcode = 'P0001';
  end if;

  -- Görünürlük kapısı yok: engel iki yönde de şikayeti engellemez (taciz eden, önce engelleyerek ya
  -- da arkadaşlıktan çıkarak şikayetten kaçamaz) ve sonuç engele bağlı olmamalı; yoksa şikayet,
  -- engellenene engellendiğini söyleyen bir sorgu olurdu. Fotoğraf ve challenge dalları kendi
  -- (engelden bağımsız) ilişki kontrollerini yapar; kötüye kullanıma karşı günlük sınır var.

  if p_target = 'photo' then
    -- Şikayet eden o challenge'da aktif ya da ayrılmış üye (engel sonrası da şikayet edebilsin)
    select jsonb_build_object('photo_path', k.photo_path, 'note', k.note, 'value', k.value,
                              'local_date', k.local_date, 'challenge_id', k.challenge_id)
      into v_evidence
    from public.checkins k
    where k.id = p_checkin and k.user_id = p_user and k.photo_path is not null
      and exists (
        select 1 from public.challenge_members m
        where m.challenge_id = k.challenge_id and m.user_id = v_uid and m.status in ('active', 'left')
      );
    if v_evidence is null then
      raise exception 'Fotoğraf bulunamadı' using errcode = 'P0002';
    end if;
  elsif p_target = 'challenge' then
    -- Şikayet edilen kişi challenge'la ilgili olmalı: kurucusu, davetlisi ya da (eski) üyesi
    if p_challenge is null
       or not (v_via_invite
               or exists (
                 select 1 from public.challenge_members m
                 where m.challenge_id = p_challenge and m.user_id = v_uid
                   and m.status in ('invited', 'active', 'left')
               ))
       or not (
         exists (
           select 1 from public.challenge_members m
           where m.challenge_id = p_challenge and m.user_id = p_user
             and (m.status = 'invited' or m.joined_at is not null)
         )
         or exists (select 1 from public.challenges c where c.id = p_challenge and c.created_by = p_user)
       ) then
      raise exception 'Challenge bulunamadı' using errcode = 'P0002';
    end if;
    select jsonb_build_object('title', c.title, 'invite_message', c.invite_message) into v_evidence
    from public.challenges c where c.id = p_challenge;
  else
    select jsonb_build_object('username', p.username::text, 'display_name', p.display_name,
                              'avatar_path', p.avatar_path)
      into v_evidence
    from public.profiles p where p.id = p_user;
  end if;

  -- Kuyruk doldurulamasın: aynı hedefe açık şikayet tekrarlanmaz (mevcut olan döner, engel yine
  -- uygulanır); 24 saatte en fazla N yeni şikayet. Kilit: eşzamanlı çağrılar sınırı aşamaz.
  perform pg_advisory_xact_lock(hashtextextended('report:' || v_uid::text, 0));
  select r.id into v_id
  from public.reports r
  where r.reporter_id = v_uid and r.reported_user_id = p_user and r.target_type = p_target
    and r.status in ('pending', 'reviewing')
    and r.checkin_id is not distinct from case when p_target = 'photo' then p_checkin end
    and r.challenge_id is not distinct from case when p_target = 'challenge' then p_challenge end
  limit 1;

  if v_id is null then
    if (
      select count(*) from public.reports r
      where r.reporter_id = v_uid and r.created_at > now() - interval '24 hours'
    ) >= app.report_daily_limit() then
      raise exception 'Bugün çok fazla şikayet gönderdin' using errcode = 'P0001';
    end if;

    insert into public.reports (reporter_id, reported_user_id, target_type, checkin_id, challenge_id,
                                reason, details, also_blocked, evidence)
    values (v_uid, p_user, p_target,
            case when p_target = 'photo' then p_checkin end,
            case when p_target = 'challenge' then p_challenge end,
            p_reason, nullif(btrim(p_details), ''), coalesce(p_also_block, false), v_evidence)
    returning id into v_id;
  end if;

  if coalesce(p_also_block, false) then
    insert into public.blocks (blocker_id, blocked_id) values (v_uid, p_user)
    on conflict do nothing;
  end if;
  return v_id;
end
$$;

-- Bildirimler ve push token -------------------------------------------------------------------

-- "Tümü okundu" (p_ids null) ya da seçilenler
create function public.mark_notifications_read(p_ids uuid[] default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  update public.notifications n
  set read_at = now()
  where n.recipient_id = auth.uid() and n.read_at is null
    and (p_ids is null or n.id = any (p_ids));
  get diagnostics v_count = row_count;
  return v_count;
end
$$;

create function public.register_push_token(p_token text, p_platform text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.require_user();
begin
  insert into public.push_tokens (token, user_id, platform)
  values (p_token, v_uid, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, last_seen_at = now();
end
$$;

-- Challenge oluşturma, davet, katılma ----------------------------------------------------------

create function app.active_member_count(p_challenge uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.challenge_members m
  where m.challenge_id = p_challenge and m.status = 'active'
$$;

create function app.assert_challenge_open(p_user uuid, p_challenge uuid, p_at timestamptz) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  -- Kullanıcının işaretleyebileceği gün kalmadıysa (saat dilimi tabanı dahil) bitmiş sayılır
  if (select c.end_date from public.challenges c where c.id = p_challenge) < app.first_checkin_date(p_user, p_at) then
    raise exception 'Bu challenge bitti' using errcode = 'P0001';
  end if;
end
$$;

-- Aynı anda sürdürülen (bitmemiş, aktif) challenge sınırı
create function app.assert_can_take_challenge(p_user uuid, p_at timestamptz) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if (
    select count(*) from public.challenge_members m
    join public.challenges c on c.id = m.challenge_id
    where m.user_id = p_user and m.status = 'active' and c.end_date >= app.local_date(p_user, p_at)
  ) >= app.max_active_challenges() then
    raise exception 'Aynı anda en fazla % challenge sürdürebilirsin', app.max_active_challenges()
      using errcode = 'P0001';
  end if;
end
$$;

-- Arkadaşları davet eder (davetli olarak; "Katıl" ile aktif olurlar)
create function app.do_invite(p_inviter uuid, p_challenge uuid, p_users uuid[], p_at timestamptz)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
  v_count integer := 0;
  v_status public.member_status;
begin
  -- Challenge başına kilit: eşzamanlı davet/katılma üye sınırını aşamaz
  perform 1 from public.challenges c where c.id = p_challenge for no key update;
  if not app.is_active_member(p_inviter, p_challenge) then
    raise exception 'Bu challenge''a davet edemezsin' using errcode = '42501';
  end if;
  perform app.assert_challenge_open(p_inviter, p_challenge, p_at);

  foreach v_user in array coalesce(p_users, '{}'::uuid[]) loop
    if v_user = p_inviter or not app.are_friends(p_inviter, v_user) or app.is_blocked(p_inviter, v_user) then
      raise exception 'Yalnızca arkadaşlarını davet edebilirsin' using errcode = 'P0001';
    end if;

    select m.status into v_status from public.challenge_members m
    where m.challenge_id = p_challenge and m.user_id = v_user;

    -- Ayrılan üye geri alınmaz (ayrılmak kalıcı)
    if v_status in ('active', 'invited', 'left') then
      continue;
    end if;
    -- Reddedilen davet hemen yeniden gönderilip bildirim yağdırılamasın: challenge başına kişiye
    -- 24 saatte en fazla N davet bildirimi (ilk davet dahil); fazlası sessizce atlanır. Challenge
    -- kilidi altında sayılır; bildirimleri alıcı silemez.
    if v_status = 'declined' and (
      select count(*) from public.notifications n
      where n.recipient_id = v_user and n.kind = 'challenge_invite' and n.challenge_id = p_challenge
        and n.created_at > p_at - interval '24 hours'
    ) >= app.challenge_invite_daily_limit() then
      continue;
    end if;

    if (select count(*) from public.challenge_members m
        where m.challenge_id = p_challenge and m.status in ('active', 'invited')) >= app.max_members() then
      raise exception 'Grup dolu' using errcode = 'P0001';
    end if;

    if v_status is null then
      insert into public.challenge_members (challenge_id, user_id, status, invited_by)
      values (p_challenge, v_user, 'invited', p_inviter);
    else
      -- Daha önce reddetmiş: yeniden davet
      update public.challenge_members m
      set status = 'invited', invited_by = p_inviter
      where m.challenge_id = p_challenge and m.user_id = v_user;
      insert into public.notifications (recipient_id, kind, actor_id, challenge_id, local_date)
      values (v_user, 'challenge_invite', p_inviter, p_challenge, app.local_date(v_user, p_at));
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end
$$;

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
  p_at timestamptz
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
    raise exception 'Başlangıç günü bugün ile 7 gün sonrası arasında olmalı' using errcode = '22023';
  end if;
  perform app.assert_can_take_challenge(p_user, p_at);

  if p_template is not null then
    select * into v_t from public.challenge_templates t where t.id = p_template and t.is_active;
    if not found then
      raise exception 'Şablon bulunamadı' using errcode = 'P0002';
    end if;
    insert into public.challenges (
      template_id, created_by, title, short_title, task_type, duration_days, start_date,
      reminder_time, invite_message, category, icon, tint,
      number_unit, number_base_target, number_daily_increment, number_step, number_max
    ) values (
      v_t.id, p_user,
      case when v_locale = 'en' then coalesce(v_t.title_en, v_t.title_tr) else v_t.title_tr end,
      case when v_locale = 'en' then coalesce(v_t.short_title_en, v_t.short_title_tr) else v_t.short_title_tr end,
      v_t.task_type, coalesce(p_duration_days, v_t.default_duration_days), v_start,
      p_reminder_time, nullif(btrim(p_invite_message), ''), v_t.category, v_t.icon, v_t.tint,
      v_t.number_unit, v_t.number_base_target, v_t.number_daily_increment, v_t.number_step, v_t.number_max
    ) returning * into v_row;
  else
    if p_title is null or p_task_type is null or p_duration_days is null then
      raise exception 'Ad, süre ve tamamlama şekli gerekli' using errcode = '22023';
    end if;
    insert into public.challenges (
      created_by, title, task_type, duration_days, start_date, reminder_time, invite_message,
      number_unit, number_base_target, number_daily_increment, number_step, number_max
    ) values (
      p_user, btrim(p_title), p_task_type, p_duration_days, v_start, p_reminder_time,
      nullif(btrim(p_invite_message), ''),
      p_number_unit, p_number_base_target, coalesce(p_number_daily_increment, 0), p_number_step, p_number_max
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
  p_invitees uuid[] default '{}'
) returns public.challenges
language sql security definer set search_path = '' as $$
  select * from app.do_create_challenge(
    app.require_user(), p_template, p_title, p_task_type, p_duration_days, p_start_date,
    p_reminder_time, p_invite_message, p_number_unit, p_number_base_target,
    p_number_daily_increment, p_number_step, p_number_max, p_invitees, now()
  )
$$;

create function public.invite_to_challenge(p_challenge uuid, p_users uuid[]) returns integer
language sql security definer set search_path = '' as $$
  select app.do_invite(app.require_user(), p_challenge, p_users, now())
$$;

create function app.do_respond_to_invite(p_user uuid, p_challenge uuid, p_accept boolean, p_at timestamptz)
returns public.challenge_members
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.challenge_members;
begin
  -- Kilit sırası her yerde aynı: önce challenge, sonra üye satırı
  perform 1 from public.challenges c where c.id = p_challenge for no key update;
  select * into v_row from public.challenge_members m
  where m.challenge_id = p_challenge and m.user_id = p_user and m.status = 'invited'
  for update;
  if not found then
    raise exception 'Davet bulunamadı' using errcode = 'P0002';
  end if;

  if p_accept then
    -- Davetten sonra aralarına engel girdiyse davet geçersiz (link yolu da reddeder)
    if app.is_blocked(p_user, v_row.invited_by) then
      raise exception 'Davet bulunamadı' using errcode = 'P0002';
    end if;
    perform app.assert_challenge_open(p_user, p_challenge, p_at);
    if app.active_member_count(p_challenge) >= app.max_members() then
      raise exception 'Grup dolu' using errcode = 'P0001';
    end if;
    perform app.assert_can_take_challenge(p_user, p_at);
    update public.challenge_members m
    set status = 'active', joined_at = p_at, joined_on = app.first_checkin_date(p_user, p_at)
    where m.challenge_id = p_challenge and m.user_id = p_user
    returning * into v_row;
  else
    update public.challenge_members m set status = 'declined'
    where m.challenge_id = p_challenge and m.user_id = p_user
    returning * into v_row;
  end if;
  return v_row;
end
$$;

create function public.respond_to_invite(p_challenge uuid, p_accept boolean) returns public.challenge_members
language sql security definer set search_path = '' as $$
  select * from app.do_respond_to_invite(app.require_user(), p_challenge, p_accept, now())
$$;

create function app.do_leave_challenge(p_user uuid, p_challenge uuid, p_at timestamptz)
returns public.challenge_members
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.challenge_members;
begin
  -- Kilit sırası: önce challenge (eşzamanlı kabul/katılma ile sıralı)
  perform 1 from public.challenges c where c.id = p_challenge for no key update;
  -- Son günü geçmiş challenge'dan ayrılınmaz: sonuç (bitiş, bahçe, sıra) kaydedilecek
  if (select c.end_date from public.challenges c where c.id = p_challenge) < app.local_date(p_user, p_at)
     and app.is_active_member(p_user, p_challenge) then
    raise exception 'Bu challenge bitti' using errcode = 'P0001';
  end if;
  -- Bitmiş (sonucu kaydedilmiş) üyelikten ayrılınmaz: sonuç ve bahçe geçmişi korunur
  update public.challenge_members m
  set status = 'left', left_on = app.local_date(p_user, p_at)
  where m.challenge_id = p_challenge and m.user_id = p_user and m.status = 'active'
    and m.finished_at is null
  returning * into v_row;
  if not found then
    raise exception 'Bu challenge''da değilsin' using errcode = 'P0002';
  end if;
  return v_row;
end
$$;

create function public.leave_challenge(p_challenge uuid) returns public.challenge_members
language sql security definer set search_path = '' as $$
  select * from app.do_leave_challenge(app.require_user(), p_challenge, now())
$$;

-- Davet linki: her üyenin challenge başına bir kodu
create function public.create_invite(p_challenge uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.require_user();
  v_code text;
  v_constraint text;
begin
  if not app.is_active_member(v_uid, p_challenge) then
    raise exception 'Bu challenge''a davet edemezsin' using errcode = '42501';
  end if;
  perform app.assert_challenge_open(v_uid, p_challenge, now());

  for v_attempt in 1 .. 10 loop
    -- Her turda yeniden oku: eşzamanlı çağrı (çift dokunma, iki cihaz) az önce eklemiş olabilir
    select i.code into v_code from public.challenge_invites i
    where i.challenge_id = p_challenge and i.inviter_id = v_uid and i.revoked_at is null;
    if found then
      return v_code;
    end if;

    begin
      insert into public.challenge_invites (code, challenge_id, inviter_id)
      values (app.random_code(10), p_challenge, v_uid)
      on conflict (challenge_id, inviter_id) where revoked_at is null do nothing
      returning code into v_code;
      if found then
        return v_code;
      end if;
    exception when unique_violation then
      -- Yalnızca (çok düşük olasılıklı) kod çakışmasında yeniden dene
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint is distinct from 'challenge_invites_pkey' then
        raise;
      end if;
    end;
  end loop;
  raise exception 'Davet linki oluşturulamadı, tekrar dene' using errcode = 'P0001';
end
$$;

-- p_code yoksa çağıranın kendi linki kapanır. p_code verilirse o link kapanır: linkin sahibi ya da
-- challenge sahibi (örneğin bir üyenin herkese açık paylaştığı linki) kapatabilir.
create function public.revoke_invite(p_challenge uuid, p_code text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.require_user();
begin
  if p_code is null then
    update public.challenge_invites i set revoked_at = now()
    where i.challenge_id = p_challenge and i.inviter_id = v_uid and i.revoked_at is null;
    return;
  end if;

  update public.challenge_invites i set revoked_at = coalesce(i.revoked_at, now())
  where i.code = p_code and i.challenge_id = p_challenge
    and (i.inviter_id = v_uid
         or exists (
           select 1 from public.challenge_members m
           where m.challenge_id = p_challenge and m.user_id = v_uid and m.role = 'owner'
         ));
  if not found then
    raise exception 'Davet linki bulunamadı' using errcode = 'P0002';
  end if;
end
$$;

create function app.do_join_by_invite(p_user uuid, p_code text, p_at timestamptz)
returns public.challenge_members
language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.challenge_invites;
  v_row public.challenge_members;
begin
  -- Önce kilit, sonra doğrulama: son üyenin ayrılması (linkleri kapatır) ile yarışmasın
  perform 1 from public.challenges c
  where c.id = (select i.challenge_id from public.challenge_invites i where i.code = p_code)
  for no key update;
  select * into v_inv from public.challenge_invites i where i.code = p_code and i.revoked_at is null;
  if not found or app.is_blocked(p_user, v_inv.inviter_id)
     or not app.is_active_member(v_inv.inviter_id, v_inv.challenge_id) then
    raise exception 'Davet linki geçersiz' using errcode = 'P0002';
  end if;
  perform app.assert_challenge_open(p_user, v_inv.challenge_id, p_at);

  select * into v_row from public.challenge_members m
  where m.challenge_id = v_inv.challenge_id and m.user_id = p_user
  for update;
  if found and v_row.status = 'active' then
    return v_row;
  end if;
  -- Ayrılan geri dönemez: dönüş katılma gününü bugüne çekip kaçırdığı günleri seriden silerdi
  if found and v_row.status = 'left' then
    raise exception 'Ayrıldığın challenge''a tekrar katılamazsın' using errcode = 'P0001';
  end if;

  if app.active_member_count(v_inv.challenge_id) >= app.max_members() then
    raise exception 'Grup dolu' using errcode = 'P0001';
  end if;
  perform app.assert_can_take_challenge(p_user, p_at);

  -- Yeni üye ya da bekleyen/reddedilmiş davetli
  insert into public.challenge_members (challenge_id, user_id, status, invited_by, joined_at, joined_on)
  values (v_inv.challenge_id, p_user, 'active', v_inv.inviter_id, p_at, app.first_checkin_date(p_user, p_at))
  on conflict (challenge_id, user_id) do update
    set status = 'active', invited_by = excluded.invited_by,
        joined_at = excluded.joined_at, joined_on = excluded.joined_on
  returning * into v_row;
  return v_row;
end
$$;

create function public.join_challenge_by_invite(p_code text) returns public.challenge_members
language sql security definer set search_path = '' as $$
  select * from app.do_join_by_invite(app.require_user(), p_code, now())
$$;

-- İşaretleme --------------------------------------------------------------------------------

create function app.do_checkin(
  p_user uuid, p_challenge uuid, p_value numeric, p_photo_path text, p_note text,
  p_local_date date, p_at timestamptz
) returns public.checkins
language plpgsql security definer set search_path = '' as $$
declare
  v_c public.challenges;
  v_day date := coalesce(p_local_date, app.local_date(p_user, p_at));
  v_range record;
  v_row public.checkins;
begin
  -- JS sayılarındaki kayan nokta kırıntısı (0.30000000000000004) reddedilmesin: 4 ondalığa yuvarla
  p_value := trim_scale(round(p_value, 4));
  if not app.is_active_member(p_user, p_challenge) then
    raise exception 'Bu challenge''da değilsin' using errcode = '42501';
  end if;
  if not (v_day = any (app.checkin_dates(p_user, p_at))) then
    raise exception 'Bu gün artık işaretlenemez' using errcode = 'P0001';
  end if;

  select * into v_range from app.member_range(p_user, p_challenge);
  if v_day < v_range.range_start or v_day > v_range.range_end then
    raise exception 'Challenge bu gün sürmüyor' using errcode = 'P0001';
  end if;

  select * into v_c from public.challenges c where c.id = p_challenge;
  case v_c.task_type
    when 'check' then
      if p_value is not null or p_photo_path is not null then
        raise exception 'Bu görev tek dokunuşla işaretlenir' using errcode = '22023';
      end if;
    when 'number' then
      -- NaN ve sonsuz da bu karşılaştırmalarda elenir
      if p_value is null or not (p_value >= 0 and p_value <= 1000000000) or scale(p_value) > 4
         or (v_c.number_max is not null and p_value > v_c.number_max) then
        raise exception 'Geçersiz değer' using errcode = '22023';
      end if;
      if p_photo_path is not null then
        raise exception 'Bu görev sayı ile işaretlenir' using errcode = '22023';
      end if;
    when 'photo' then
      -- Dosya proofs kovasına gerçekten yüklenmiş olmalı (önce yükle, sonra işaretle)
      if p_photo_path is null or p_photo_path not like p_user::text || '/' || p_challenge::text || '/%'
         or not exists (
           select 1 from storage.objects o where o.bucket_id = 'proofs' and o.name = p_photo_path
         ) then
        raise exception 'Fotoğraf kanıtı gerekli' using errcode = '22023';
      end if;
      -- Her gün yeni kanıt: başka bir günün işaretlemesine bağlı dosya kullanılamaz
      if exists (
        select 1 from public.checkins k
        where k.photo_path = p_photo_path and k.local_date <> v_day
      ) then
        raise exception 'Bu fotoğraf başka bir gün için gönderildi' using errcode = '22023';
      end if;
      if p_value is not null then
        raise exception 'Bu görev fotoğrafla işaretlenir' using errcode = '22023';
      end if;
  end case;

  -- Aynı gün tekrar gönderilirse (çevrimdışı kuyruk, değer düzeltme) günceller
  insert into public.checkins (user_id, challenge_id, local_date, value, photo_path, note, created_at)
  values (p_user, p_challenge, v_day, p_value, p_photo_path, nullif(btrim(p_note), ''), p_at)
  on conflict (user_id, challenge_id, local_date) do update
    set value = excluded.value, photo_path = excluded.photo_path, note = excluded.note
  returning * into v_row;
  return v_row;
end
$$;

create function public.checkin(
  p_challenge uuid,
  p_value numeric default null,
  p_photo_path text default null,
  p_note text default null,
  p_local_date date default null
) returns public.checkins
language sql security definer set search_path = '' as $$
  select * from app.do_checkin(app.require_user(), p_challenge, p_value, p_photo_path, p_note, p_local_date, now())
$$;

create function app.do_undo_checkin(p_user uuid, p_challenge uuid, p_local_date date, p_at timestamptz)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_day date := coalesce(p_local_date, app.local_date(p_user, p_at));
begin
  if not (v_day = any (app.checkin_dates(p_user, p_at))) then
    raise exception 'Geçmiş günler değiştirilemez' using errcode = 'P0001';
  end if;
  delete from public.checkins k
  where k.user_id = p_user and k.challenge_id = p_challenge and k.local_date = v_day;
  return found;
end
$$;

create function public.undo_checkin(p_challenge uuid, p_local_date date default null) returns boolean
language sql security definer set search_path = '' as $$
  select app.do_undo_checkin(app.require_user(), p_challenge, p_local_date, now())
$$;

-- Seri kurtarma ----------------------------------------------------------------------------------

-- Ücretsiz hak (ayda 1). Reklamla kurtarma yalnızca sunucuda doğrulanmış ödülle (grant_ad_rescue).
create function public.rescue_streak(p_challenge uuid, p_missed_date date) returns public.streak_rescues
language sql security definer set search_path = '' as $$
  select * from app.apply_rescue(app.require_user(), p_challenge, p_missed_date, 'free', null, now())
$$;

-- AdMob sunucu doğrulamasından (SSV) sonra Edge Function çağırır; yalnızca service role.
-- Yeniden denenen (ya da eşzamanlı yinelenen) aynı geri çağrı hata değil, mevcut satırı döndürür;
-- aynı ödül başka bir kurtarma için kullanılamaz (23505).
create function public.grant_ad_rescue(
  p_user uuid, p_challenge uuid, p_missed_date date, p_ad_reward_id text
) returns public.streak_rescues
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.streak_rescues;
begin
  if p_ad_reward_id is null or char_length(p_ad_reward_id) not between 8 and 200 then
    raise exception 'Geçersiz ödül kimliği' using errcode = '22023';
  end if;

  select * into v_row from public.streak_rescues r where r.ad_reward_id = p_ad_reward_id;
  if found then
    if (v_row.user_id, v_row.challenge_id, v_row.rescued_date) = (p_user, p_challenge, p_missed_date) then
      return v_row;
    end if;
    raise exception 'Bu ödül zaten kullanıldı' using errcode = '23505';
  end if;

  begin
    return app.apply_rescue(p_user, p_challenge, p_missed_date, 'ad', p_ad_reward_id, now());
  exception when unique_violation then
    -- Aynı ödülün eşzamanlı ikinci çağrısı: diğeri kaydetti
    select * into v_row from public.streak_rescues r
    where r.ad_reward_id = p_ad_reward_id
      and r.user_id = p_user and r.challenge_id = p_challenge and r.rescued_date = p_missed_date;
    if found then
      return v_row;
    end if;
    raise;
  end;
end
$$;
