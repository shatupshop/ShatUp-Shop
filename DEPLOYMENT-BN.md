# ShatUp Shop — একদম নতুন করে Setup (বাংলা)

এই ZIP একটি **fresh installation**-এর জন্য। পুরোনো Supabase project, database, product, order, admin user, API key বা environment variable প্রয়োজন নেই। নতুন Supabase project তৈরি করলে database খালি থাকবে; কোনো demo product seed করা হয় না।

## ১) ZIP থেকে GitHub-এ Upload

1. ZIP extract করো।
2. Extract করা `shatup-shop` ফোল্ডারের ভেতরের সব file/folder GitHub repository-এর root-এ upload করো। Repository-তে যেন `shatup-shop/shatup-shop/...` nested folder না হয়।
3. `.env.local` বা কোনো secret key GitHub-এ upload করবে না। `.env.local.example` শুধু template।

## ২) নতুন Supabase project ও Admin login

1. Supabase-এ **New project** তৈরি করো। Project name, strong database password ও region বেছে নাও।
2. Dashboard → Authentication → Users → Add user থেকে নিজের admin email ও strong password দিয়ে user তৈরি করো। Email confirm option থাকলে confirm করে নাও।
3. Authentication → Providers → Email-এ customer self-signup বন্ধ রাখো। Admin user আগে তৈরি করা থাকবে।
4. SQL Editor-এ নিচের SQL ফাইলগুলো **এই নির্দিষ্ট ক্রমে**, প্রতিটি আলাদা query হিসেবে Run করো:

   1. `supabase/schema.sql`
   2. `supabase/promo_banners.sql`
   3. `supabase/product_media_stockout.sql`
   4. `supabase/preorder.sql`
   5. `supabase/harden_admin_policies.sql` — ফাইলের `CHANGE_ME@example.com`-এর জায়গায় Authentication-এ তৈরি করা admin-এর exact email lowercase করে বসাও; তারপর Run করো।
   6. `supabase/orders_coupon_stock.sql`
   7. `supabase/order_system_v2.sql`
   8. `supabase/final_security_migration.sql`
   9. `supabase/growth_features.sql`

**গুরুত্বপূর্ণ:** নতুন project-এ প্রতিটি migration একবার করে চালাও। `orders_coupon_stock.sql` অবশ্যই `order_system_v2.sql`-এর আগে চালাতে হবে। `order_system_v2.sql`-এর পরে `orders_coupon_stock.sql` আর চালাবে না। `final_security_migration.sql`-এর আগে admin email ঠিকভাবে `admin_users`-এ যুক্ত হয়েছে কি না নিশ্চিত করো। `growth_features.sql` সবশেষে চালাবে। কোনো SQL error হলে পরের ফাইল চালিও না—error message দেখে আগে সেটি ঠিক করো।

## ৩) Supabase API keys সংগ্রহ

Supabase Dashboard → Project Settings → API থেকে:
- Project URL
- `anon` / publishable public key

**কখনো `service_role` / secret key frontend, GitHub বা Vercel-এর `NEXT_PUBLIC_` variable-এ দেবে না।**

## ৪) Vercel-এ নতুন deployment

1. Vercel-এ New Project → নতুন GitHub repository Import করো।
2. Root Directory হবে repository root (`./`)।
3. Framework Next.js এবং Build Command `npm run build` রাখো।
4. Environment Variables যোগ করো:

   - `NEXT_PUBLIC_SUPABASE_URL` = নতুন Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = নতুন anon/publishable public key
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` = অর্ডার নেওয়ার WhatsApp নম্বর, country code-সহ; `+` বা space নয় (উদাহরণ: `8801XXXXXXXXX`)
   - `NEXT_PUBLIC_SITE_URL` = Vercel-এর live URL (যেমন `https://your-project.vercel.app`)
   - `NEXT_PUBLIC_DELIVERY_OUTSIDE` = Gaibandha Sadar-এর বাইরে delivery charge (না দিলে default ৳120)
   - `NEXT_PUBLIC_BKASH_NUMBER` = optional; খালি রাখলে checkout-এ bKash দেখাবে না
   - `NEXT_PUBLIC_NAGAD_NUMBER` = optional; খালি রাখলে checkout-এ Nagad দেখাবে না
   - `NEXT_PUBLIC_FB_PIXEL_ID` ও `NEXT_PUBLIC_GA_ID` = optional analytics IDs

5. Deploy করো। Environment variable পরিবর্তন করলে নতুন deployment করো।

## ৫) Deploy-এর পর বাধ্যতামূলক পরীক্ষা

- `/admin`-এ নতুন admin email/password দিয়ে login হয় কি না।
- Admin থেকে একটি test product add, edit ও delete করা যায় কি না।
- Product-এ photo/video upload এবং storefront gallery দেখা যায় কি না।
- Banner, Promo Strip, Coupon, Collection ও Review moderation কাজ করে কি না।
- Test order তৈরি হয় কি না; admin order list-এ দেখা যায় কি না; cancel করলে stock একবারই ফেরত আসে কি না।
- Mobile ও desktop-এ cart, checkout, navigation এবং WhatsApp link সঠিক নম্বরে যায় কি না।

Live করার আগে test product/order মুছে ফেলো। Payment gateway integration এই project-এ নেই; checkout WhatsApp order flow ব্যবহার করে।

## Local test (ঐচ্ছিক)

```bash
npm install
npm run typecheck
npm run build
npm run start
```

Node.js 20 বা তার পরের LTS ব্যবহার করো। Google Fonts build-এর সময় network access লাগতে পারে।
