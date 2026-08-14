drop policy if exists "media read" on storage.objects;

create policy "media read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'property-media'
  and exists (
    select 1 from public.properties p
    where p.id::text = (storage.foldername(objects.name))[1]
  )
);