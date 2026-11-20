# ShatUp Shop — Premium Simple E-commerce

Shop Smart. Live Better. A mobile-first, one-page storefront for Bangladesh, with
WhatsApp checkout and a lightweight Supabase-powered admin panel.

## Tech
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (DB + Storage + Auth)

## Features
- Sticky header, search, category bar, product grid, Flash Sale & New Arrivals rails
- Auto-sliding home page banner carousel (2–3 slides, swipeable, dots, arrows) — fully
  editable from `/admin`, stored in Supabase
- বাংলা / English switcher, Dark / Light mode
- Wishlist ❤️ and Cart 🛒 (saved in the browser, no login required to shop)
- Quick 1-click "signup" (name, phone, address) used to prefill WhatsApp orders
- Product modal with quantity, Add to Cart, Buy Now
- Subtle micro-animations: card entrance, hover lift, wishlist heart pop, cart bounce,
  discount-badge shimmer, Flash Sale pulse, smooth modal/drawer transitions
- Premium opening animation on first load (~2.5s): multi-category product icons gather
  around the logo, burst outward, then a lipstick "writes" the developer credit before a
  circular emerald/gold reveal opens into the homepage. Respects `prefers-reduced-motion`
  (shows a simple fade instead) and is pure CSS/SVG — no video, stays lightweight.
- **Buy Now / Order on WhatsApp** — opens WhatsApp with a pre-filled message
  (product, quantity, price, total, customer name, phone, address) to
  **+8801868561887**
- Free delivery highlight — Gaibandha Sadar only
- `/admin` — simple login (Supabase Auth) with three tabs:
  - **Products** — Add/Edit/Delete with image upload
  - **Banners** — Add/Edit/Delete, enable/disable, reorder, image upload, title/subtitle/button
  - **Collections** — a small 3-card promo grid on the home page (e.g. "Hot Deals"), same controls as Banners
  All three appear on the live site immediately, and every one of them stays hidden on
  the home page until you add at least one — no demo/placeholder content ships.
- **Promo Strip** — compact Daraz-style auto-sliding banner right under the header. Managed in `/admin → 📢 Promo Strip`: image upload (auto-compressed), link to URL / product / category, start & end date, active toggle, reorder. Expired / scheduled / inactive promos hide automatically. Swipe on mobile, arrows on desktop, dots, pauses on hover. **Setup:** run `supabase/promo_banners.sql` once in the SQL Editor.
- **Product gallery** — up to 3 photos + 3 short videos per product (admin: Add/Edit Product → Photos & videos; first photo = cover). Customers swipe through photos/videos in the product popup. **Stock Out** — admin "Mark Sold Out" switch (or stock 0): overlay on card + popup, Buy/Add to Cart disabled, sold-out items move to the end of the list. **Setup:** run `supabase/product_media_stockout.sql` once.
- App-style bottom navigation bar on mobile (Home / Categories / Message / Cart / Account)
- Quick-access shortcut row (Flash Sale, New Arrivals, Wishlist, Free Delivery, All Products, Chat)
- Live Flash Sale countdown timer (resets daily at midnight, no configuration needed)

## Your logo

Your official ShatUp Shop logo mark (the speed-lines + "R" + shopping bag icon,
background removed) is installed at `public/logo.png`, and a square version at
`src/app/icon.png` for the browser tab favicon. It appears automatically in the
header, footer, admin panel, and splash screen. If you ever want to swap it,
just replace those two files with the same names — the `Logo` component reads
the image's real width/height ratio, so any replacement logo will keep its
correct proportions automatically instead of being stretched into a square.

## Database setup, in this exact order (Supabase SQL Editor)

| # | File | Purpose |
|---|------|---------|
| 1 | `supabase/schema.sql` | base tables, buckets (new projects only) |
| 2 | `supabase/promo_banners.sql`, `product_media_stockout.sql`, `preorder.sql` | feature tables (skip any you already ran) |
| 3 | `supabase/harden_admin_policies.sql` | creates `admin_users` and `is_admin()`. Edit the admin email inside first. Skip if you already ran it |
| 4 | `supabase/orders_coupon_stock.sql` | first-generation orders table (skip if already run) |
| 5 | `supabase/order_system_v2.sql` | **new**: secure order, coupon, stock, status and media functions |
| 6 | `supabase/final_security_migration.sql` | admin-only writes, private coupons, storage policies |
| 7 | `supabase/growth_features.sql` | **run after step 6**: customer reviews, order tracking, flash-sale "% sold" bar |

All files are safe to re-run **except `orders_coupon_stock.sql` after step 5** (it would restore the older cancel function).
Nothing here drops tables or deletes data. `final_security_migration.sql` refuses to run (and changes nothing) if `admin_users` is empty, so it can never lock out or replace your existing admin.
Rollback notes are at the bottom of each file. Manual database tests: `supabase/tests/order_system_tests.sql`.

### What changed in how ordering works
- Every order (cart checkout, Buy Now on the card, Buy Now in the popup, Pre-Order) is first saved by the database function `place_store_order`.
  The server re-reads the real product prices, checks stock and coupon, calculates the total, stores the order and its price snapshot (`order_items`), deducts stock, and returns the order ID.
  Only then does WhatsApp open, and the WhatsApp message uses the server's totals. If saving fails, WhatsApp is not opened and no confirmation is shown.
- Coupons: the browser can no longer read the `coupons` table or change `used_count`. `validate_coupon` previews a discount; `place_store_order` recounts it. One order can consume a coupon once (`coupon_redemptions`), and cancelling returns it once.
- Stock: deducted inside the same transaction as the order with row locks; cancelling restores it once (`orders.stock_restored`). Pre-order products never touch stock; Sold Out products stay visible with the Sold Out label.
- Admin > Orders: search by order ID or phone, filter by status, line items, status updates (pending, confirmed, shipped, delivered, cancelled). A cancelled order cannot be re-opened because its stock has been returned.
- Product media: max 3 photos + 3 videos, preview, replace, remove, reorder, "Cover" button, per-file upload step display. The gallery is saved by one transaction (`replace_product_media`). Existing products and image URLs are untouched; a product that already has more than 3 photos must be trimmed the next time it is edited.
- Editing a product no longer overwrites stock unless you actually changed the stock number (otherwise a stale form could undo stock deducted by orders).

### Environment variables (unchanged)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. No service-role key is used anywhere in the frontend.

### Supabase dashboard settings
- Authentication > Providers > Email: turn **off** "Allow new users to sign up" (customers do not need accounts; the shop stores their details in their browser).
- Storage: the `product-media` bucket is public (so product pages load fast) with a 25 MB limit and image/MP4/WebM types only; the migration sets this. Writes are admin-only.

## 1. Install

```bash
npm install
```

## 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your project and run the contents of
   `supabase/schema.sql`. This creates the `products` table, the
   `product-images` storage bucket, and the right access policies.
3. Go to **Authentication → Users → Add user** and create one admin login
   (e.g. `admin@shatup.shop` + a strong password). That's what you use to
   log in at `/admin`.
4. Go to **Project Settings → API** and copy your **Project URL** and
   **anon public key**.

## 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_WHATSAPP_NUMBER=8801868561887
```

> Until these are set, the storefront runs on sample demo products so you can
> preview the design — the admin panel will show a setup notice instead.

## 4. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` for the store and `http://localhost:3000/admin`
for the admin panel.

## 5. Deploy

Push this project to GitHub, then import it on **Vercel** (or Netlify) and add
the same three environment variables in the project's dashboard. No other
configuration is needed.

## Security (important)

Run `supabase/harden_admin_policies.sql` once (after editing your admin email) and turn off
"Allow new users to sign up" in Supabase Auth. Otherwise anyone can self-register and edit your store.

## Notes

- Cart, wishlist, theme, language and the customer's quick-signup profile are
  stored in the browser (`localStorage`) — there is intentionally no customer
  account system, matching the "no complicated checkout" requirement.
- Checkout is 100% WhatsApp-based — there is no payment gateway.
- To change the WhatsApp number, edit `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Product images are stored in the public `product-images` Supabase Storage
  bucket, and banner images in `banner-images` — both created by the SQL script.
- With no products in Supabase yet, the home page shows a clean empty state
  instead of any placeholder/demo items.
- With no banners added yet, the home page shows a default single welcome
  banner until you add your own from `/admin → Banners`.

## Contact / Credits

✦ Developed by **Rimon**
WhatsApp: +8801868561887 · Telegram: [@RimonGT](https://t.me/RimonGT) · Email: rimonstorebd@gmail.com


## New in this version (growth features)
- **Delivery + payment at checkout:** delivery area (free in Gaibandha Sadar, charge elsewhere), bKash / Nagad number + Transaction ID. Set `NEXT_PUBLIC_DELIVERY_OUTSIDE`, `NEXT_PUBLIC_BKASH_NUMBER`, `NEXT_PUBLIC_NAGAD_NUMBER` in `.env.local`. Delivery is added to the WhatsApp message (the database total stays product-only).
- **Order tracking:** customers enter Order ID + phone in the "Track your order" section.
- **Reviews:** customers submit, you approve in Admin -> Reviews. Approved reviews show in the product popup and in the home page strip.
- **Recently viewed, related products, share link (`/?p=<product id>`)** with product photo/price in WhatsApp/Facebook previews. Set `NEXT_PUBLIC_SITE_URL`.
- **Floating WhatsApp button**, "Ask on WhatsApp" per product, New / Hot tags, flash-sale "% sold" bar (enter "Total qty on sale" in the admin product form).
- **Admin -> Sales:** today / 7 / 30 day sales, daily chart, best sellers, status counts.
- **Optional analytics:** `NEXT_PUBLIC_FB_PIXEL_ID`, `NEXT_PUBLIC_GA_ID`.
- Fonts: Poppins (English) + Hind Siliguri (Bangla) through `next/font` (needs internet during `npm run build`).
- Respects the phone's "reduce motion" setting.
