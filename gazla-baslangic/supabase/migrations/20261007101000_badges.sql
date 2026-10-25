-- Gazla veri modeli · 11/11 — rozetler (Bahçem "Rozetler n / 12").
--
-- badges: katalog (12 rozet; ad, açıklama, ikon ve renk anahtarı). Prod'da da gerekli referans veri.
-- İlk üçünün adı, ikonu, rengi ve sırası design/Garden.dc.html'den ("İlk 30 gün", "Laf ustası",
-- "Erkenci"); diğer dokuzu tasarımda yok, adları ve kuralları ürün kararıdır (supabase/README.md).
-- user_badges: kazanılanlar. Kazanım kuralları sunucuda ve olayın olduğu anda (tetikleyiciler):
-- işaretleme, kurtarma, dürtme, arkadaşlık, challenge bitişi. İstemci yazamaz; my_badges okur.
-- Kazanılan rozet geri alınmaz (işaretleme ya da dürtme sonradan geri alınsa da).

create table public.badges (
  key text primary key,
  sort_order smallint not null unique,
  title_tr text not null,
  title_en text,
  description_tr text not null,
  description_en text,
  -- İstemcideki çizgi ikon (BadgeIconKey) ve renk (BadgeTintKey) anahtarları
  icon text not null,
  tint text not null,
  is_active boolean not null default true,
  constraint badges_key_format check (key ~ '^[a-z0-9_]{1,40}$'),
  constraint badges_icon check (icon ~ '^[a-zA-Z0-9]{1,32}$'),
  -- Garden.dc.html'deki üç rozet rengi: sarı #FFC83D, turuncu #FF5A1F, nane #8BE0AE
  constraint badges_tint check (tint in ('yellow', 'orange', 'mint'))
);

comment on table public.badges is 'Rozet kataloğu (Bahçem); kazanım kuralları app.badges_* tetikleyicilerinde.';

create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_key text not null references public.badges (key),
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_key)
);

-- İngilizce ad ve açıklama (NoSkip) src/data/mock/seedEn.ts `badgeEn` ile aynı. Ad, Bahçem'deki
-- dar kutuya (4 sütun, 2 satır) sığacak kısalıkta; tek kelime ~9 harfi geçmez.
insert into public.badges (key, sort_order, title_tr, description_tr, icon, tint, title_en, description_en) values
  ('ilk_30_gun',     1, 'İlk 30 gün',    'Genel serin 30 güne ulaştı',                                'star',     'yellow',
   'First 30 days',   'Your overall streak hit 30 days'),
  ('laf_ustasi',     2, 'Laf ustası',    '10 kez laf soktun',                                          'speech',   'orange',
   'Roast master',    'You sent 10 roasts'),
  ('erkenci',        3, 'Erkenci',       '5 gün sabah 8''den önce işaretledin',                        'sun',      'mint',
   'Early bird',      'You checked in before 8 a.m. on 5 days'),
  ('yuz_gun',        4, 'Yüz gün',       'Genel serin 100 güne ulaştı',                                'streak',   'yellow',
   '100 club',        'Your overall streak hit 100 days'),
  ('maratoncu',      5, 'Maratoncu',     '3 kez 30 günlük bir challenge''ı bitirdin',                  'calendar', 'orange',
   'Marathon runner', 'You finished a 30-day challenge 3 times'),
  ('bahcivan',       6, 'Bahçıvan',      'Bahçende 10 kaktüs var',                                     'sprout',   'mint',
   'Gardener',        'Your garden has 10 cacti'),
  ('sampiyon',       7, 'Şampiyon',      'En az 3 kişilik bir grupta challenge''ı birinci bitirdin',   'trophy',   'yellow',
   'Champion',        'You finished first in a group of 3 or more'),
  ('gaz_pedali',     8, 'Gaz pedalı',    'Arkadaşlarına 25 kez gaz verdin',                            'hand',     'orange',
   'Hype machine',    'You hyped up friends 25 times'),
  ('son_dakika',     9, 'Son dakika',    'Serini kurtarma süresinin son saatinde kurtardın',           'clock',    'mint',
   'Last minute',     'You saved your streak with under an hour to go'),
  ('gece_kusu',     10, 'Gece kuşu',     'Gece yarısından sonra dünün görevini tamamladın',            'moon',     'yellow',
   'Night owl',       'You finished yesterday''s task after midnight'),
  ('sosyal_kaktus', 11, 'Sosyal kaktüs', '10 arkadaşın oldu',                                          'friends',  'orange',
   'Social cactus',   'You made 10 friends'),
  ('objektif',      12, 'Objektif',      '30 fotoğraf kanıtı gönderdin',                               'camera',   'mint',
   'Paparazzi',       'You sent 30 photo proofs');

-- Kurallar ----------------------------------------------------------------------------------

-- Eşikler tek yerde (açıklama metinleriyle aynı). sampiyon: en küçük grup büyüklüğü.
create function app.badge_goal(p_key text) returns integer
language sql immutable parallel safe as $$
  select case p_key
    when 'ilk_30_gun' then 30
    when 'yuz_gun' then 100
    when 'laf_ustasi' then 10
    when 'gaz_pedali' then 25
    when 'erkenci' then 5
    when 'objektif' then 30
    when 'maratoncu' then 3
    when 'bahcivan' then 10
    when 'sampiyon' then 3
    when 'sosyal_kaktus' then 10
    else 1
  end
$$;

-- Erkenci penceresi (yerel saat): 05:00–08:00. Gece 03:00'te uyumamış olan erkenci sayılmaz.
create function app.early_bird_window(out starts time, out ends time)
language sql immutable parallel safe as $$ select time '05:00', time '08:00' $$;

-- Rozeti verir (zaten varsa dokunmaz); kaldırılmış (is_active = false) rozet verilmez
create function app.award_badge(p_user uuid, p_key text, p_at timestamptz) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_badges (user_id, badge_key, earned_at)
  select p_user, b.key, p_at from public.badges b where b.key = p_key and b.is_active
  on conflict (user_id, badge_key) do nothing;
  return found;
end
$$;

-- Seri rozetleri: genel seri o anda eşiği geçtiyse. Seri yalnızca bir gün kapsanınca (işaretleme ya
-- da kurtarma) artar; bu iki olayda çağrılır. Kapsanan farklı gün sayısı eşiğin altındaysa seri
-- hesaplanmaz (ucuz ön kontrol).
create function app.award_streak_badges(p_user uuid, p_at timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_streak integer;
begin
  if (select count(*) from public.user_badges ub
      where ub.user_id = p_user and ub.badge_key in ('ilk_30_gun', 'yuz_gun')) = 2
     or (select count(*) from (
           select k.local_date from public.checkins k where k.user_id = p_user
           union
           select r.rescued_date from public.streak_rescues r where r.user_id = p_user
         ) as d) < app.badge_goal('ilk_30_gun') then
    return;
  end if;
  v_streak := app.user_streak(p_user, p_at);
  if v_streak >= app.badge_goal('ilk_30_gun') then
    perform app.award_badge(p_user, 'ilk_30_gun', p_at);
  end if;
  if v_streak >= app.badge_goal('yuz_gun') then
    perform app.award_badge(p_user, 'yuz_gun', p_at);
  end if;
end
$$;

-- İşaretleme: gece kuşu, erkenci, objektif, seri rozetleri. Zaman = işaretleme anı (created_at;
-- do_checkin'de p_at). Aynı günün yeniden gönderimi (on conflict update) yeni işaretleme değildir.
create function app.badges_after_checkin() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_tz text := app.user_timezone(new.user_id);
  v_local timestamp := new.created_at at time zone v_tz;
  v_win record := app.early_bird_window();
begin
  -- Gece kuşu: dünün görevini gece yarısından sonra, gün kapanmadan (toleransta) tamamladı
  if new.created_at >= app.local_day_start(v_tz, new.local_date + 1)
     and new.created_at < app.day_closes_at(new.user_id, new.local_date) then
    perform app.award_badge(new.user_id, 'gece_kusu', new.created_at);
  end if;

  -- Erkenci: kendi gününü yerel 05:00–08:00 arasında işaretlediği farklı gün sayısı
  if v_local::date = new.local_date and v_local::time >= v_win.starts and v_local::time < v_win.ends
     and (select count(distinct k.local_date) from public.checkins k
          where k.user_id = new.user_id
            and (k.created_at at time zone v_tz)::date = k.local_date
            and (k.created_at at time zone v_tz)::time >= v_win.starts
            and (k.created_at at time zone v_tz)::time < v_win.ends) >= app.badge_goal('erkenci') then
    perform app.award_badge(new.user_id, 'erkenci', new.created_at);
  end if;

  -- Objektif: fotoğraf kanıtlı işaretleme sayısı
  if new.photo_path is not null
     and (select count(*) from public.checkins k
          where k.user_id = new.user_id and k.photo_path is not null) >= app.badge_goal('objektif') then
    perform app.award_badge(new.user_id, 'objektif', new.created_at);
  end if;

  perform app.award_streak_badges(new.user_id, new.created_at);
  return null;
end
$$;

create trigger checkins_badges
  after insert on public.checkins
  for each row execute function app.badges_after_checkin();

-- Kurtarma: son dakika (kurtarma penceresinin son saati), seri rozetleri
create function app.badges_after_rescue() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_expires timestamptz := app.day_closes_at(new.user_id, new.rescued_date) + app.rescue_window();
begin
  if new.created_at < v_expires and v_expires - new.created_at <= interval '1 hour' then
    perform app.award_badge(new.user_id, 'son_dakika', new.created_at);
  end if;
  perform app.award_streak_badges(new.user_id, new.created_at);
  return null;
end
$$;

create trigger streak_rescues_badges
  after insert on public.streak_rescues
  for each row execute function app.badges_after_rescue();

-- Dürtme: laf ustası (laf sokma), gaz pedalı (gaz verme). Geri alınan dürtme sayılmaz (satır silinir);
-- gönderildiği anda eşiğe ulaştıysa rozet kalır.
create function app.badges_after_poke() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_key text := case new.tone when 'roast' then 'laf_ustasi' else 'gaz_pedali' end;
begin
  if (select count(*) from public.pokes k
      where k.sender_id = new.sender_id and k.tone = new.tone) >= app.badge_goal(v_key) then
    perform app.award_badge(new.sender_id, v_key, new.created_at);
  end if;
  return null;
end
$$;

create trigger pokes_badges
  after insert on public.pokes
  for each row execute function app.badges_after_poke();

-- Arkadaşlık kabul edilince iki taraf için: sosyal kaktüs (kabul edilmiş arkadaş sayısı)
create function app.badges_after_friendship() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
begin
  if new.status = 'accepted' and (tg_op = 'INSERT' or old.status is distinct from 'accepted') then
    foreach v_user in array array[new.requester_id, new.addressee_id] loop
      if (select count(*) from public.friendships f
          where f.status = 'accepted' and v_user in (f.requester_id, f.addressee_id))
         >= app.badge_goal('sosyal_kaktus') then
        perform app.award_badge(v_user, 'sosyal_kaktus', coalesce(new.accepted_at, now()));
      end if;
    end loop;
  end if;
  return null;
end
$$;

create trigger friendships_badges
  after insert or update of status on public.friendships
  for each row execute function app.badges_after_friendship();

-- Challenge sonucu kaydedilince (app.finalize_member): bahçıvan (bitirilen challenge sayısı),
-- maratoncu (en az 30 günü kapsanarak bitirilen), şampiyon (grubun son aktif üyesi de sonuçlanınca,
-- kayıtlı sonuçlara göre birinci; finalize_member'ın son sıralamasıyla aynı düzen: kapsanan gün,
-- katılma zamanı, kullanıcı). Şampiyon en az 3 kişilik grupta ve kendi tüm günlerini kapsamış olmalı.
create function app.badges_after_finish() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_group integer;
  v_winner record;
begin
  if new.final_days_done >= new.final_required_days then
    if (select count(*) from public.challenge_members m
        where m.user_id = new.user_id and m.finished_at is not null
          and m.final_days_done >= m.final_required_days) >= app.badge_goal('bahcivan') then
      perform app.award_badge(new.user_id, 'bahcivan', new.finished_at);
    end if;
    if (select count(*) from public.challenge_members m
        where m.user_id = new.user_id and m.finished_at is not null
          and m.final_days_done >= m.final_required_days
          and m.final_required_days >= 30) >= app.badge_goal('maratoncu') then
      perform app.award_badge(new.user_id, 'maratoncu', new.finished_at);
    end if;
  end if;

  if not exists (
    select 1 from public.challenge_members o
    where o.challenge_id = new.challenge_id and o.status = 'active' and o.finished_at is null
  ) then
    select count(*)::int into v_group
    from public.challenge_members o
    where o.challenge_id = new.challenge_id and o.status = 'active';
    if v_group >= app.badge_goal('sampiyon') then
      select o.user_id, o.final_days_done, o.final_required_days into v_winner
      from public.challenge_members o
      where o.challenge_id = new.challenge_id and o.status = 'active'
      order by o.final_days_done desc, o.joined_at, o.user_id
      limit 1;
      if v_winner.final_days_done >= v_winner.final_required_days then
        perform app.award_badge(v_winner.user_id, 'sampiyon', new.finished_at);
      end if;
    end if;
  end if;
  return null;
end
$$;

create trigger challenge_members_badges
  after update of finished_at on public.challenge_members
  for each row when (old.finished_at is null and new.finished_at is not null)
  execute function app.badges_after_finish();

-- Bahçem: tüm etkin rozetler (katalog sırasıyla) ve kazanıldıysa zamanı; metinler kullanıcının
-- dilinde (İngilizcesi yoksa Türkçe)
create function public.my_badges()
returns table (
  key text, sort_order integer, title text, description text, icon text, tint text,
  earned_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  with u as (
    select v.uid, coalesce((select s.locale from public.user_settings s where s.user_id = v.uid), 'tr') as locale
    from (select app.require_user() as uid) as v
  )
  select b.key, b.sort_order::int,
         case when u.locale = 'en' then coalesce(b.title_en, b.title_tr) else b.title_tr end,
         case when u.locale = 'en' then coalesce(b.description_en, b.description_tr) else b.description_tr end,
         b.icon, b.tint, ub.earned_at
  from u
  cross join public.badges b
  left join public.user_badges ub on ub.user_id = u.uid and ub.badge_key = b.key
  where b.is_active
  order by b.sort_order
$$;

-- RLS ve yetkiler ------------------------------------------------------------------------------

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "badges: read active" on public.badges
  for select to authenticated
  using (is_active);

-- Kazanılan rozetler kişisel (Bahçem); arkadaş profilinde gösterilmiyor
create policy "user_badges: own read" on public.user_badges
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.badges, public.user_badges from anon;
revoke insert, update, delete, truncate, trigger, references
  on public.badges, public.user_badges from authenticated;

-- app.* fonksiyonları varsayılan olarak yalnızca service_role'e açık (20261007100000)
revoke execute on function public.my_badges() from public, anon;
grant execute on function public.my_badges() to authenticated;
