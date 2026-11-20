-- NOTE: this is the FIRST-generation order migration. After running supabase/order_system_v2.sql do NOT re-run this file:
-- it would replace the v2 cancel function with the older one.
-- ShatUp Shop: atomic orders, coupon usage, stock deduction and cancellation.
-- Run AFTER schema.sql and harden_admin_policies.sql in Supabase SQL Editor.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  items jsonb not null,
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  coupon_code text,
  status text not null default 'pending' check (status in ('pending','cancelled')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
alter table public.orders enable row level security;
drop policy if exists "Admin can view orders" on public.orders;
create policy "Admin can view orders" on public.orders for select to authenticated using (public.is_admin());

create or replace function public.create_store_order(
  p_customer_name text, p_customer_phone text, p_customer_address text,
  p_items jsonb, p_coupon_code text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_order_id uuid; v_item jsonb; v_product products%rowtype;
 v_items jsonb := '[]'::jsonb; v_subtotal numeric(12,2) := 0;
 v_discount numeric(12,2) := 0; v_total numeric(12,2); v_qty int;
 v_coupon coupons%rowtype; v_code text := nullif(upper(trim(coalesce(p_coupon_code,''))), '');
begin
 if length(trim(coalesce(p_customer_name,''))) < 2 or length(trim(coalesce(p_customer_phone,''))) < 6 or length(trim(coalesce(p_customer_address,''))) < 5 then raise exception 'Customer name, phone and address are required'; end if;
 if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;
 -- Deterministic lock order avoids deadlocks when concurrent carts share products.
 for v_item in select value from jsonb_array_elements(p_items) order by (value->>'product_id') loop
   v_qty := (v_item->>'quantity')::int;
   if v_qty is null or v_qty < 1 or v_qty > 99 then raise exception 'Invalid item quantity'; end if;
   select * into v_product from products where id = (v_item->>'product_id')::uuid for update;
   if not found then raise exception 'A product in your cart no longer exists'; end if;
   if coalesce(v_product.is_sold_out,false) then raise exception 'Product % is sold out', v_product.name; end if;
   if v_product.is_preorder then
     -- Pre-orders do not decrement inventory; the admin manages their availability.
     null;
   else
     if coalesce(v_product.stock,0) < v_qty then raise exception 'Insufficient stock for %', v_product.name; end if;
     update products set stock = stock - v_qty where id = v_product.id;
   end if;
   v_subtotal := v_subtotal + (v_product.price * v_qty);
   v_items := v_items || jsonb_build_array(jsonb_build_object('product_id',v_product.id,'name',v_product.name,'price',v_product.price,'quantity',v_qty,'is_preorder',coalesce(v_product.is_preorder,false)));
 end loop;
 if v_code is not null then
   select * into v_coupon from coupons where code = v_code for update;
   if not found or not v_coupon.is_active then raise exception 'Coupon is invalid or inactive'; end if;
   if v_coupon.expires_at is not null and v_coupon.expires_at < now() then raise exception 'Coupon has expired'; end if;
   if v_coupon.usage_limit is not null and coalesce(v_coupon.used_count,0) >= v_coupon.usage_limit then raise exception 'Coupon usage limit reached'; end if;
   if v_subtotal < coalesce(v_coupon.min_order_amount,0) then raise exception 'Minimum order amount for coupon not reached'; end if;
   if v_coupon.discount_type = 'percent' then
     v_discount := v_subtotal * v_coupon.discount_value / 100;
     if v_coupon.max_discount_amount is not null then v_discount := least(v_discount,v_coupon.max_discount_amount); end if;
   elsif v_coupon.discount_type = 'fixed' then v_discount := v_coupon.discount_value;
   else raise exception 'Invalid coupon configuration'; end if;
   v_discount := least(greatest(v_discount,0),v_subtotal);
   update coupons set used_count = coalesce(used_count,0) + 1 where id = v_coupon.id;
 end if;
 v_total := greatest(v_subtotal-v_discount,0);
 insert into orders(customer_name,customer_phone,customer_address,items,subtotal,discount,total,coupon_code)
 values(trim(p_customer_name),trim(p_customer_phone),trim(p_customer_address),v_items,v_subtotal,v_discount,v_total,v_code) returning id into v_order_id;
 return v_order_id;
end; $$;

create or replace function public.cancel_store_order(p_order_id uuid) returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_order orders%rowtype; v_item jsonb;
begin
 if not public.is_admin() then raise exception 'Only store admin can cancel orders'; end if;
 select * into v_order from orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if v_order.status='cancelled' then return false; end if;
 for v_item in select value from jsonb_array_elements(v_order.items) loop
   if not coalesce((v_item->>'is_preorder')::boolean,false) then
     update products set stock=stock+(v_item->>'quantity')::int where id=(v_item->>'product_id')::uuid;
   end if;
 end loop;
 if v_order.coupon_code is not null then
   update coupons set used_count=greatest(used_count-1,0) where code=v_order.coupon_code;
 end if;
 update orders set status='cancelled',cancelled_at=now() where id=p_order_id;
 return true;
end; $$;

revoke all on function public.create_store_order(text,text,text,jsonb,text) from public;
grant execute on function public.create_store_order(text,text,text,jsonb,text) to anon, authenticated;
revoke all on function public.cancel_store_order(uuid) from public;
grant execute on function public.cancel_store_order(uuid) to authenticated;
