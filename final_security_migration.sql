-- ShatUp Shop — FINAL SECURITY MIGRATION
-- RUN LAST (after schema.sql, the feature migrations, and order_system_v2.sql).
-- Safe to re-run. Never drops tables or data. One transaction: if anything fails, nothing changes.
--
-- Your existing authorized admin is PRESERVED: this file does not insert or change any admin email.
-- It only checks that public.admin_users already contains at least one email (created earlier by
-- harden_admin_policies.sql). If the table is empty/missing you get a clear message and nothing is changed.
-- To add or fix an admin email, run separately:  insert into public.admin_users(email) values (lower('you@example.com'));
--
-- Customer registration is NOT disabled by this file. Customers use localStorage profiles (no accounts),
-- so Supabase "Allow new users to sign up" should be OFF in the dashboard; even if it stays ON,
-- a self-registered user gets NO write access because every write policy below requires is_admin().
begin;

create table if not exists public.admin_users (email text primary key);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

do $$
begin
  if not exists (select 1 from public.admin_users) then
    raise exception 'admin_users is empty. Add your admin email first: insert into public.admin_users(email) values (lower(''you@example.com'')); then run this file again.';
  end if;
  if exists (select 1 from public.admin_users where email = 'change_me@example.com') then
    raise exception 'admin_users still contains the CHANGE_ME placeholder. Delete it and insert your real admin email first.';
  end if;
end $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where email = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;

-- ------------------------------------------------------------------ table write policies: admin only
do $$
declare r record; t text;
begin
  foreach t in array array['products','banners','collections','coupons','promo_banners','product_media'] loop
    if to_regclass('public.' || t) is null then continue; end if;

    -- remove every existing INSERT/UPDATE/DELETE/ALL policy (including the old "any logged-in user" ones)
    for r in select policyname from pg_policies
             where schemaname = 'public' and tablename = t and cmd in ('INSERT','UPDATE','DELETE','ALL')
    loop
      execute format('drop policy %I on public.%I', r.policyname, t);
    end loop;

    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', 'Admin insert ' || t, t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', 'Admin update ' || t, t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', 'Admin delete ' || t, t);
  end loop;
end $$;

-- ------------------------------------------------------------------ coupons are private
-- Previously ANYONE could read every coupon code. Customers now validate through validate_coupon() only.
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'coupons' and cmd = 'SELECT' loop
    execute format('drop policy %I on public.coupons', r.policyname);
  end loop;
end $$;
create policy "Admin select coupons" on public.coupons for select to authenticated using (public.is_admin());

-- ------------------------------------------------------------------ orders: no direct writes by anyone
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.coupon_redemptions enable row level security;

do $$
declare r record; t text;
begin
  foreach t in array array['orders','order_items','coupon_redemptions'] loop
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = t and cmd in ('INSERT','UPDATE','DELETE','ALL') loop
      execute format('drop policy %I on public.%I', r.policyname, t);
    end loop;
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
    execute format('revoke select on public.%I from anon', t);
  end loop;
end $$;

drop policy if exists "Admin can view orders" on public.orders;
create policy "Admin can view orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "Admin can view order items" on public.order_items;
create policy "Admin can view order items" on public.order_items for select to authenticated using (public.is_admin());
drop policy if exists "Admin can view coupon redemptions" on public.coupon_redemptions;
create policy "Admin can view coupon redemptions" on public.coupon_redemptions for select to authenticated using (public.is_admin());

-- ------------------------------------------------------------------ promo banners: public sees only live ones
drop policy if exists "Public can view live promo banners" on public.promo_banners;
create policy "Public can view live promo banners" on public.promo_banners for select
  using (public.is_admin() or (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())));

-- ------------------------------------------------------------------ storage buckets
-- Public buckets serve files by URL without any SELECT policy, so we remove the public SELECT policies
-- (they only allowed *listing* every file through the API) and make writes admin-only.
do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~ '(product-images|banner-images|collection-images|promo-images|product-media)'
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;

create policy "Admin select store files" on storage.objects for select to authenticated
  using (bucket_id in ('product-images','banner-images','collection-images','promo-images','product-media') and public.is_admin());
create policy "Admin insert store files" on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images','banner-images','collection-images','promo-images','product-media') and public.is_admin());
create policy "Admin update store files" on storage.objects for update to authenticated
  using (bucket_id in ('product-images','banner-images','collection-images','promo-images','product-media') and public.is_admin());
create policy "Admin delete store files" on storage.objects for delete to authenticated
  using (bucket_id in ('product-images','banner-images','collection-images','promo-images','product-media') and public.is_admin());

-- product-media: only JPEG/PNG/WebP/GIF images and MP4/WebM video, 25 MB max per file
insert into storage.buckets (id, name, public) values ('product-media', 'product-media', true) on conflict (id) do nothing;
update storage.buckets
   set public = true,
       file_size_limit = 26214400,
       allowed_mime_types = array['image/webp','image/jpeg','image/png','image/gif','video/mp4','video/webm']
 where id = 'product-media';

commit;

-- ROLLBACK GUIDANCE:
--   This file only tightens permissions. To loosen again, re-run supabase/harden_admin_policies.sql
--   (older, equivalent admin-only policies) and re-create a public SELECT policy on the storage buckets if you need listing.
--   No data is modified by this file.
