-- Gazla veri modeli · 4/10 — challenge kataloğu, challenge'lar, üyelik ve davet linkleri.

-- Katalog (ekip tarafından düzenlenir; oturum açmadan da okunur: onboarding PickChallenge) ------

create table public.challenge_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_tr text not null,
  title_en text,
  -- Bahçe ve widget etiketi ("kahvesiz", "telefonsuz sabah")
  short_title_tr text,
  short_title_en text,
  description_tr text,
  description_en text,
  category public.challenge_category not null,
  difficulty public.challenge_difficulty not null,
  task_type public.task_type not null,
  default_duration_days smallint not null,
  icon text not null,
  tint text not null,
  number_unit text,
  number_base_target numeric,
  number_daily_increment numeric not null default 0,
  number_step numeric,
  number_max numeric,
  -- PickChallenge'daki sıra (null = onboarding'de yok)
  onboarding_order smallint unique,
  -- "Haftanın challenge'ı": o haftanın pazartesisi
  featured_week date unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint challenge_templates_slug check (slug ~ '^[a-z0-9-]{2,60}$'),
  constraint challenge_templates_duration check (default_duration_days in (7, 10, 30)),
  constraint challenge_templates_icon check (icon ~ '^[a-zA-Z0-9]{1,32}$'),
  constraint challenge_templates_tint check (tint ~ '^[a-z]{1,16}$'),
  constraint challenge_templates_featured_monday
    check (featured_week is null or extract(isodow from featured_week) = 1),
  constraint challenge_templates_number check (
    case when task_type = 'number' then
      number_unit is not null and number_base_target >= 0 and number_step > 0
      and number_daily_increment >= 0 and (number_max is null or number_max >= number_base_target)
    else
      number_unit is null and number_base_target is null and number_step is null
      and number_max is null and number_daily_increment = 0
    end
  )
);

-- Challenge'lar -----------------------------------------------------------------------------
-- Şablondan başlatılınca şablon alanları kopyalanır: katalog değişse de süren challenge değişmez.

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.challenge_templates (id) on delete set null,
  -- Oluşturan hesabını silse de challenge diğer üyelerle sürer (sahiplik devredilir)
  created_by uuid references public.profiles (id) on delete set null,
  title text not null,
  short_title text,
  task_type public.task_type not null,
  duration_days smallint not null,
  start_date date not null,
  end_date date generated always as (start_date + duration_days - 1) stored,
  -- Grubun günlük hatırlatma saati (her üyenin yerel saatinde)
  reminder_time time,
  invite_message text,
  category public.challenge_category,
  icon text not null default 'check',
  tint text not null default 'green',
  number_unit text,
  number_base_target numeric,
  number_daily_increment numeric not null default 0,
  number_step numeric,
  number_max numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenges_title check (char_length(btrim(title)) between 1 and 60),
  constraint challenges_short_title check (short_title is null or char_length(btrim(short_title)) between 1 and 30),
  -- Hazır süreler 7/10/30; "Özel" süre yalnızca şablonsuz challenge'da (3–60 gün)
  constraint challenges_duration check (duration_days between 3 and 60),
  constraint challenges_template_duration check (template_id is null or duration_days in (7, 10, 30)),
  constraint challenges_invite_message check (invite_message is null or char_length(invite_message) <= 140),
  constraint challenges_icon check (icon ~ '^[a-zA-Z0-9]{1,32}$'),
  constraint challenges_tint check (tint ~ '^[a-z]{1,16}$'),
  constraint challenges_number check (
    case when task_type = 'number' then
      number_unit is not null and number_base_target >= 0 and number_step > 0
      and number_daily_increment >= 0 and (number_max is null or number_max >= number_base_target)
    else
      number_unit is null and number_base_target is null and number_step is null
      and number_max is null and number_daily_increment = 0
    end
  )
);

create index challenges_template_idx on public.challenges (template_id);
create index challenges_dates_idx on public.challenges (start_date, end_date);

create trigger challenges_touch_updated_at
  before update on public.challenges
  for each row execute function app.touch_updated_at();

-- Davet linkleri (bir üye, bir challenge için bir link) ------------------------------------------

create table public.challenge_invites (
  code text primary key,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint challenge_invites_code check (code ~ '^[A-Za-z0-9]{10}$')
);

create unique index challenge_invites_active_key
  on public.challenge_invites (challenge_id, inviter_id) where revoked_at is null;

-- Üyelik ------------------------------------------------------------------------------------
-- Davet bekleyen, aktif, reddetmiş ve ayrılmış üyeler. Seri ve sıra hesaplanır; yalnızca
-- challenge bitince özet (final_*) saklanır.

create table public.challenge_members (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'member',
  status public.member_status not null default 'invited',
  invited_by uuid references public.profiles (id) on delete set null,
  invite_code text references public.challenge_invites (code) on delete set null,
  joined_at timestamptz,
  -- Katıldığı ve ayrıldığı yerel gün: seri ve "tüm görevler" hesabı bu aralıktaki günlere bakar
  joined_on date,
  left_on date,
  finished_at timestamptz,
  final_days_done smallint,
  final_rescues smallint,
  final_rank smallint,
  created_at timestamptz not null default now(),
  primary key (challenge_id, user_id),
  constraint challenge_members_joined
    check (status not in ('active', 'left') or (joined_at is not null and joined_on is not null)),
  constraint challenge_members_left check ((status = 'left') = (left_on is not null)),
  constraint challenge_members_owner_active check (role <> 'owner' or status = 'active')
);

create unique index challenge_members_one_owner
  on public.challenge_members (challenge_id) where role = 'owner';
create index challenge_members_user_idx on public.challenge_members (user_id, status);

-- Diğer migration'larda bekleyen yabancı anahtarlar
alter table public.reports
  add constraint reports_challenge_fk foreign key (challenge_id)
  references public.challenges (id) on delete set null;
alter table public.pokes
  add constraint pokes_challenge_fk foreign key (challenge_id)
  references public.challenges (id) on delete set null;
alter table public.notifications
  add constraint notifications_challenge_fk foreign key (challenge_id)
  references public.challenges (id) on delete cascade;

-- Üyelik yardımcıları ------------------------------------------------------------------------

create function app.is_active_member(p_user uuid, p_challenge uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.challenge_members m
    where m.challenge_id = p_challenge and m.user_id = p_user and m.status = 'active'
  )
$$;

-- Davetli ya da aktif üye: challenge'ı ve grubu görebilir
create function app.is_member(p_user uuid, p_challenge uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.challenge_members m
    where m.challenge_id = p_challenge and m.user_id = p_user and m.status in ('invited', 'active')
  )
$$;

create function app.are_co_members(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.challenge_members a
    join public.challenge_members b on b.challenge_id = a.challenge_id
    where a.user_id = p_a and b.user_id = p_b
      and a.status in ('invited', 'active') and b.status in ('invited', 'active')
  )
$$;

-- Profil görünürlüğü: kendisi; arkadaşlık satırı (bekleyen dahil) ya da ortak challenge (engel
-- yoksa); engelleyen, engellediği kişileri listesinde görebilir.
create function app.can_see_profile(p_viewer uuid, p_target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_viewer = p_target
      or exists (select 1 from public.blocks b where b.blocker_id = p_viewer and b.blocked_id = p_target)
      or (
        not app.is_blocked(p_viewer, p_target)
        and (app.has_friendship_row(p_viewer, p_target) or app.are_co_members(p_viewer, p_target))
      )
$$;

-- Sahip ayrılır ya da hesabını silerse sahiplik en eski aktif üyeye geçer; kimse kalmazsa
-- challenge silinir.
create function app.transfer_ownership() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_challenge uuid := old.challenge_id;
  v_next uuid;
begin
  if old.role <> 'owner' then
    return null;
  end if;
  if tg_op = 'UPDATE' and new.role = 'owner' and new.status = 'active' then
    return null;
  end if;
  if not exists (select 1 from public.challenges c where c.id = v_challenge) then
    return null; -- challenge zaten siliniyor
  end if;

  select m.user_id into v_next
  from public.challenge_members m
  where m.challenge_id = v_challenge and m.status = 'active' and m.user_id <> old.user_id
  order by m.joined_at, m.user_id
  limit 1;

  if v_next is null then
    delete from public.challenges c where c.id = v_challenge;
  else
    update public.challenge_members m set role = 'owner'
    where m.challenge_id = v_challenge and m.user_id = v_next;
  end if;
  return null;
end
$$;

create trigger challenge_members_transfer_on_delete
  after delete on public.challenge_members
  for each row execute function app.transfer_ownership();

create trigger challenge_members_transfer_on_update
  after update of status, role on public.challenge_members
  for each row when (old.role = 'owner' and (new.role <> 'owner' or new.status <> 'active'))
  execute function app.transfer_ownership();

-- Sahip "member" yapılmadan önce rolü bırakmalı: güncellemede önce eski sahibi düşür
create function app.challenge_members_before_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.role = 'owner' and new.status <> 'active' then
    new.role := 'member';
  end if;
  return new;
end
$$;

create trigger challenge_members_before_update
  before update of status on public.challenge_members
  for each row execute function app.challenge_members_before_update();

-- Davet edilen kişiye bildirim ("seni bir challenge'a ekledi")
create function app.notify_challenge_invite() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'invited' and new.invited_by is not null then
    insert into public.notifications (recipient_id, kind, actor_id, challenge_id, local_date)
    values (new.user_id, 'challenge_invite', new.invited_by, new.challenge_id,
            app.local_date(new.user_id, now()));
  end if;
  return new;
end
$$;

create trigger challenge_members_notify_invite
  after insert on public.challenge_members
  for each row execute function app.notify_challenge_invite();

-- RLS ---------------------------------------------------------------------------------------

alter table public.challenge_templates enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_invites enable row level security;
alter table public.challenge_members enable row level security;

create policy "challenge_templates: read active" on public.challenge_templates
  for select to anon, authenticated
  using (is_active);

create policy "challenges: members read" on public.challenges
  for select to authenticated
  using (app.is_member((select auth.uid()), id));

-- Sahip yalnızca ad, kısa ad, hatırlatma ve davet mesajını değiştirebilir (sütun yetkisiyle)
create policy "challenges: owner update" on public.challenges
  for update to authenticated
  using (exists (
    select 1 from public.challenge_members m
    where m.challenge_id = id and m.user_id = (select auth.uid()) and m.role = 'owner'
  ))
  with check (exists (
    select 1 from public.challenge_members m
    where m.challenge_id = id and m.user_id = (select auth.uid()) and m.role = 'owner'
  ));

create policy "challenge_invites: inviter read" on public.challenge_invites
  for select to authenticated
  using (inviter_id = (select auth.uid()));

-- Grup listesi: davetli/aktif üyeler; aralarında engel olanlar birbirini görmez.
create policy "challenge_members: group read" on public.challenge_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      status in ('invited', 'active')
      and app.is_member((select auth.uid()), challenge_id)
      and not app.is_blocked((select auth.uid()), user_id)
    )
  );

-- Profiller: arkadaşlık / ortak challenge / engel kuralı (app.can_see_profile)
create policy "profiles: visible to related users" on public.profiles
  for select to authenticated
  using (app.can_see_profile((select auth.uid()), id));

revoke all on public.challenges, public.challenge_invites, public.challenge_members from anon;
revoke insert, update, delete on public.challenge_templates from anon, authenticated;
revoke insert, delete on public.challenges from authenticated;
revoke update on public.challenges from authenticated;
grant update (title, short_title, reminder_time, invite_message) on public.challenges to authenticated;
revoke insert, update, delete on public.challenge_invites from authenticated;
revoke insert, update, delete on public.challenge_members from authenticated;
