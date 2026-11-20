# What changed in this version

## Product photos + videos (up to 3 photos + 3 videos)
- Phones / browsers that send a file with an empty type are now accepted by extension (JPG, PNG, WebP, GIF, MP4, WebM). iPhone .mov / HEIC give a clear "export as MP4/JPG" message.
- Uploads now send the correct content type + extension, so videos always play.
- FIX: if saving the gallery failed after the product was created, pressing Save again created a DUPLICATE product. It now updates the same product, and does not re-upload files.
- FIX: opening Edit and saving before the gallery finished loading could wipe the extra photos/videos. Save is now disabled until the gallery has loaded.
- Product popup: thumbnails moved BELOW the picture (they used to cover the video's play/seek bar), added "1 / 3" counter and real video thumbnails.

## Storefront polish
- Trust strip now has 5 items (WhatsApp order, fast delivery, genuine, best price, after-sales).
- Product cards show "৳X OFF" savings; "Only N left" is now translated to Bangla.
- FIX: cart / wishlist / profile are only saved to the phone after they were loaded (no chance of an empty first render overwriting them); a blocked/full storage no longer breaks the shop.

## Still required (unchanged)
Run the Supabase SQL files in the order listed in README.md (product_media_stockout.sql, order_system_v2.sql, final_security_migration.sql) or photos/videos cannot be saved.

## Round 2
- Admin: one clean tab bar (Products, Orders, Banners, Promo Strip, Collections, Coupons), stat cards (total / low stock / sold out / pre-order) and a product search box.
- Home: "Browse categories" now shows all 12 categories.
- Footer: AppleGadgets-style trust row (delivery, cash on delivery, genuine, WhatsApp support) above the contacts.

## Round 3 - modern redesign (AppleGadgets-style, no emoji)
- All emoji removed from the storefront, admin and WhatsApp message; one clean line-icon set (components/Ico.tsx) is used instead.
- New black header: logo, gradient live-deals pill, white search bar with orange search button, cart in a circle with count badge, desktop link row.
- Slim black announcement bar (text only), 5-item trust block, icon quick-access row, Featured Categories grid with all 12 categories.
- Flat white mobile bottom bar (Home / Categories / Cart / Message / Account).
- Cleaner product cards, neutral grey page background, multi-column footer (Shop / Support / Contact).
- Note: on phones the dark-mode toggle is hidden to save space (still on desktop).

## Round 4 - full check
- WhatsApp order message rebuilt: order ID, item lines (price x qty = line total), subtotal, coupon, total, customer block. Pre-order orders get their own title, [PRE-ORDER] tags and a "please confirm delivery time" note. Emoji removed from the messages.
- Fixed a React warning (the "filled" prop of Heart/Star icons leaked into the page HTML).
- Removed a "Cash on Delivery" claim from the footer that was not confirmed (replaced with "Best Price").
- Removed the last emoji (pre-order hourglass, admin pre-order checkbox, wishlist pre-order tag).

## Merge (this version)
- Base: the animated-header version (scroll progress line, hide-on-scroll search row, mobile menu drawer, cart bounce, drifting colour orbs, floating bottom bar).
- Added everything from Rounds 1-4: product photo/video gallery + sold-out handling, pre-order, rebuilt WhatsApp order message, admin tab bar + stats + search, coupons, orders, 12-category grid, footer trust row, line icons (Ico), Bangla "Only N left", localStorage-safety fixes, Heart/Star `filled` prop fix.
- Emoji removed from the whole storefront (header ticker now uses a plain text 5-item list with a small star separator).
- Run the Supabase SQL files in the order listed in README.md before using photos/videos or orders.

## Growth features (final)
- Checkout: delivery area + charge, bKash/Nagad info, Transaction ID, all included in the WhatsApp message.
- Order tracking (Order ID + phone), customer reviews with admin approval, testimonials strip.
- Recently viewed, related products, product share link with rich preview, Ask-on-WhatsApp, floating WhatsApp button.
- Cards: New / Hot tags, flash-sale "% sold" bar. Category tint colours. Better empty state (clear filters + category chips).
- Admin: Sales report tab, Reviews tab, "Total qty on sale" field, count-up numbers.
- SEO: Open Graph / Twitter tags, JSON-LD, product-specific preview. Optional Facebook Pixel / Google Analytics.
- Fonts (Poppins + Hind Siliguri), reduced-motion support, scroll reveal on more sections, softer orbs in dark mode.
- Run `supabase/growth_features.sql` last. Without it the shop still works; reviews, tracking and the "% sold" bar simply stay hidden.
