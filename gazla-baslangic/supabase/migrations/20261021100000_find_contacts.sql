-- Gazla veri modeli · 12/14 — rehberden bul (InviteFriends / Friends "Rehberden bul").
--
-- İstemci rehberdeki e-postaları açık göndermez: kırpılmış, küçük harfe çevrilmiş e-postanın
-- SHA-256 özeti (64 karakter küçük harf hex; src/data/contactHash.ts). Sunucu auth.users.email'in
-- aynı özetini app.email_hashes'te tutar (dizinli; auth.users tetikleyicisiyle güncel kalır), böylece
-- her aramada tüm kullanıcılar yeniden özetlenmez.
--
-- Sonuç search_profiles ile aynı biçimde (SearchResult): yalnızca profili olan ve "Beni herkes
-- bulabilir" (discoverability = 'everyone') diyen kullanıcılar; iki yönde engel ve kendisi hariç.
-- En çok 500 özet, en çok 100 sonuç. Rehber taraması e-posta yoklamasına dönüşmesin diye günde en
-- çok 20 arama (app.contact_lookup_daily_limit).

create function app.contact_lookup_daily_limit() returns integer
language sql immutable parallel safe as $$ select 20 $$;

create function app.contact_hash_limit() returns integer
language sql immutable parallel safe as $$ select 500 $$;

-- Kırpılmış, küçük harf e-postanın SHA-256 özeti (istemcideki hashEmail ile aynı)
create function app.email_sha256(p_email text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select case when nullif(btrim(p_email), '') is null then null
              else encode(sha256(convert_to(lower(btrim(p_email)), 'UTF8')), 'hex') end
$$;

create table app.email_hashes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_sha256 text not null
);
create index email_hashes_hash_idx on app.email_hashes (email_sha256);
alter table app.email_hashes enable row level security;
revoke all on app.email_hashes from public, anon, authenticated;

-- GoTrue kullanıcıyı supabase_auth_admin olarak yazar: fonksiyon SECURITY DEFINER, adlar şemalı
create function app.sync_email_hash() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if nullif(btrim(new.email), '') is null then
    delete from app.email_hashes h where h.user_id = new.id;
  else
    insert into app.email_hashes (user_id, email_sha256)
    values (new.id, app.email_sha256(new.email))
    on conflict (user_id) do update set email_sha256 = excluded.email_sha256;
  end if;
  return new;
end
$$;

create trigger gazla_sync_email_hash
  after insert or update of email on auth.users
  for each row execute function app.sync_email_hash();

-- Mevcut kullanıcılar
insert into app.email_hashes (user_id, email_sha256)
select u.id, app.email_sha256(u.email) from auth.users u
where nullif(btrim(u.email), '') is not null
on conflict (user_id) do update set email_sha256 = excluded.email_sha256;

-- Arama kaydı (günlük sınır); app şemasında, API'ye kapalı
create table app.contact_lookup_log (
  user_id uuid not null references public.profiles (id) on delete cascade,
  hash_count integer not null,
  created_at timestamptz not null default now()
);
create index contact_lookup_log_user_idx on app.contact_lookup_log (user_id, created_at desc);
alter table app.contact_lookup_log enable row level security;
revoke all on app.contact_lookup_log from public, anon, authenticated;

create function public.find_contacts(p_email_hashes text[])
returns table (
  id uuid, username text, display_name text, avatar_path text, avatar_tint text,
  is_friend boolean, request_pending boolean, mutual_count integer
)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := app.require_user();
  v_hashes text[];
begin
  if coalesce(cardinality(p_email_hashes), 0) > app.contact_hash_limit() then
    raise exception 'Rehberden en fazla 500 kişi aranabilir' using errcode = '22023';
  end if;

  -- Yalnızca geçerli özetler (64 hex), tekilleştirilmiş
  select coalesce(array_agg(distinct lower(btrim(h))), '{}') into v_hashes
  from unnest(coalesce(p_email_hashes, '{}')) as h
  where lower(btrim(h)) ~ '^[0-9a-f]{64}$';

  if cardinality(v_hashes) = 0 then
    return;
  end if;

  delete from app.contact_lookup_log l
  where l.user_id = v_uid and l.created_at <= now() - interval '24 hours';
  if (select count(*) from app.contact_lookup_log l where l.user_id = v_uid) >= app.contact_lookup_daily_limit() then
    raise exception 'Rehberden bulmayı bugün çok denedin. Yarın tekrar dene.' using errcode = 'P0001';
  end if;
  insert into app.contact_lookup_log (user_id, hash_count) values (v_uid, cardinality(v_hashes));

  return query
  select p.id, p.username::text, p.display_name, p.avatar_path, p.avatar_tint,
         app.are_friends(v_uid, p.id),
         app.has_friendship_row(v_uid, p.id) and not app.are_friends(v_uid, p.id),
         app.mutual_friend_count(v_uid, p.id)
  from app.email_hashes h
  join public.profiles p on p.id = h.user_id
  left join public.user_settings s on s.user_id = p.id
  where h.email_sha256 = any (v_hashes)
    and p.id <> v_uid
    and coalesce(s.discoverability, 'everyone') = 'everyone'
    and not app.is_blocked(v_uid, p.id)
  order by app.are_friends(v_uid, p.id), app.mutual_friend_count(v_uid, p.id) desc, p.display_name, p.id
  limit 100;
end
$$;

revoke execute on function public.find_contacts(text[]) from public, anon;
grant execute on function public.find_contacts(text[]) to authenticated;
revoke execute on function app.sync_email_hash(), app.email_sha256(text),
  app.contact_lookup_daily_limit(), app.contact_hash_limit() from public, anon, authenticated;
grant execute on function app.sync_email_hash(), app.email_sha256(text),
  app.contact_lookup_daily_limit(), app.contact_hash_limit() to service_role;
