# ShatUp Shop — Orders, Coupons & Stock setup

## Supabase SQL order
1. Ensure `schema.sql` has already been run.
2. Edit the admin email in `supabase/harden_admin_policies.sql`, run that file, and keep public sign-ups disabled.
3. Run `supabase/orders_coupon_stock.sql` once in Supabase SQL Editor.
4. Run `supabase/order_system_v2.sql` in Supabase SQL Editor (safe to re-run). **Re-run it after any update to this file** — the bundle discount (below) only works on the server once the latest version is applied. Until then, a bundle order shows "Ordering is not set up yet. The shop owner needs to run the latest database update." and no order is placed.
5. Existing promo/gallery/pre-order migrations remain as before.

## What this adds
- Customer checkout calls `create_store_order`; the database rechecks current product prices, stock, coupon status, expiry, minimum spend and usage limit in one transaction.
- Non-preorder stock is deducted atomically. Pre-order items do not decrement inventory.
- Coupon `used_count` increments only when an order row is created; it decrements if the admin cancels that order.
- Admin > Orders shows the latest 100 orders. Cancelling a pending order restores stock exactly once.
- Customer order records are created with `pending` status because WhatsApp handoff does not prove the seller has accepted the order.
- Bundle discount ("Buy together & save", 10% off a main + partner pair): the cart shows the discount and the server re-derives it from database prices in `place_store_order` (new `p_bundles` parameter). It is stored separately as `orders.bundle_discount` and shown as its own line in the WhatsApp order message. A coupon and a bundle discount can stack. Requires `order_system_v2.sql` to be (re-)run — see step 4 above.

## Important
This is a WhatsApp order-request workflow, not online payment. A pending order reserves stock until the admin cancels it or otherwise handles it. Do not delete orders manually; use the Cancel action so stock and coupon usage are reversed consistently.
