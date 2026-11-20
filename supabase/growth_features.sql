-- ShatUp Shop — Growth features (reviews, order tracking, flash-sale progress)
-- RUN ORDER: run this file LAST (after final_security_migration.sql, because it uses is_admin()).
-- Safe to re-run. Never drops tables or data.
begin;

-- ------------------------------------------------------------ flash sale progress bar
-- admin enters the total quantity put on flash sale; "% sold" = (total - stock) / total
alter table public.products add column if not exists flash_total int check (flash_total is null or flash_total > 0);

-- ------------------------------------------------------------ customer reviews (admin-approved)
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists product_reviews_product_idx on public.product_reviews(product_id, is_approved);
alter table public.product_reviews enable row level security;

drop policy if exists "Public can read approved reviews" on public.product_reviews;
create policy "Public can read approved reviews" on public.product_reviews
  for select using (is_approved or public.is_admin());
drop policy if exists "Admin update reviews" on public.product_reviews;
create policy "Admin update reviews" on public.product_reviews
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin delete reviews" on public.product_reviews;
create policy "Admin delete reviews" on public.product_reviews
  for delete to authenticated using (public.is_admin());
-- (no INSERT policy on purpose: customers can only add reviews through submit_review below)

create or replace function public.submit_review(p_product_id uuid, p_name text, p_rating int, p_comment text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_name text := left(trim(coalesce(p_name, '')), 60);
        v_comment text := left(trim(coalesce(p_comment, '')), 600);
begin
  if length(v_name) < 2 then raise exception 'Please enter your name'; end if;
  if length(v_comment) < 3 then raise exception 'Please write a short review'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Rating must be 1 to 5'; end if;
  if not exists (select 1 from public.products where id = p_product_id) then raise exception 'Product not found'; end if;
  -- simple spam guard: max 3 waiting reviews per product per name
  if (select count(*) from public.product_reviews
      where product_id = p_product_id and lower(customer_name) = lower(v_name) and not is_approved) >= 3 then
    raise exception 'Your earlier reviews are still waiting for approval';
  end if;
  insert into public.product_reviews (product_id, customer_name, rating, comment)
  values (p_product_id, v_name, p_rating, v_comment);
  return true;
end $$;

-- ------------------------------------------------------------ order tracking (order ID + phone)
create or replace function public.track_order(p_order_ref text, p_phone text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_id uuid; v_created timestamptz; v_updated timestamptz;
        v_digits text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
begin
  if length(trim(coalesce(p_order_ref, ''))) < 6 or length(v_digits) < 10 then return null; end if;
  select o.id, o.created_at, o.updated_at into v_id, v_created, v_updated
  from public.orders o
  where upper(substr(o.id::text, 1, 8)) = upper(trim(p_order_ref))
    and right(regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g'), 10) = v_digits
  limit 1;
  if v_id is null then return null; end if;
  return public._order_json(v_id) || jsonb_build_object('created_at', v_created, 'updated_at', v_updated);
end $$;

revoke all on function public.submit_review(uuid, text, int, text) from public;
revoke all on function public.track_order(text, text) from public;
grant execute on function public.submit_review(uuid, text, int, text) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;

commit;
