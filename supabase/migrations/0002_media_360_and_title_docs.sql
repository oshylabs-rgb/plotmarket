-- Plotmarket migration 0002
-- Adds 360°/3D media support and Nigerian title-document disclosure to properties.
-- Safe to re-run: every statement is guarded.

-- ---------------------------------------------------------------
-- 1. 360°/3D media columns
-- ---------------------------------------------------------------
alter table public.properties
  add column if not exists images_360 text[] not null default '{}',
  add column if not exists videos_360 text[] not null default '{}';

comment on column public.properties.images_360 is
  'Public URLs of equirectangular (360°) still images, rendered in the panoramic viewer.';
comment on column public.properties.videos_360 is
  'Public URLs of equirectangular (360°) videos, rendered in the panoramic viewer.';

-- ---------------------------------------------------------------
-- 2. Title document disclosure
-- ---------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'title_document_type') then
    create type public.title_document_type as enum (
      'c_of_o',
      'governors_consent',
      'deed_of_assignment',
      'excision',
      'gazette',
      'registered_survey',
      'allocation_letter',
      'family_receipt',
      'unknown'
    );
  end if;
end $$;

alter table public.properties
  add column if not exists title_document public.title_document_type not null default 'unknown';

comment on column public.properties.title_document is
  'Title document the seller states is available. Self declared, never verified by Plotmarket.';

-- ---------------------------------------------------------------
-- 3. Storage bucket for property media
--    (idempotent — the bucket already exists from migration 0001)
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------
-- 4. Storage RLS: owners write into their own folder, everyone reads
--    Paths are stored as {user_id}/{property_id}/{filename}
-- ---------------------------------------------------------------
drop policy if exists "property_media_public_read" on storage.objects;
create policy "property_media_public_read"
  on storage.objects for select
  using (bucket_id = 'property-media');

drop policy if exists "property_media_owner_insert" on storage.objects;
create policy "property_media_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property_media_owner_update" on storage.objects;
create policy "property_media_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property_media_owner_delete" on storage.objects;
create policy "property_media_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------
-- 5. Helpful index for the public listings feed
-- ---------------------------------------------------------------
create index if not exists properties_status_created_idx
  on public.properties (status, is_featured desc, created_at desc);
