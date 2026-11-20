-- ShatUp Shop — Supabase schema
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query)

-- 1. Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_bn text,                          -- optional Bangla name
  description text,
  category text not null,
  price numeric not null,                -- current selling price (BDT)
  original_price numeric,                -- optional pre-discount price
  discount_percent int default 0,
  stock int default 0,
  rating numeric default 4.5,
  image_url text,
  is_flash_sale boolean default false,
  is_new_arrival boolean default false,
  created_at timestamptz default now()
);

-- 2. Row Level Security
alter table public.products enable row level security;

-- Anyone (anon) can READ products — needed for the public storefront
create policy "Public can view products"
  on public.products for select
  using (true);

-- Only authenticated users (the admin) can insert/update/delete
create policy "Authenticated users can insert products"
  on public.products for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update products"
  on public.products for update
  to authenticated
  using (true);

create policy "Authenticated users can delete products"
  on public.products for delete
  to authenticated
  using (true);

-- 3. Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Authenticated users can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "Authenticated users can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

create policy "Authenticated users can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- 4. Banners table (Home page carousel, managed from /admin)
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  button_text text,
  button_link text,
  image_url text not null,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- if this table already existed before video banners were added, this
-- brings it up to date without touching existing rows (they default to 'image')
alter table public.banners
  add column if not exists media_type text not null default 'image';
alter table public.banners
  drop constraint if exists banners_media_type_check;
alter table public.banners
  add constraint banners_media_type_check check (media_type in ('image', 'video'));

alter table public.banners enable row level security;

create policy "Public can view active banners"
  on public.banners for select
  using (true);

create policy "Authenticated users can insert banners"
  on public.banners for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update banners"
  on public.banners for update
  to authenticated
  using (true);

create policy "Authenticated users can delete banners"
  on public.banners for delete
  to authenticated
  using (true);

-- 5. Storage bucket for banner images
insert into storage.buckets (id, name, public)
values ('banner-images', 'banner-images', true)
on conflict (id) do nothing;

create policy "Public can view banner images"
  on storage.objects for select
  using (bucket_id = 'banner-images');

create policy "Authenticated users can upload banner images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'banner-images');

create policy "Authenticated users can update banner images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'banner-images');

create policy "Authenticated users can delete banner images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'banner-images');

-- 6. Collections table (small promo grid on the home page, managed from /admin)
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  button_link text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.collections enable row level security;

create policy "Public can view active collections"
  on public.collections for select
  using (true);

create policy "Authenticated users can insert collections"
  on public.collections for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update collections"
  on public.collections for update
  to authenticated
  using (true);

create policy "Authenticated users can delete collections"
  on public.collections for delete
  to authenticated
  using (true);

-- 7. Storage bucket for collection images
insert into storage.buckets (id, name, public)
values ('collection-images', 'collection-images', true)
on conflict (id) do nothing;

create policy "Public can view collection images"
  on storage.objects for select
  using (bucket_id = 'collection-images');

create policy "Authenticated users can upload collection images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'collection-images');

create policy "Authenticated users can update collection images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'collection-images');

create policy "Authenticated users can delete collection images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'collection-images');

-- 8. Coupons table (discount codes, managed from /admin)
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,             -- always stored/matched as UPPERCASE
  discount_type text not null default 'percent',   -- 'percent' | 'fixed'
  discount_value numeric not null,       -- 10 = 10% (percent) or ৳10 (fixed)
  min_order_amount numeric default 0,    -- cart subtotal must be >= this
  max_discount_amount numeric,           -- optional cap for percent coupons
  usage_limit int,                       -- optional total-uses cap, null = unlimited
  used_count int default 0,
  is_active boolean default true,
  expires_at timestamptz,                -- optional expiry, null = never
  created_at timestamptz default now()
);

alter table public.coupons enable row level security;

-- Anyone (anon) can READ active coupons — needed so the storefront can
-- validate a code the customer types in at checkout
create policy "Public can view active coupons"
  on public.coupons for select
  using (true);

create policy "Authenticated users can insert coupons"
  on public.coupons for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update coupons"
  on public.coupons for update
  to authenticated
  using (true);

create policy "Authenticated users can delete coupons"
  on public.coupons for delete
  to authenticated
  using (true);

-- 9. Create your admin login
-- Go to Authentication -> Users -> Add user in the Supabase dashboard
-- and create one user (e.g. admin@shatup.shop + a strong password).
-- That user logs in at /admin on the website.

-- 10. Promo strip (top slider) — see also supabase/promo_banners.sql

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

-- 11. Product gallery + stock-out switch — see also supabase/product_media_stockout.sql

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

-- 12. Pre-order — see also supabase/preorder.sql
alter table public.products
  add column if not exists is_preorder boolean not null default false,
  add column if not exists preorder_eta text;   -- e.g. "7-10 days"
