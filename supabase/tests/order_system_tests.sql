-- ShatUp Shop — manual database tests for order_system_v2.sql
-- HOW TO RUN: paste into Supabase SQL Editor and run. It creates temporary rows, prints PASS/FAIL notices,
-- and ends with ROLLBACK, so nothing is kept. (Run on a staging project if you can.)
-- STATUS: written but NOT executed by the developer (no Postgres/Supabase available in the build sandbox).
-- Concurrency cannot be proven in a single session; see the two-session test at the bottom.
begin;

do $$
declare
  v_prod uuid; v_coupon uuid; v_order jsonb; v_order2 jsonb; v_id uuid; v_stock int; v_used int; v_ok boolean; v_main uuid; v_partner uuid;
begin
  insert into public.admin_users(email) values ('test-admin@example.invalid') on conflict do nothing;
  insert into public.products(name, category, price, stock) values ('TEST PRODUCT', 'Test', 100, 5) returning id into v_prod;
  insert into public.coupons(code, discount_type, discount_value, min_order_amount, usage_limit, used_count, is_active)
    values ('TESTCODE10', 'percent', 10, 100, 1, 0, true) returning id into v_coupon;

  -- 1. order with coupon: server prices, stock deducted, coupon counted once
  v_order := public.place_store_order('Test User', '01712345678', 'Test address 12', jsonb_build_array(jsonb_build_object('product_id', v_prod, 'quantity', 2)), 'testcode10', 'key-1');
  v_id := (v_order->>'order_id')::uuid;
  select stock into v_stock from public.products where id = v_prod;
  select used_count into v_used from public.coupons where id = v_coupon;
  raise notice '%', case when (v_order->>'total')::numeric = 180 and v_stock = 3 and v_used = 1 then 'PASS 1 order total 180, stock 3, coupon used_count 1' else format('FAIL 1 total=%s stock=%s used=%s', v_order->>'total', v_stock, v_used) end;

  -- 2. idempotency: same key returns same order, no second deduction
  v_order2 := public.place_store_order('Test User', '01712345678', 'Test address 12', jsonb_build_array(jsonb_build_object('product_id', v_prod, 'quantity', 2)), 'testcode10', 'key-1');
  select stock into v_stock from public.products where id = v_prod;
  raise notice '%', case when v_order2->>'order_id' = v_order->>'order_id' and v_stock = 3 then 'PASS 2 repeated submit returns same order, stock unchanged' else 'FAIL 2' end;

  -- 3. coupon limit reached
  v_ok := false;
  begin
    perform public.place_store_order('Test User', '01712345678', 'Test address 12', jsonb_build_array(jsonb_build_object('product_id', v_prod, 'quantity', 1)), 'TESTCODE10', 'key-2');
  exception when others then v_ok := sqlerrm ilike '%usage limit%'; end;
  raise notice '%', case when v_ok then 'PASS 3 coupon usage limit enforced' else 'FAIL 3' end;

  -- 4. overselling blocked and nothing deducted
  v_ok := false;
  begin
    perform public.place_store_order('Test User', '01712345678', 'Test address 12', jsonb_build_array(jsonb_build_object('product_id', v_prod, 'quantity', 4)), null, 'key-3');
  exception when others then v_ok := sqlerrm ilike '%not enough stock%'; end;
  select stock into v_stock from public.products where id = v_prod;
  raise notice '%', case when v_ok and v_stock = 3 then 'PASS 4 oversell blocked, stock still 3' else 'FAIL 4' end;

  -- 5. duplicate product lines are merged and cannot bypass the stock check (2 + 2 > 3)
  v_ok := false;
  begin
    perform public.place_store_order('Test User', '01712345678', 'Test address 12', jsonb_build_array(jsonb_build_object('product_id', v_prod, 'quantity', 2), jsonb_build_object('product_id', v_prod, 'quantity', 2)), null, 'key-4');
  exception when others then v_ok := sqlerrm ilike '%not enough stock%'; end;
  raise notice '%', case when v_ok then 'PASS 5 duplicate lines merged, oversell blocked' else 'FAIL 5' end;

  -- 6. cancel as NON-admin is rejected
  perform set_config('request.jwt.claims', '{"email":"someone-else@example.invalid"}', true);
  v_ok := false;
  begin perform public.cancel_store_order(v_id);
  exception when others then v_ok := sqlerrm ilike '%only the store admin%'; end;
  raise notice '%', case when v_ok then 'PASS 6 non-admin cannot cancel' else 'FAIL 6' end;

  -- 7. admin cancel restores stock + coupon once; second cancel does nothing
  perform set_config('request.jwt.claims', '{"email":"test-admin@example.invalid"}', true);
  v_ok := public.cancel_store_order(v_id);
  perform public.cancel_store_order(v_id);
  select stock into v_stock from public.products where id = v_prod;
  select used_count into v_used from public.coupons where id = v_coupon;
  raise notice '%', case when v_ok and v_stock = 5 and v_used = 0 then 'PASS 7 cancel restored stock (5) and coupon (0) exactly once' else format('FAIL 7 stock=%s used=%s', v_stock, v_used) end;

  -- 8. cancelled order cannot be re-opened
  v_ok := false;
  begin perform public.update_order_status(v_id, 'confirmed');
  exception when others then v_ok := sqlerrm ilike '%cancelled%'; end;
  raise notice '%', case when v_ok then 'PASS 8 cancelled order cannot be re-opened' else 'FAIL 8' end;

  -- 9. validate_coupon does not change used_count
  perform set_config('request.jwt.claims', '', true);
  perform public.validate_coupon('TESTCODE10', 500);
  select used_count into v_used from public.coupons where id = v_coupon;
  raise notice '%', case when v_used = 0 then 'PASS 9 validate_coupon is read-only' else 'FAIL 9' end;

  -- 10. media limit: 4 photos rejected
  perform set_config('request.jwt.claims', '{"email":"test-admin@example.invalid"}', true);
  v_ok := false;
  begin
    perform public.replace_product_media(v_prod, '[{"url":"https://x.test/1.jpg","media_type":"image"},{"url":"https://x.test/2.jpg","media_type":"image"},{"url":"https://x.test/3.jpg","media_type":"image"},{"url":"https://x.test/4.jpg","media_type":"image"}]'::jsonb);
  exception when others then v_ok := sqlerrm ilike '%maximum 3 photos%'; end;
  raise notice '%', case when v_ok then 'PASS 10 more than 3 photos rejected' else 'FAIL 10' end;

  -- 11. bundle discount: 10% off a main + partner pair bought together
  -- main 1000 x2 + partner 500 x1 = 2500, bundle pair (2 x 1000 + 500) = 2500, 10% = 250 off
  insert into public.products(name, category, price, stock) values ('TEST BUNDLE MAIN', 'Test', 1000, 5) returning id into v_main;
  insert into public.products(name, category, price, stock) values ('TEST BUNDLE PARTNER', 'Test', 500, 5) returning id into v_partner;
  v_order := public.place_store_order('Test User', '01712345678', 'Test address 12',
    jsonb_build_array(
      jsonb_build_object('product_id', v_main, 'quantity', 2),
      jsonb_build_object('product_id', v_partner, 'quantity', 1)),
    null, 'key-bundle-1',
    jsonb_build_array(jsonb_build_object('main_product_id', v_main, 'partner_product_id', v_partner, 'main_qty', 2)));
  raise notice '%', case when (v_order->>'total')::numeric = 2250 and (v_order->>'bundle_discount')::numeric = 250
    then 'PASS 11 bundle discount 250, total 2250' else format('FAIL 11 total=%s bundle_discount=%s', v_order->>'total', v_order->>'bundle_discount') end;

  -- 12. a bundle claim that does not match the order is skipped; the order still goes through at full price
  v_order := public.place_store_order('Test User', '01712345678', 'Test address 12',
    jsonb_build_array(jsonb_build_object('product_id', v_main, 'quantity', 1)),
    null, 'key-bundle-2',
    jsonb_build_array(jsonb_build_object('main_product_id', v_main, 'partner_product_id', v_partner, 'main_qty', 2)));
  raise notice '%', case when (v_order->>'total')::numeric = 1000 and coalesce((v_order->>'bundle_discount')::numeric, 0) = 0
    then 'PASS 12 unmatched bundle skipped, total 1000' else format('FAIL 12 total=%s bundle_discount=%s', v_order->>'total', v_order->>'bundle_discount') end;
end $$;

rollback;

-- TWO-SESSION CONCURRENCY TEST (manual):
-- 1. Create a product with stock = 1 (note its id).
-- 2. Open two SQL Editor tabs. In tab A run:  begin; select public.place_store_order('A User','01712345678','Some address 1', '[{"product_id":"<ID>","quantity":1}]', null, 'a');   (do NOT commit yet)
-- 3. In tab B run the same with key 'b' — it should WAIT (row lock). 4. In tab A run: commit;
-- 5. Tab B must now fail with "Not enough stock". Final stock must be 0, never negative.
