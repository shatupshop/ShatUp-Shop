-- ShatUp Shop — Order system v2
-- RUN ORDER: schema.sql -> (other existing migrations) -> orders_coupon_stock.sql -> THIS FILE -> final_security_migration.sql
-- Safe to re-run. Never drops tables or data. Runs in one transaction: if anything fails, nothing changes.
--
-- What this adds
--   * order_items (price snapshots per line) + coupon_redemptions (one row per order = coupon counted once)
--   * validate_coupon()      read-only server-side coupon check (never changes used_count)
--   * place_store_order()    the single entry point for customer orders (validates, prices, stock, coupon, bundle discount)
--   * cancel_store_order()   admin-only, restores stock + coupon exactly once
--   * update_order_status()  admin-only status changes
--   * replace_product_media() admin-only, transactional gallery save (max 3 photos + 3 videos)
begin;

-- ---------------------------------------------------------------- orders table upgrades
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.orders drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending','confirmed','shipped','delivered','cancelled'));

alter table public.orders add column if not exists stock_restored boolean not null default false;
alter table public.orders add column if not exists bundle_discount numeric(12,2) not null default 0;
alter table public.orders add column if not exists updated_at timestamptz not null default now();
alter table public.orders add column if not exists idempotency_key text;
create unique index if not exists orders_idempotency_key_uidx on public.orders(idempotency_key) where idempotency_key is not null;
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_phone_idx on public.orders(customer_phone);

-- orders cancelled by the OLD cancel function already had their stock restored
update public.orders set stock_restored = true where status = 'cancelled' and stock_restored = false;

-- ---------------------------------------------------------------- order_items (price snapshots)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(12,2) not null,
  is_preorder boolean not null default false
);
create index if not exists order_items_order_idx on public.order_items(order_id);
alter table public.order_items enable row level security;

-- back-fill lines for orders created before this migration (only where none exist yet)
insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total, is_preorder)
select o.id,
       (select p.id from public.products p where p.id = (e->>'product_id')::uuid),
       coalesce(e->>'name', 'Product'),
       (e->>'price')::numeric,
       (e->>'quantity')::int,
       (e->>'price')::numeric * (e->>'quantity')::int,
       coalesce((e->>'is_preorder')::boolean, false)
from public.orders o
cross join lateral jsonb_array_elements(o.items) as t(e)
where not exists (select 1 from public.order_items oi where oi.order_id = o.id);

-- ---------------------------------------------------------------- coupon_redemptions
-- order_id is the primary key: one order can consume a coupon at most once, ever.
create table if not exists public.coupon_redemptions (
  order_id uuid primary key references public.orders(id) on delete cascade,
  coupon_id uuid references public.coupons(id) on delete set null,
  redeemed_at timestamptz not null default now(),
  released_at timestamptz
);
alter table public.coupon_redemptions enable row level security;

insert into public.coupon_redemptions (order_id, coupon_id, released_at)
select o.id, c.id, case when o.status = 'cancelled' then coalesce(o.cancelled_at, now()) end
from public.orders o
join public.coupons c on c.code = o.coupon_code
where o.coupon_code is not null
on conflict (order_id) do nothing;

-- ---------------------------------------------------------------- internal helpers
create or replace function public._assert_coupon_usable(c public.coupons, p_subtotal numeric)
returns void language plpgsql stable as $$
begin
  if not coalesce(c.is_active, false) then raise exception 'This coupon is no longer active'; end if;
  if c.expires_at is not null and c.expires_at < now() then raise exception 'This coupon has expired'; end if;
  if c.usage_limit is not null and coalesce(c.used_count, 0) >= c.usage_limit then
    raise exception 'This coupon has reached its usage limit';
  end if;
  if p_subtotal < coalesce(c.min_order_amount, 0) then
    raise exception 'This coupon needs a minimum order of %', coalesce(c.min_order_amount, 0);
  end if;
end $$;

create or replace function public._coupon_discount(c public.coupons, p_subtotal numeric)
returns numeric language plpgsql immutable as $$
declare d numeric;
begin
  if c.discount_type = 'percent' then
    d := p_subtotal * c.discount_value / 100;
    if c.max_discount_amount is not null then d := least(d, c.max_discount_amount); end if;
  elsif c.discount_type = 'fixed' then
    d := c.discount_value;
  else
    raise exception 'Invalid coupon configuration';
  end if;
  return round(least(greatest(d, 0), p_subtotal), 2);
end $$;

create or replace function public._order_json(p_order_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order_id', o.id,
    'order_ref', upper(substr(o.id::text, 1, 8)),
    'status', o.status,
    'subtotal', o.subtotal,
    'discount', o.discount,
    'bundle_discount', coalesce(o.bundle_discount, 0),
    'total', o.total,
    'coupon_code', o.coupon_code,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', i.product_id, 'name', i.product_name, 'price', i.unit_price,
        'quantity', i.quantity, 'line_total', i.line_total, 'is_preorder', i.is_preorder
      ) order by i.product_name)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o where o.id = p_order_id
$$;

revoke all on function public._assert_coupon_usable(public.coupons, numeric) from public;
revoke all on function public._coupon_discount(public.coupons, numeric) from public;
revoke all on function public._order_json(uuid) from public;

-- ---------------------------------------------------------------- validate_coupon (read-only)
-- The subtotal passed in is only used to PREVIEW the discount. place_store_order recomputes everything.
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_code text := nullif(upper(trim(coalesce(p_code, ''))), '');
  c public.coupons;
  v_sub numeric := greatest(coalesce(p_subtotal, 0), 0);
begin
  if v_code is null then raise exception 'Enter a coupon code'; end if;
  select * into c from public.coupons where code = v_code;
  if not found then raise exception 'Invalid coupon code'; end if;
  perform public._assert_coupon_usable(c, v_sub);
  return jsonb_build_object(
    'code', c.code,
    'discount_type', c.discount_type,
    'discount_value', c.discount_value,
    'min_order_amount', coalesce(c.min_order_amount, 0),
    'max_discount_amount', c.max_discount_amount,
    'discount_amount', public._coupon_discount(c, v_sub)
  );
end $$;

-- ---------------------------------------------------------------- place_store_order
create or replace function public.place_store_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_items jsonb,
  p_coupon_code text default null,
  p_idempotency_key text default null,
  p_bundles jsonb default '[]'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_name text := trim(coalesce(p_customer_name, ''));
  v_phone text := regexp_replace(trim(coalesce(p_customer_phone, '')), '[\s-]', '', 'g');
  v_address text := trim(coalesce(p_customer_address, ''));
  v_key text := nullif(trim(coalesce(p_idempotency_key, '')), '');
  v_code text := nullif(upper(trim(coalesce(p_coupon_code, ''))), '');
  v_existing_id uuid;
  v_elem jsonb;
  v_row record;
  v_product public.products;
  v_coupon public.coupons;
  v_items jsonb := '[]'::jsonb;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_bundle_discount numeric(12,2) := 0;
  v_total numeric(12,2);
  v_order_id uuid;
  v_b jsonb;
  v_pair_total numeric(12,2);
  v_main_price numeric(12,2);
  v_main_qty int;
  v_main_preorder boolean;
  v_partner_price numeric(12,2);
  v_partner_qty int;
  v_partner_preorder boolean;
  v_used jsonb := '{}'::jsonb;
begin
  if length(v_name) < 2 or length(v_name) > 100 then raise exception 'Please enter your name'; end if;
  if v_phone !~ '^\+?[0-9]{10,15}$' then raise exception 'Please enter a valid phone number'; end if;
  if length(v_address) < 5 or length(v_address) > 300 then raise exception 'Please enter your full address'; end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;
  if jsonb_array_length(p_items) > 30 then raise exception 'Too many items in one order'; end if;
  for v_elem in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_elem) <> 'object'
       or coalesce(v_elem->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or coalesce(v_elem->>'quantity', '') !~ '^[1-9][0-9]{0,2}$' then
      raise exception 'Invalid cart item';
    end if;
  end loop;

  -- Bundle claims: [{main_product_id, partner_product_id, main_qty}]. The
  -- discount is re-derived below from database prices; the client's amount
  -- is never trusted, and a claim that does not match the order is skipped.
  if p_bundles is not null and jsonb_typeof(p_bundles) <> 'array' then
    raise exception 'Invalid bundle';
  end if;
  if p_bundles is not null and jsonb_array_length(p_bundles) > 30 then
    raise exception 'Too many bundles in one order';
  end if;
  if p_bundles is not null then
    for v_b in select value from jsonb_array_elements(p_bundles) loop
      if jsonb_typeof(v_b) <> 'object'
         or coalesce(v_b->>'main_product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         or coalesce(v_b->>'partner_product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         or coalesce(v_b->>'main_qty', '') !~ '^[1-9][0-9]{0,2}$' then
        raise exception 'Invalid bundle';
      end if;
    end loop;
  end if;

  -- A repeated submit with the same key returns the order that already exists (no second order, no second stock deduction).
  if v_key is not null then
    perform pg_advisory_xact_lock(hashtextextended(v_key, 0));
    select id into v_existing_id from public.orders where idempotency_key = v_key;
    if found then return public._order_json(v_existing_id); end if;
  end if;

  -- basic spam guard
  if (select count(*) from public.orders where customer_phone = v_phone and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many orders from this phone number. Please try again later.';
  end if;

  -- Lock products in a fixed order (by id) so concurrent carts cannot deadlock.
  for v_row in
    select (t.e->>'product_id')::uuid as pid, sum((t.e->>'quantity')::int) as qty
    from jsonb_array_elements(p_items) as t(e)
    group by 1 order by 1
  loop
    if v_row.qty > 99 then raise exception 'Invalid item quantity'; end if;
    select * into v_product from public.products where id = v_row.pid for update;
    if not found then raise exception 'A product in your cart no longer exists'; end if;
    if coalesce(v_product.is_sold_out, false) then raise exception '% is sold out', v_product.name; end if;
    -- Pre-orders follow their own rule: they never touch inventory (the admin closes them with Sold Out).
    if not coalesce(v_product.is_preorder, false) then
      if coalesce(v_product.stock, 0) < v_row.qty then
        raise exception 'Not enough stock for % (available: %)', v_product.name, coalesce(v_product.stock, 0);
      end if;
      update public.products set stock = stock - v_row.qty where id = v_product.id;
    end if;
    v_subtotal := v_subtotal + (v_product.price * v_row.qty);
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id, 'name', v_product.name, 'price', v_product.price,
      'quantity', v_row.qty, 'line_total', v_product.price * v_row.qty,
      'is_preorder', coalesce(v_product.is_preorder, false)));
  end loop;

  if v_code is not null then
    select * into v_coupon from public.coupons where code = v_code for update;
    if not found then raise exception 'Invalid coupon code'; end if;
    perform public._assert_coupon_usable(v_coupon, v_subtotal);
    v_discount := public._coupon_discount(v_coupon, v_subtotal);
    update public.coupons set used_count = coalesce(used_count, 0) + 1 where id = v_coupon.id;
  end if;

  -- Bundle discount: 10% off each claimed main + partner pair that is actually
  -- in this order (same formula as the shop: pair total - round(pair total * 0.9)).
  -- Quantities already used by an earlier bundle in this same order are consumed,
  -- so the same units cannot discount twice. A claim that does not match the
  -- order (stale client state) is skipped, never an error — the order goes through.
  if p_bundles is not null then
    for v_b in select value from jsonb_array_elements(p_bundles) loop
      if v_b->>'main_product_id' = v_b->>'partner_product_id' then continue; end if;
      select (x->>'price')::numeric, (x->>'quantity')::int, (x->>'is_preorder')::boolean
        into v_main_price, v_main_qty, v_main_preorder
      from jsonb_array_elements(v_items) as t(x)
      where x->>'product_id' = v_b->>'main_product_id';
      if not found then continue; end if;
      select (x->>'price')::numeric, (x->>'quantity')::int, (x->>'is_preorder')::boolean
        into v_partner_price, v_partner_qty, v_partner_preorder
      from jsonb_array_elements(v_items) as t(x)
      where x->>'product_id' = v_b->>'partner_product_id';
      if not found then continue; end if;
      if coalesce(v_main_preorder, false) or coalesce(v_partner_preorder, false) then continue; end if;
      v_main_qty := v_main_qty - coalesce((v_used->>(v_b->>'main_product_id'))::int, 0);
      v_partner_qty := v_partner_qty - coalesce((v_used->>(v_b->>'partner_product_id'))::int, 0);
      if v_main_qty >= (v_b->>'main_qty')::int and v_partner_qty >= 1 then
        v_pair_total := v_main_price * (v_b->>'main_qty')::int + v_partner_price;
        v_bundle_discount := v_bundle_discount + (v_pair_total - round(v_pair_total * 0.9));
        v_used := jsonb_set(v_used, array[v_b->>'main_product_id'],
          to_jsonb(coalesce((v_used->>(v_b->>'main_product_id'))::int, 0) + (v_b->>'main_qty')::int));
        v_used := jsonb_set(v_used, array[v_b->>'partner_product_id'],
          to_jsonb(coalesce((v_used->>(v_b->>'partner_product_id'))::int, 0) + 1));
      end if;
    end loop;
  end if;

  v_total := greatest(v_subtotal - v_discount - v_bundle_discount, 0);

  insert into public.orders (customer_name, customer_phone, customer_address, items, subtotal, discount, bundle_discount, total, coupon_code, idempotency_key)
  values (v_name, v_phone, v_address, v_items, v_subtotal, v_discount, v_bundle_discount, v_total, v_code, v_key)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total, is_preorder)
  select v_order_id, (x->>'product_id')::uuid, x->>'name', (x->>'price')::numeric,
         (x->>'quantity')::int, (x->>'line_total')::numeric, (x->>'is_preorder')::boolean
  from jsonb_array_elements(v_items) as t(x);

  if v_code is not null then
    insert into public.coupon_redemptions (order_id, coupon_id) values (v_order_id, v_coupon.id);
  end if;

  return public._order_json(v_order_id);
end $$;

-- backwards-compatible wrapper (old signature, returns only the id)
create or replace function public.create_store_order(
  p_customer_name text, p_customer_phone text, p_customer_address text,
  p_items jsonb, p_coupon_code text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
begin
  return (public.place_store_order(p_customer_name, p_customer_phone, p_customer_address, p_items, p_coupon_code, null)->>'order_id')::uuid;
end $$;

-- ---------------------------------------------------------------- cancel (admin only, idempotent)
create or replace function public.cancel_store_order(p_order_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_red public.coupon_redemptions;
  v_line record;
begin
  if not public.is_admin() then raise exception 'Only the store admin can cancel orders'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status = 'cancelled' then return false; end if;           -- repeated cancel does nothing
  if v_order.status = 'delivered' then raise exception 'Delivered orders cannot be cancelled'; end if;

  if not v_order.stock_restored then
    for v_line in
      select product_id, quantity from public.order_items
      where order_id = p_order_id and not is_preorder and product_id is not null
      order by product_id
    loop
      update public.products set stock = stock + v_line.quantity where id = v_line.product_id;
    end loop;
  end if;

  select * into v_red from public.coupon_redemptions where order_id = p_order_id for update;
  if found and v_red.released_at is null and v_red.coupon_id is not null then
    update public.coupons set used_count = greatest(coalesce(used_count, 0) - 1, 0) where id = v_red.coupon_id;
    update public.coupon_redemptions set released_at = now() where order_id = p_order_id;
  end if;

  update public.orders
     set status = 'cancelled', cancelled_at = now(), stock_restored = true, updated_at = now()
   where id = p_order_id;
  return true;
end $$;

-- ---------------------------------------------------------------- status updates (admin only)
create or replace function public.update_order_status(p_order_id uuid, p_status text) returns text
language plpgsql security definer set search_path = public as $$
declare v_current text;
begin
  if not public.is_admin() then raise exception 'Only the store admin can update orders'; end if;
  if p_status not in ('pending','confirmed','shipped','delivered','cancelled') then
    raise exception 'Invalid status';
  end if;
  if p_status = 'cancelled' then
    perform public.cancel_store_order(p_order_id);
    return 'cancelled';
  end if;
  select status into v_current from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_current = 'cancelled' then
    raise exception 'A cancelled order cannot be re-opened (its stock was already returned). Ask the customer to order again.';
  end if;
  update public.orders set status = p_status, updated_at = now() where id = p_order_id;
  return p_status;
end $$;

-- ---------------------------------------------------------------- product gallery: max 3 photos + 3 videos
create or replace function public.enforce_product_media_limit() returns trigger
language plpgsql as $$
declare n int;
begin
  select count(*) into n from public.product_media where product_id = new.product_id and media_type = new.media_type;
  if n >= 3 then raise exception 'A product can have at most 3 photos and 3 videos'; end if;
  return new;
end $$;
drop trigger if exists product_media_limit on public.product_media;
create trigger product_media_limit before insert on public.product_media
  for each row execute function public.enforce_product_media_limit();

create or replace function public.replace_product_media(p_product_id uuid, p_media jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_img int; v_vid int; v_cover text;
begin
  if not public.is_admin() then raise exception 'Only the store admin can edit product media'; end if;
  if not exists (select 1 from public.products where id = p_product_id) then raise exception 'Product not found'; end if;
  if p_media is null or jsonb_typeof(p_media) <> 'array' then raise exception 'Invalid media list'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_media) as t(m)
    where coalesce(m->>'media_type', '') not in ('image','video') or coalesce(m->>'url', '') !~ '^https://'
  ) then raise exception 'Every media item needs an https URL and a type of image or video'; end if;

  select count(*) filter (where m->>'media_type' = 'image'),
         count(*) filter (where m->>'media_type' = 'video')
    into v_img, v_vid from jsonb_array_elements(p_media) as t(m);
  if v_img > 3 then raise exception 'Maximum 3 photos per product'; end if;
  if v_vid > 3 then raise exception 'Maximum 3 videos per product'; end if;

  delete from public.product_media where product_id = p_product_id;
  insert into public.product_media (product_id, url, media_type, sort_order)
  select p_product_id, m->>'url', m->>'media_type', (ord - 1)::int
  from jsonb_array_elements(p_media) with ordinality as t(m, ord);

  select m->>'url' into v_cover from jsonb_array_elements(p_media) with ordinality as t(m, ord)
   where m->>'media_type' = 'image' order by ord limit 1;
  update public.products set image_url = v_cover where id = p_product_id;
end $$;

-- ---------------------------------------------------------------- grants
revoke all on function public.validate_coupon(text, numeric) from public;
revoke all on function public.place_store_order(text, text, text, jsonb, text, text) from public;
revoke all on function public.create_store_order(text, text, text, jsonb, text) from public;
revoke all on function public.cancel_store_order(uuid) from public;
revoke all on function public.update_order_status(uuid, text) from public;
revoke all on function public.replace_product_media(uuid, jsonb) from public;

grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;
grant execute on function public.place_store_order(text, text, text, jsonb, text, text) to anon, authenticated;
grant execute on function public.create_store_order(text, text, text, jsonb, text) to anon, authenticated;
grant execute on function public.cancel_store_order(uuid) to authenticated;
grant execute on function public.update_order_status(uuid, text) to authenticated;
grant execute on function public.replace_product_media(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------- admin read access to the new tables
drop policy if exists "Admin can view order items" on public.order_items;
create policy "Admin can view order items" on public.order_items for select to authenticated using (public.is_admin());
drop policy if exists "Admin can view coupon redemptions" on public.coupon_redemptions;
create policy "Admin can view coupon redemptions" on public.coupon_redemptions for select to authenticated using (public.is_admin());

commit;

-- ROLLBACK GUIDANCE (does not delete data):
--   drop function if exists public.place_store_order(text,text,text,jsonb,text,text);
--   drop function if exists public.validate_coupon(text,numeric);
--   drop function if exists public.update_order_status(uuid,text);
--   drop function if exists public.replace_product_media(uuid,jsonb);
--   drop trigger if exists product_media_limit on public.product_media;
--   then re-run supabase/orders_coupon_stock.sql to restore the previous create/cancel functions.
--   The tables order_items / coupon_redemptions can stay; they are harmless.
