-- ShatUp Shop — multiple product images/videos + manual Stock Out switch
-- Run ONCE in Supabase SQL Editor. Safe to re-run. Existing products keep working
-- (their current image_url is still used as the cover / fallback).

-- 1. manual sold-out switch (works together with stock = 0)
alter table public.products
  add column if not exists is_sold_out boolean not null default false;

-- 2. gallery items (images + videos) per product
create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  media_type text not null default 'image' check (media_type in ('image','video')),
  sort_order int not null default 0,
  created_at timestamptz default now()
);
create index if not exists product_media_product_idx on public.product_media (product_id, sort_order);

alter table public.product_media enable row level security;

drop policy if exists "Public can view product media" on public.product_media;
create policy "Public can view product media" on public.product_media for select using (true);
drop policy if exists "Authenticated users can insert product media" on public.product_media;
create policy "Authenticated users can insert product media" on public.product_media for insert to authenticated with check (true);
drop policy if exists "Authenticated users can update product media" on public.product_media;
create policy "Authenticated users can update product media" on public.product_media for update to authenticated using (true);
drop policy if exists "Authenticated users can delete product media" on public.product_media;
create policy "Authenticated users can delete product media" on public.product_media for delete to authenticated using (true);

-- 3. storage bucket: images + short videos only, max 25 MB each
insert into storage.buckets (id, name, public) values ('product-media', 'product-media', true)
on conflict (id) do nothing;

update storage.buckets
   set file_size_limit = 26214400,
       allowed_mime_types = array['image/webp','image/jpeg','image/png','image/gif','video/mp4','video/webm']
 where id = 'product-media';

drop policy if exists "Public can view product media files" on storage.objects;
create policy "Public can view product media files" on storage.objects for select using (bucket_id = 'product-media');
drop policy if exists "Authenticated users can upload product media files" on storage.objects;
create policy "Authenticated users can upload product media files" on storage.objects for insert to authenticated with check (bucket_id = 'product-media');
drop policy if exists "Authenticated users can update product media files" on storage.objects;
create policy "Authenticated users can update product media files" on storage.objects for update to authenticated using (bucket_id = 'product-media');
drop policy if exists "Authenticated users can delete product media files" on storage.objects;
create policy "Authenticated users can delete product media files" on storage.objects for delete to authenticated using (bucket_id = 'product-media');
