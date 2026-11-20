-- ShatUp Shop — OPTIONAL but RECOMMENDED security hardening
-- PROBLEM: every write policy says "to authenticated". If "Allow new users to sign up"
-- is ON in Supabase (default), anyone can create an account with the public anon key
-- and then add/edit/delete products, banners, coupons and storage files.
-- FIX: only emails listed in admin_users may write.
--
-- 1) EDIT the email below (your admin login).  2) Run the whole file once.
-- It runs as one transaction: if anything fails, nothing changes.
-- (Also turn OFF "Allow new users to sign up" in Authentication -> Providers -> Email.)
begin;

create table if not exists public.admin_users (email text primary key);
alter table public.admin_users enable row level security;   -- no policies = not readable via the API

insert into public.admin_users (email) values (lower('CHANGE_ME@example.com')) on conflict do nothing;  -- <== EDIT

do $$ begin
  if exists (select 1 from public.admin_users where email = 'change_me@example.com') then
    raise exception 'Edit the admin email in this file first (search for CHANGE_ME)';
  end if;
end $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where email = lower(auth.jwt() ->> 'email'))
$$;

do $$
declare r record; t text;
begin
  -- drop old "any logged-in user" write policies
  for r in
    select schemaname, tablename, policyname from pg_policies
    where cmd in ('INSERT','UPDATE','DELETE') and 'authenticated' = any(roles)
      and ((schemaname = 'public' and tablename in ('products','banners','collections','coupons','promo_banners','product_media'))
        or (schemaname = 'storage' and tablename = 'objects' and (policyname ilike '%images%' or policyname ilike '%media%')))
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;

  -- admin-only write policies
  foreach t in array array['products','banners','collections','coupons','promo_banners','product_media'] loop
    execute format('create policy "Admin insert %1$s" on public.%1$I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "Admin update %1$s" on public.%1$I for update to authenticated using (public.is_admin())', t);
    execute format('create policy "Admin delete %1$s" on public.%1$I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

create policy "Admin insert store images" on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images','banner-images','collection-images','promo-images','product-media') and public.is_admin());
create policy "Admin update store images" on storage.objects for update to authenticated
  using (bucket_id in ('product-images','banner-images','collection-images','promo-images','product-media') and public.is_admin());
create policy "Admin delete store images" on storage.objects for delete to authenticated
  using (bucket_id in ('product-images','banner-images','collection-images','promo-images','product-media') and public.is_admin());

-- promo banners: the admin sees everything, public sees only live ones
drop policy if exists "Public can view live promo banners" on public.promo_banners;
create policy "Public can view live promo banners" on public.promo_banners for select
  using (public.is_admin() or (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())));

commit;
