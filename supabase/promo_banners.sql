-- ShatUp Shop — Promo Strip (Daraz-style top slider)
-- Run ONCE in Supabase SQL Editor. Safe to re-run. Does not touch existing tables.

create table if not exists public.promo_banners (
  id uuid primary key default gen_random_uuid(),
  title text,                                   -- used as image alt text + admin label
  image_url text not null,
  link_type text not null default 'none'
    check (link_type in ('none','url','product','category')),
  link_value text,                              -- url | product id | category name
  starts_at timestamptz,                        -- null = starts immediately
  ends_at timestamptz,                          -- null = never expires
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table public.promo_banners enable row level security;

-- Public only ever receives banners that are active AND inside their date window.
-- The admin (authenticated) can read everything.
drop policy if exists "Public can view live promo banners" on public.promo_banners;
create policy "Public can view live promo banners"
  on public.promo_banners for select
  using (
    auth.role() = 'authenticated'
    or (
      is_active
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
    )
  );

drop policy if exists "Authenticated users can insert promo banners" on public.promo_banners;
create policy "Authenticated users can insert promo banners"
  on public.promo_banners for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update promo banners" on public.promo_banners;
create policy "Authenticated users can update promo banners"
  on public.promo_banners for update to authenticated using (true);

drop policy if exists "Authenticated users can delete promo banners" on public.promo_banners;
create policy "Authenticated users can delete promo banners"
  on public.promo_banners for delete to authenticated using (true);

-- Storage bucket for promo images
insert into storage.buckets (id, name, public)
values ('promo-images', 'promo-images', true)
on conflict (id) do nothing;

-- images only, max 5 MB (blocks anyone uploading videos/executables/huge files)
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/webp','image/jpeg','image/png','image/gif']
 where id = 'promo-images';

drop policy if exists "Public can view promo images" on storage.objects;
create policy "Public can view promo images"
  on storage.objects for select using (bucket_id = 'promo-images');

drop policy if exists "Authenticated users can upload promo images" on storage.objects;
create policy "Authenticated users can upload promo images"
  on storage.objects for insert to authenticated with check (bucket_id = 'promo-images');

drop policy if exists "Authenticated users can update promo images" on storage.objects;
create policy "Authenticated users can update promo images"
  on storage.objects for update to authenticated using (bucket_id = 'promo-images');

drop policy if exists "Authenticated users can delete promo images" on storage.objects;
create policy "Authenticated users can delete promo images"
  on storage.objects for delete to authenticated using (bucket_id = 'promo-images');
