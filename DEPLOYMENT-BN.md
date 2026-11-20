# ShatUp Shop — সহজ ডিপ্লয় গাইড (বাংলা)

## ১. Supabase ডাটাবেস আপডেট
1. Supabase Dashboard খুলুন → **SQL Editor** → **New query**।
2. নিচের ফাইলগুলো **এই ক্রমে** একটা একটা করে পেস্ট করে **Run** চাপুন:
   1. `supabase/order_system_v2.sql`
   2. `supabase/final_security_migration.sql`
   (আগে `schema.sql`, `harden_admin_policies.sql`, `orders_coupon_stock.sql` চালানো না থাকলে সেগুলো আগে চালান।)
3. `final_security_migration.sql` যদি লেখে "admin_users is empty", তাহলে আগে নিজের অ্যাডমিন ইমেইল যোগ করুন:
   `insert into public.admin_users(email) values (lower('আপনার-ইমেইল@example.com'));` তারপর আবার Run করুন।
4. সব ফাইল Run হলে Success দেখাবে। কোনো ডেটা মুছে যাবে না।
5. **Authentication → Providers → Email** এ গিয়ে "Allow new users to sign up" **বন্ধ** করুন।

## ২. ওয়েবসাইট ডিপ্লয় (Vercel)
1. প্রজেক্ট ZIP খুলে GitHub-এ আপলোড করুন, তারপর Vercel-এ Import করুন।
2. Vercel → Settings → Environment Variables এ এই ৩টি দিন (আগের মতোই):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
3. Deploy চাপুন।
4. নিজের কম্পিউটারে চালাতে চাইলে: `npm install` তারপর `npm run build` ও `npm run dev`।

## ৩. ডিপ্লয়ের পর নিজে যাচাই করুন (জরুরি)
1. `/admin` এ লগইন করে একটা প্রোডাক্টে ৩টি ছবি ও ১টি ভিডিও দিয়ে সেভ করুন।
2. দোকানে গিয়ে একটা টেস্ট অর্ডার দিন → Admin → Orders এ অর্ডার দেখা যাচ্ছে কিনা এবং স্টক কমেছে কিনা দেখুন।
3. সেই অর্ডার Cancel করুন → স্টক ফিরে এসেছে কিনা দেখুন।
4. একটা কুপন বানিয়ে (usage limit ১) দুইবার ব্যবহার করে দেখুন — দ্বিতীয়বার আটকে যাওয়া উচিত।
5. মোবাইলে (Android Chrome) পুরো সাইট একবার ঘুরে দেখুন।

## ৪. সমস্যা হলে
- "Ordering is not set up yet" দেখালে → `order_system_v2.sql` চালানো হয়নি।
- অর্ডার হয়নি বলে এরর দেখালে WhatsApp খুলবে না — এটাই সঠিক আচরণ; এররের লেখা পড়ে ব্যবস্থা নিন।
- অর্ডার ডিলিট করবেন না; Admin → Orders থেকে Cancel করুন, তাহলে স্টক ও কুপন ঠিকভাবে ফেরত আসবে।
