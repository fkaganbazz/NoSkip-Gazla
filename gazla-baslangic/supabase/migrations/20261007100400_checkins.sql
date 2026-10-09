-- Gazla veri modeli · 5/10 — günlük işaretlemeler ve seri kurtarmaları.
--
-- Yazma yalnızca RPC'lerle (checkin, undo_checkin, rescue_streak): yerel gün, tolerans, görev türü
-- ve üyelik kuralları tek yerde doğrulanır. İstemci bu tablolara doğrudan yazamaz.

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  -- Kullanıcının yerel takvim günü (saat dilimine göre, 2 saat toleransla)
  local_date date not null,
  -- Sayı görevlerinde girilen değer (hedefin altında da gün tamam sayılır)
  value numeric,
  -- Fotoğraf kanıtı: proofs kovasında {user_id}/{challenge_id}/... yolu
  photo_path text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checkins_one_per_day unique (user_id, challenge_id, local_date),
  -- Üst sınır ve en çok 4 ondalık (NaN ve sonsuz da elenir)
  constraint checkins_value
    check (value is null or (value >= 0 and value <= 1000000000 and scale(value) <= 4)),
  constraint checkins_note check (note is null or char_length(note) <= 200),
  -- {user_id}/{challenge_id}/{dosya}: tek dosya adı, "." ile başlamaz
  constraint checkins_photo_path check (
    photo_path is null or (
      photo_path like user_id::text || '/' || challenge_id::text || '/%'
      and photo_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[A-Za-z0-9_-][A-Za-z0-9._-]{0,99}$'
    )
  )
);

create index checkins_challenge_date_idx on public.checkins (challenge_id, local_date);
-- Kanıt fotoğrafı → işaretleme (storage politikaları); bir dosya tek bir işaretlemenin kanıtı
create unique index checkins_photo_path_key on public.checkins (photo_path) where photo_path is not null;

create trigger checkins_touch_updated_at
  before update on public.checkins
  for each row execute function app.touch_updated_at();

-- Seri kurtarmaları: kaçırılan bir gün, reklam ya da ayda 1 ücretsiz hakla "kurtarıldı" sayılır.
-- Kurtarılan gün işaretleme değildir (değeri/fotoğrafı yok); takvimde ayrı gösterilir.

create table public.streak_rescues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  rescued_date date not null,
  method public.rescue_method not null,
  -- Ücretsiz hakkın ait olduğu ay (kullanıcının yerel ayının ilk günü)
  quota_month date,
  -- Reklam ödülünün sunucu doğrulama kimliği (AdMob SSV); tekrar kullanılamaz
  ad_reward_id text unique,
  created_at timestamptz not null default now(),
  constraint streak_rescues_one_per_day unique (user_id, challenge_id, rescued_date),
  constraint streak_rescues_method check (
    case method
      when 'free' then quota_month is not null and ad_reward_id is null
                       and extract(day from quota_month) = 1
      when 'ad' then quota_month is null and ad_reward_id is not null
    end
  )
);

-- Ayda en fazla 1 ücretsiz kurtarma
create unique index streak_rescues_free_per_month
  on public.streak_rescues (user_id, quota_month) where method = 'free';
create index streak_rescues_challenge_idx on public.streak_rescues (challenge_id, rescued_date);

alter table public.reports
  add constraint reports_checkin_fk foreign key (checkin_id)
  references public.checkins (id) on delete set null;

-- Görünürlük yardımcısı: bir üyenin işaretlemesini (ve fotoğrafını) kim görebilir
create function app.can_see_member_activity(p_viewer uuid, p_owner uuid, p_challenge uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select p_viewer = p_owner
      or (
        app.is_active_member(p_viewer, p_challenge)
        and exists (
          select 1 from public.challenge_members m
          where m.challenge_id = p_challenge and m.user_id = p_owner and m.status in ('active', 'left')
        )
        and not app.is_blocked(p_viewer, p_owner)
      )
$$;

-- RLS ---------------------------------------------------------------------------------------

alter table public.checkins enable row level security;
alter table public.streak_rescues enable row level security;

create policy "checkins: own and group read" on public.checkins
  for select to authenticated
  using (
    (user_id = (select auth.uid())
     or challenge_id = any ((select app.my_challenge_ids('{active}'))::uuid[]))
    and app.can_see_member_activity((select auth.uid()), user_id, challenge_id)
  );

-- Kurtarma yöntemi kişiseldir; grup yalnızca sonucu (seri) görür.
create policy "streak_rescues: own read" on public.streak_rescues
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.checkins, public.streak_rescues from anon;
revoke insert, update, delete on public.checkins, public.streak_rescues from authenticated;
