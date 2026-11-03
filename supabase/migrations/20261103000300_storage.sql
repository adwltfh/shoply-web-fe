-- Shoply shared backend — Storage buckets and object policies.
--
-- product-images: public read (catalog media), writes limited to store staff
-- who can manage the catalog. Object keys: {store_id}/{product_id}/{uuid}.{ext}
-- Payment proofs will get a separate PRIVATE bucket in the checkout phase.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_staff_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and private.can_manage_catalog(private.try_uuid((storage.foldername(name))[1]))
  );

create policy product_images_staff_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and private.can_manage_catalog(private.try_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'product-images'
    and private.can_manage_catalog(private.try_uuid((storage.foldername(name))[1]))
  );

create policy product_images_staff_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and private.can_manage_catalog(private.try_uuid((storage.foldername(name))[1]))
  );

-- Staff may list their own store's objects (public URLs serve reads for buyers).
create policy product_images_staff_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'product-images'
    and private.is_store_member(private.try_uuid((storage.foldername(name))[1]))
  );
