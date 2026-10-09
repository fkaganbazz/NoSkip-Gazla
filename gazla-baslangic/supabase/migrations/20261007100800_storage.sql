-- Gazla veri modeli · 9/10 — Storage: kanıt fotoğrafları (özel) ve profil fotoğrafları.
--
-- proofs: {user_id}/{challenge_id}/{dosya}. Sahibi yazar ve okur; aktif grup üyeleri (aralarında
-- engel yoksa) yalnızca bir işaretlemeye bağlı fotoğrafı okur (gönderilmemiş, değiştirilmiş ya da
-- geri alınmış işaretlemenin fotoğrafını görmez). Kapanmış bir günün kanıtı ve incelemedeki şikayetin
-- kanıtı değiştirilemez, silinemez. İstemci imzalı URL ile gösterir.
-- avatars: {user_id}/{dosya}. Herkese açık okunur (arama sonuçları, davet kartı); sahibi yazar.
-- Hesap silmede dosyalar service role ile (Admin API / Edge Function) silinir; RLS'e takılmaz.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('proofs', 'proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/heic', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Yol parçasını güvenle uuid'e çevirir (geçersizse null)
create function app.try_uuid(p_text text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return p_text::uuid;
exception when invalid_text_representation then
  return null;
end
$$;

create index reports_evidence_photo_idx on public.reports ((evidence ->> 'photo_path'))
  where status in ('pending', 'reviewing');

-- Bir işaretlemeye bağlı ve izleyicinin görebildiği kanıt mı
create function app.can_see_proof(p_viewer uuid, p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.checkins k
    where k.photo_path = p_name
      and app.can_see_member_activity(p_viewer, k.user_id, k.challenge_id)
  )
$$;

-- Kanıt kilitli mi: kapanmış bir günün işaretlemesine bağlı ("geçmiş günler değişmez") ya da
-- incelemesi süren bir şikayetin kanıtı
create function app.proof_locked(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
           select 1 from public.checkins k
           where k.photo_path = p_name
             and not (k.local_date = any (app.checkin_dates(k.user_id, now())))
         )
      or exists (
           select 1 from public.reports r
           where r.status in ('pending', 'reviewing') and r.evidence ->> 'photo_path' = p_name
         )
$$;

grant execute on function app.try_uuid(text), app.can_see_proof(uuid, text), app.proof_locked(text)
  to authenticated;

-- Dosya adı işaretlemenin kabul ettiği biçimde olmalı ({uid}/{challenge}/{ad}: harf, rakam, . _ -;
-- uygulama adı üretir, örn. uuid.jpg): yükleme sonradan reddedilecek bir adla başarılı olmasın.
create policy "proofs: upload own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[A-Za-z0-9_-][A-Za-z0-9._-]{0,99}$'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and app.is_active_member((select auth.uid()), app.try_uuid((storage.foldername(name))[2]))
    and not app.proof_locked(name)
  );

create policy "proofs: update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and app.is_active_member((select auth.uid()), app.try_uuid((storage.foldername(name))[2]))
    and not app.proof_locked(name)
  )
  with check (
    bucket_id = 'proofs'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[A-Za-z0-9_-][A-Za-z0-9._-]{0,99}$'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and app.is_active_member((select auth.uid()), app.try_uuid((storage.foldername(name))[2]))
    and not app.proof_locked(name)
  );

create policy "proofs: delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not app.proof_locked(name)
  );

-- Ön süzgeç: kendi klasörü ya da aktif üyesi olduğu challenge'ın klasörü; ardından tam kontrol
create policy "proofs: own and group read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'proofs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (
        app.try_uuid((storage.foldername(name))[2]) = any ((select app.my_challenge_ids('{active}'))::uuid[])
        and app.can_see_proof((select auth.uid()), name)
      )
    )
  );

-- Sahibi kendi dosyasını görür (Storage değiştirme/silme için okuma politikası da ister)
create policy "avatars: owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: upload own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and name ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-][A-Za-z0-9._-]{0,99}$'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (
    bucket_id = 'avatars'
    and name ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-][A-Za-z0-9._-]{0,99}$'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
