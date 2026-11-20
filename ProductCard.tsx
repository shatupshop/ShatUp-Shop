"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { isSoldOut, Product } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { Heart, ShoppingCart, Star } from "./icons";
import Ico from "./Ico";
import { newIdempotencyKey, placeOrderAndOpenWhatsApp } from "@/lib/orders";
import { flyToCart } from "@/lib/fly";

export default function ProductCard({ product }: { product: Product }) {
  const {
    t,
    lang,
    addToCart,
    toggleWishlist,
    isWishlisted,
    setActiveProduct,
    profile,
    isProfileComplete,
    setSignupOpen
  } = useStore();

  const [heartPop, setHeartPop] = useState(false);
  const [cartPop, setCartPop] = useState(false);
  const [buying, setBuying] = useState(false);
  const attemptKey = useRef(newIdempotencyKey());

  const wished = isWishlisted(product.id);
  const displayName = lang === "bn" && product.name_bn ? product.name_bn : product.name;
  const hasDiscount = (product.discount_percent || 0) > 0;
  const soldOut = isSoldOut(product);
  const preorder = Boolean(product.is_preorder) && !soldOut;

  async function handleBuyNow(e: React.MouseEvent) {
    e.stopPropagation();
    if (soldOut || buying) return;
    if (!isProfileComplete) {
      setSignupOpen(true);
      return;
    }
    setBuying(true);
    try {
      // Order is saved in the database first (price, stock and total are checked on the server).
      await placeOrderAndOpenWhatsApp(
        [{ product_id: product.id, quantity: 1 }],
        profile,
        null,
        attemptKey.current
      );
      attemptKey.current = newIdempotencyKey();
    } catch (err: any) {
      window.alert(err?.message || "Order could not be placed. Please try again.");
    } finally {
      setBuying(false);
    }
  }

  function handleWishlistClick(e: React.MouseEvent) {
    e.stopPropagation();
    toggleWishlist(product);
    setHeartPop(true);
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    flyToCart((e.currentTarget as HTMLElement).closest(".card-lux")?.querySelector("img"), product.image_url, t("addedToCart"), product.name);
    addToCart(product, 1);
    setCartPop(true);
  }

  const lowStock = !soldOut && product.stock > 0 && product.stock <= 5;

  // small status tag: "New" (admin flag or added in the last 14 days) wins over "Hot" (top rated)
  const isNew =
    !soldOut &&
    !preorder &&
    (Boolean(product.is_new_arrival) ||
      (product.created_at ? Date.now() - new Date(product.created_at).getTime() < 14 * 86400000 : false));
  const isHot = !soldOut && !preorder && !isNew && (product.rating ?? 0) >= 4.8;

  // flash-sale progress: only when the admin entered how many units were put on sale
  const flashPct =
    product.is_flash_sale && !soldOut && product.flash_total && product.flash_total > 0
      ? Math.max(0, Math.min(100, Math.round(((product.flash_total - product.stock) / product.flash_total) * 100)))
      : null;

  return (
    <div
      onClick={() => setActiveProduct(product)}
      className={`card-lux group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white dark:bg-white/[0.04] ${
        product.is_preorder
          ? "ring-2 ring-[#FFC400]/70"
          : "ring-1 ring-black/[0.07] dark:ring-white/10"
      }`}
    >
      {/* image */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f4f4f5] dark:bg-white/10">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={displayName}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className={`object-cover transition duration-500 ease-out group-hover:scale-[1.07] ${soldOut ? "grayscale" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">No Image</div>
        )}
        {/* soft bottom vignette so badges stay readable on any photo */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />

        {soldOut && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <span className="-rotate-6 rounded-full border-2 border-white bg-black/60 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">
              {t("outOfStock")}
            </span>
          </div>
        )}

        <div className="absolute left-2.5 top-2.5 z-[5] flex flex-col items-start gap-1">
        {preorder && (
          <span className="rounded-full bg-gradient-to-b from-[#F5D77A] to-[#FFC400] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#17120E] shadow">
            {lang === "bn" ? "প্রি-অর্ডার" : "Pre-Order"}
          </span>
        )}
        {hasDiscount && !soldOut && !preorder && (
          <span className="btn-brand sheen rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white">
            -{product.discount_percent}%
          </span>
        )}
        {isNew && (
          <span className="rounded-full bg-[#17120E]/85 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur">
            {lang === "bn" ? "নতুন" : "New"}
          </span>
        )}
        {isHot && (
          <span className="rounded-full bg-gradient-to-b from-[#FF8A3D] to-[#F0531C] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
            {lang === "bn" ? "হট" : "Hot"}
          </span>
        )}
        </div>
        {product.is_flash_sale && !soldOut && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-[#17120E]/85 px-2 py-0.5 text-[10px] font-bold text-[#F5D77A] backdrop-blur">
            <Ico name="bolt" className="h-3 w-3" /> Flash
          </span>
        )}

        <button
          aria-label="wishlist"
          onClick={handleWishlistClick}
          onAnimationEnd={() => setHeartPop(false)}
          className="glass absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full shadow-md ring-1 ring-black/5 transition hover:scale-110 active:scale-95"
        >
          <Heart
            className={`h-4 w-4 ${wished ? "text-red-500" : "text-gray-600 dark:text-gray-300"} ${
              heartPop ? "animate-heartPop" : ""
            }`}
            filled={wished}
          />
        </button>
      </div>

      {/* info */}
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald">{product.category}</span>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug text-[#17120E] dark:text-gray-100 sm:text-sm">
          {displayName}
        </h3>

        <div className="mt-0.5 flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-[#FFC400]/15 px-2 py-0.5 text-[11px] font-bold text-[#9a7b1e] dark:text-[#FFE066]">
            <Star className="h-3 w-3" filled />
            {(product.rating ?? 4.5).toFixed(1)}
          </span>
          {lowStock && (
            <span className="text-[10px] font-semibold text-red-500">
              {lang === "bn" ? `মাত্র ${product.stock}টি বাকি` : `Only ${product.stock} left`}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-lg font-extrabold tracking-tight text-[#17120E] dark:text-white">
            ৳{product.price.toLocaleString("en-BD")}
          </span>
          {hasDiscount && product.original_price && (
            <span className="text-xs text-gray-400 line-through">
              ৳{product.original_price.toLocaleString("en-BD")}
            </span>
          )}
        </div>
        {hasDiscount && product.original_price && product.original_price > product.price && (
          <span className="w-fit rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-extrabold text-red-600 dark:bg-red-500/15 dark:text-red-300">
            ৳{(product.original_price - product.price).toLocaleString("en-BD")} {lang === "bn" ? "ছাড়" : "OFF"}
          </span>
        )}

        {flashPct !== null && flashPct > 0 && (
          <div className="mt-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF7900] to-[#FFC400] transition-[width] duration-700"
                style={{ width: `${flashPct}%` }}
              />
            </div>
            <span className="mt-0.5 block text-[10px] font-bold text-[#c2410c] dark:text-[#FFB74D]">
              {lang === "bn" ? `${flashPct}% বিক্রি হয়ে গেছে` : `${flashPct}% sold`}
            </span>
          </div>
        )}

        {preorder && product.preorder_eta && (
          <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#9a7b1e] dark:text-[#FFE066]">
            <Ico name="truck" className="h-3.5 w-3.5" /> {product.preorder_eta}
          </span>
        )}

        <div className="mt-2.5 flex items-center gap-2">
          {!preorder && (
          <button
            onClick={handleAddToCart}
            onAnimationEnd={() => setCartPop(false)}
            disabled={soldOut}
            aria-label={t("addToCart")}
            title={t("addToCart")}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald/40 text-emerald transition hover:border-emerald hover:bg-emerald hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-300 disabled:hover:bg-transparent ${
              cartPop ? "animate-cartBounce" : ""
            }`}
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
          </button>
          )}
          <button
            onClick={handleBuyNow}
            disabled={soldOut || buying}
            className="btn-brand h-10 flex-1 rounded-full px-3 text-xs font-bold tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {buying ? (lang === "bn" ? "অপেক্ষা করুন…" : "Please wait…") : soldOut ? t("outOfStock") : preorder ? (lang === "bn" ? "প্রি-অর্ডার করুন" : "Pre-Order Now") : t("buyNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
