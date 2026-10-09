-- Gazla veri modeli · 3/10 — arkadaşlık, engelleme, şikayet, dürtme, bildirim, push token.

-- Arkadaşlık -------------------------------------------------------------------------------
-- Reddetme ("İsteği sil") ve arkadaşlıktan çıkarma satırı siler; ayrı "reddedildi" durumu yok.

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint friendships_not_self check (requester_id <> addressee_id),
  constraint friendships_accepted_at check ((status = 'accepted') = (accepted_at is not null))
);

-- Her kullanıcı çifti için tek satır (yönden bağımsız)
create unique index friendships_pair_key
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id, status);

-- Gönderilen istek kaydı: istek silinse (geri çekme, reddetme) de kalır; send_friend_request aynı
-- kişiye 24 saatteki istek sayısını buradan sınırlar (geri çekip yeniden göndererek bildirim
-- yağdırılamasın). app şemasında: API'ye kapalı.
create table app.friend_request_log (
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index friend_request_log_pair_idx
  on app.friend_request_log (requester_id, addressee_id, created_at desc);
alter table app.friend_request_log enable row level security;
revoke all on app.friend_request_log from public, anon, authenticated;

-- Engelleme --------------------------------------------------------------------------------

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  -- Engelleme anında engelleyen bu profili görebiliyor muydu (arkadaşlık satırı, ortak challenge ya
  -- da aramada bulunabilir). Engellenenler listesi yalnızca bunları gösterir: rastgele bir uuid'i
  -- engelleyerek profil okunamasın. Tetikleyici doldurur; istemcinin verdiği değer yok sayılır.
  profile_visible boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

-- İlişki yardımcıları (RLS ve RPC'lerde) ----------------------------------------------------

create function app.is_blocked(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b)
       or (b.blocker_id = p_b and b.blocked_id = p_a)
  )
$$;

create function app.are_friends(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and least(f.requester_id, f.addressee_id) = least(p_a, p_b)
      and greatest(f.requester_id, f.addressee_id) = greatest(p_a, p_b)
  )
$$;

-- Bekleyen ya da kabul edilmiş herhangi bir arkadaşlık satırı
create function app.has_friendship_row(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships f
    where least(f.requester_id, f.addressee_id) = least(p_a, p_b)
      and greatest(f.requester_id, f.addressee_id) = greatest(p_a, p_b)
  )
$$;

-- Engellenince arkadaşlık (ve bekleyen istek) ile aralarındaki bekleyen challenge davetleri silinir
-- (challenge_members sonraki migration'da oluşur; plpgsql gövdeyi çalışırken çözer).
create function app.blocks_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(new.blocker_id, new.blocked_id)
    and greatest(f.requester_id, f.addressee_id) = greatest(new.blocker_id, new.blocked_id);
  delete from public.challenge_members m
  where m.status = 'invited'
    and ((m.user_id = new.blocked_id and m.invited_by = new.blocker_id)
      or (m.user_id = new.blocker_id and m.invited_by = new.blocked_id));
  return new;
end
$$;

create trigger blocks_after_insert
  after insert on public.blocks
  for each row execute function app.blocks_after_insert();

-- profile_visible: karşı taraf zaten engellediyse (geri engelleme) görünmez. Arkadaşlık bu
-- tetikleyiciden sonra (AFTER) silinir. app.are_co_members sonraki migration'da oluşur.
create function app.blocks_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.profile_visible := not app.is_blocked(new.blocker_id, new.blocked_id) and (
    app.has_friendship_row(new.blocker_id, new.blocked_id)
    or app.are_co_members(new.blocker_id, new.blocked_id)
    or coalesce((select s.discoverability from public.user_settings s where s.user_id = new.blocked_id),
                'everyone') = 'everyone'
  );
  return new;
end
$$;

create trigger blocks_before_insert
  before insert on public.blocks
  for each row execute function app.blocks_before_insert();

-- Şikayet ----------------------------------------------------------------------------------
-- Raporlar hesap silinse de moderasyon için anonimleşerek kalır: kişi alanları null olur; şikayet
-- edilen silinirse kanıttaki kişisel veriler (kullanıcı adı, ad, avatar, not, fotoğraf yolu) de silinir.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete set null,
  target_type public.report_target not null default 'user',
  checkin_id uuid,   -- FK checkins migration'ında
  challenge_id uuid, -- FK challenges migration'ında
  reason public.report_reason not null,
  details text,
  also_blocked boolean not null default false,
  -- Şikayet anındaki kanıt (fotoğraf yolu, not, gün): kişi işaretlemeyi geri alsa da inceleme
  -- görebilsin; proofs kovasındaki dosya inceleme bitene kadar silinemez (storage politikaları)
  evidence jsonb,
  status public.report_status not null default 'pending',
  created_at timestamptz not null default now(),
  review_due_at timestamptz not null default (now() + interval '24 hours'),
  reviewed_at timestamptz,
  constraint reports_not_self check (reporter_id is null or reporter_id <> reported_user_id),
  constraint reports_details_length check (details is null or char_length(details) <= 500)
);

comment on table public.reports is 'Şikayetler; ekip 24 saat içinde inceler. Kullanıcılar okuyamaz.';

create index reports_pending_idx on public.reports (review_due_at) where status = 'pending';
-- submit_report sınırı ve yinelenen şikayet kontrolü
create index reports_reporter_idx on public.reports (reporter_id, created_at desc);

-- Şikayet edilenin hesabı silinince kişi alanlarını ve kanıttaki kişisel verileri tek güncellemede
-- boşalt (BEFORE: zincirleme set null'dan önce; checkin_id de burada boşalır, yoksa aynı işlemde
-- değişmiş satırın FK denetimi silinmiş işaretlemeye takılır). Challenge başlığı, gün, değer kalır.
create function app.reports_anonymize_reported() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.reports r
     set reported_user_id = null,
         checkin_id = null,
         evidence = r.evidence - array['username', 'display_name', 'avatar_path', 'note', 'photo_path']
   where r.reported_user_id = old.id;
  return old;
end
$$;

create trigger profiles_anonymize_reports
  before delete on public.profiles
  for each row execute function app.reports_anonymize_reported();

-- Hazır dürtme mesajları (serbest metin yok) -----------------------------------------------

create table public.poke_messages (
  key text primary key,
  tone public.poke_tone not null,
  sort_order smallint not null,
  text_tr text not null,
  text_en text,
  is_active boolean not null default true,
  constraint poke_messages_key_tone unique (key, tone),
  constraint poke_messages_order unique (tone, sort_order),
  constraint poke_messages_key_format check (key ~ '^[a-z0-9_]{1,40}$')
);

-- Dürtmeler --------------------------------------------------------------------------------

create table public.pokes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid, -- FK challenges migration'ında
  tone public.poke_tone not null,
  message_key text not null,
  created_at timestamptz not null default now(),
  constraint pokes_not_self check (sender_id <> recipient_id),
  constraint pokes_message foreign key (message_key, tone) references public.poke_messages (key, tone)
);

create index pokes_recipient_idx on public.pokes (recipient_id, created_at desc);
create index pokes_sender_pair_idx on public.pokes (sender_id, recipient_id, created_at desc);

-- Bildirimler (Aktivite akışı + gönderim kaydı) --------------------------------------------
-- actor_id null ise mesajı Diken söylüyor (günde en fazla 2 kuralına sayılır).

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind public.notification_kind not null,
  actor_id uuid references public.profiles (id) on delete cascade,
  poke_id uuid references public.pokes (id) on delete cascade,
  friendship_id uuid references public.friendships (id) on delete cascade,
  challenge_id uuid, -- FK challenges migration'ında
  payload jsonb not null default '{}'::jsonb,
  local_date date not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  pushed_at timestamptz
);

create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;
-- Diken günlük sınırı gönderim anına göre sayılır (claim_diken_push)
create index notifications_diken_idx on public.notifications (recipient_id, pushed_at)
  where actor_id is null and pushed_at is not null;

-- Push token'ları --------------------------------------------------------------------------

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint push_tokens_platform check (platform in ('ios', 'android')),
  constraint push_tokens_length check (char_length(token) between 10 and 300)
);

create index push_tokens_user_idx on public.push_tokens (user_id);

-- Bildirim üreten tetikleyiciler -----------------------------------------------------------

create function app.notify_friend_request() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'pending' then
    insert into public.notifications (recipient_id, kind, actor_id, friendship_id, local_date)
    values (new.addressee_id, 'friend_request', new.requester_id, new.id,
            app.local_date(new.addressee_id, now()));
  end if;
  return new;
end
$$;

create trigger friendships_notify
  after insert on public.friendships
  for each row execute function app.notify_friend_request();

create function app.notify_poke() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (recipient_id, kind, actor_id, poke_id, challenge_id, local_date)
  values (new.recipient_id,
          case new.tone when 'roast' then 'poke_roast'::public.notification_kind
                        else 'poke_hype'::public.notification_kind end,
          new.sender_id, new.id, new.challenge_id,
          app.local_date(new.recipient_id, new.created_at));
  return new;
end
$$;

create trigger pokes_notify
  after insert on public.pokes
  for each row execute function app.notify_poke();

-- Gönderilen dürtme kaydı: dürtme geri alınsa (silinse) de kalır; günlük sınır buradan sayılır
-- (gönder + geri al döngüsüyle bildirim/push yağdırılamasın). app şemasında: API'ye kapalı.
create table app.poke_log (
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null
);
create index poke_log_pair_idx on app.poke_log (sender_id, recipient_id, created_at desc);
alter table app.poke_log enable row level security;
revoke all on app.poke_log from public, anon, authenticated;

create function app.log_poke() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into app.poke_log (sender_id, recipient_id, created_at)
  values (new.sender_id, new.recipient_id, new.created_at);
  return new;
end
$$;

create trigger pokes_log
  after insert on public.pokes
  for each row execute function app.log_poke();

-- RLS ---------------------------------------------------------------------------------------

alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.poke_messages enable row level security;
alter table public.pokes enable row level security;
alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;

-- friendships: iki taraf okur ve silebilir; ekleme/kabul RPC ile (engel kontrolü için).
create policy "friendships: parties read" on public.friendships
  for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

create policy "friendships: parties delete" on public.friendships
  for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- blocks: yalnızca engelleyen görür; engellenen engellendiğini öğrenmez.
create policy "blocks: blocker read" on public.blocks
  for select to authenticated
  using (blocker_id = (select auth.uid()));

create policy "blocks: blocker insert" on public.blocks
  for insert to authenticated
  with check (blocker_id = (select auth.uid()));

create policy "blocks: blocker delete" on public.blocks
  for delete to authenticated
  using (blocker_id = (select auth.uid()));

-- reports: istemci okuyamaz ve doğrudan yazamaz; submit_report RPC'si kullanılır.

-- poke_messages: oturum açmış herkes okur. Kaldırılan (is_active = false) mesajlar eski dürtmelerin
-- metni için okunur kalır; Poke sayfası etkinleri listeler, send_poke yalnızca etkinleri kabul eder.
create policy "poke_messages: read" on public.poke_messages
  for select to authenticated
  using (true);

-- pokes: gönderen ve alıcı okur (aralarında engel yoksa); gönderen kısa süre içinde geri alabilir.
create policy "pokes: parties read" on public.pokes
  for select to authenticated
  using (
    (select auth.uid()) in (sender_id, recipient_id)
    and not app.is_blocked(sender_id, recipient_id)
  );

create policy "pokes: sender undo" on public.pokes
  for delete to authenticated
  using (
    sender_id = (select auth.uid())
    and created_at > now() - app.poke_undo_window()
  );

-- notifications: yalnızca alıcı okur; okundu işareti RPC ile.
create policy "notifications: recipient read" on public.notifications
  for select to authenticated
  using (
    recipient_id = (select auth.uid())
    and (actor_id is null or not app.is_blocked(actor_id, recipient_id))
  );

-- push_tokens: sahibi okur ve siler; kaydetme RPC ile (token cihaz değiştirince yeni sahibine geçer).
create policy "push_tokens: owner read" on public.push_tokens
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "push_tokens: owner delete" on public.push_tokens
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Ayrıcalıklar: istemci yalnızca politikası olan işlemleri yapabilsin.
revoke all on public.friendships, public.blocks, public.reports, public.poke_messages,
              public.pokes, public.notifications, public.push_tokens from anon;
revoke insert, update on public.friendships from authenticated;
revoke update on public.blocks from authenticated;
revoke all on public.reports from authenticated;
revoke insert, update, delete on public.poke_messages from authenticated;
revoke insert, update on public.pokes from authenticated;
revoke insert, update, delete on public.notifications from authenticated;
revoke insert, update on public.push_tokens from authenticated;
