-- Gazla veri modeli · 9/10 — Storage: kanıt fotoğrafları (özel) ve profil fotoğrafları.
--
-- proofs: {user_id}/{challenge_id}/{dosya}. Sahibi yazar; aktif grup üyeleri (aralarında engel
-- yoksa) okur. İstemci imzalı URL ile gösterir.
-- avatars: {user_id}/{dosya}. Herkese açık okunur (arama sonuçları, davet kartı); sahibi yazar.

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

create policy "proofs: upload own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and app.is_active_member((select auth.uid()), app.try_uuid((storage.foldername(name))[2]))
  );

create policy "proofs: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "proofs: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "proofs: group read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'proofs'
    and app.can_see_member_activity(
      (select auth.uid()),
      app.try_uuid((storage.foldername(name))[1]),
      app.try_uuid((storage.foldername(name))[2])
    )
  );

create policy "avatars: upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
