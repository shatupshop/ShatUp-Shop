# ShatUp Shop — Premium E-commerce

**Shop Smart. Live Better.** Bangladesh-focused, mobile-first ecommerce storefront built with Next.js App Router, TypeScript, Tailwind CSS and Supabase.

## Included features

- Animated storefront header and premium opening splash animation
- Responsive product catalogue, search, categories, sorting and stock status
- Editable home banners, collections and Daraz-style promo slider
- Product gallery with up to 3 photos and 3 short videos per product
- Cart, wishlist, customer profile and WhatsApp checkout
- Pre-order, coupon, stock deduction and order cancellation workflow
- Admin dashboard for products, banners, collections, promo banners, orders, coupons and reviews
- Order tracking, reviews, delivery settings, Bangla/English and light/dark modes
- Gaibandha Sadar free-delivery highlight

## Fresh installation

This package is intended for a **new installation**. It does not require or connect to any previous Supabase project. A new database starts empty; no demo products or orders are seeded.

Follow **[DEPLOYMENT-BN.md](./DEPLOYMENT-BN.md)** for the complete Bengali setup guide. It includes the required Supabase SQL order, admin setup, Vercel deployment and post-deployment tests.

## Environment variables

Copy `.env.local.example` to `.env.local` for local development and fill in your own new Supabase project values. In Vercel, add the same variables in Project Settings → Environment Variables.

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public anon/publishable key only)
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_SITE_URL`

Optional variables are documented in `.env.local.example`.

**Never expose a Supabase service-role/secret key in frontend code, GitHub, or any `NEXT_PUBLIC_` variable.**

## Local development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run build
```

## Important notes

- Checkout is WhatsApp-based; this package does not include an online payment gateway.
- Cart, wishlist, theme, language and quick customer profile are stored in browser localStorage.
- Product, order and admin data are stored in the new Supabase project you configure.
- Do not run SQL migrations out of order. In particular, run `orders_coupon_stock.sql` before `order_system_v2.sql`, and never rerun the former after the latter.

## Credits

✦ Developed by **Rimon**  
**Web Developer**
