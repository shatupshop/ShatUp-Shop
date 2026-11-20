"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { Heart, Minus, Plus, Star, X } from "./icons";
import Ico from "./Ico";
import { newIdempotencyKey, placeOrderAndOpenWhatsApp } from "@/lib/orders";
import { isSoldOut, Product } from "@/lib/types";
import { SHOP } from "@/lib/shop";
import { track } from "@/lib/analytics";
import { pushRecent } from "@/lib/recent";
import ProductReviews from "./ProductReviews";
import ProductGallery from "./ProductGallery";
import { useDialog } from "@/lib/useDialog";
import { flyToCart } from "@/lib/fly";
import { deliveryDates, formatDeliveryDate, viewersFor } from "@/lib/delivery";

export default function ProductModal({ allProducts = [] }: { allProducts?: Product[] }) {
  const {
    activeProduct,
    setActiveProduct,
    t,
    lang,
    addToCart,
    addBundleToCart,
    toggleWishlist,
    isWishlisted,
    profile,
    isProfileComplete,
    setSignupOpen
  } = useStore();
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState("");
  const attemptKey = useRef(newIdempotencyKey());

  const dialogRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // reset the quantity stepper whenever a different product is opened
  useEffect(() => {
    setQty(1);
    setBuyError("");
    setCopied(false);
    dialogRef.current?.scrollTo({ top: 0 });
  }, [activeProduct?.id]);

  // remember what the customer looked at (phone only) + optional analytics
  useEffect(() => {
    if (!activeProduct) return;
    pushRecent(activeProduct.id);
    track("ViewContent", { id: activeProduct.id, name: activeProduct.name, value: activeProduct.price });
  }, [activeProduct?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useDialog(Boolean(activeProduct), () => setActiveProduct(null));

  if (!activeProduct) return null;
  const product = activeProduct;
  const displayName = lang === "bn" && product.name_bn ? product.name_bn : product.name;
  const wished = isWishlisted(product.id);
  const soldOut = isSoldOut(product);
  const preorder = Boolean(product.is_preorder) && !soldOut;

  function close() {
    setActiveProduct(null);
    setQty(1);
  }

  const related = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category && !p.is_preorder)
    .sort((a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b)))
    .slice(0, 6);

  // smart extras: live viewers, low-stock urgency, delivery estimate, bundle deal
  const viewers = viewersFor(product.id);
  const dates = deliveryDates();
  const lowStock = !soldOut && !preorder && product.stock > 0 && product.stock <= 5;
  const bundlePartner = !preorder && !soldOut ? related.find((p) => !isSoldOut(p)) : undefined;
  // qty-aware: the pair is main x qty + 1 partner, 10% off that total.
  // The same saving is what the cart actually deducts (see addBundleToCart).
  const bundleTotal = bundlePartner ? product.price * qty + bundlePartner.price : 0;
  const bundlePrice = bundlePartner ? Math.round(bundleTotal * 0.9) : 0;
  const bundleSaving = bundleTotal - bundlePrice;

  function handleAddBundle() {
    if (!bundlePartner) return;
    flyToCart(
      dialogRef.current?.querySelector("img"),
      product.image_url,
      t("addedToCart"),
      product.name
    );
    addBundleToCart(product, bundlePartner, qty);
    close();
  }

  async function handleShare() {
    const url = `${SHOP.siteUrl || window.location.origin}/?p=${product.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: displayName, text: displayName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the customer cancelled the share sheet - nothing to do */
    }
  }

  const askText = `${lang === "bn" ? "হ্যালো, এই পণ্যটি সম্পর্কে জানতে চাই:" : "Hello, I have a question about:"} ${displayName} ${SHOP.siteUrl ? `(${SHOP.siteUrl}/?p=${product.id})` : ""}`;

  async function handleBuyNow() {
    if (soldOut || buying) return;
    if (!isProfileComplete) {
      setSignupOpen(true);
      return;
    }
    setBuying(true);
    setBuyError("");
    try {
      // Order is saved in the database first (price, stock and total are checked on the server).
      await placeOrderAndOpenWhatsApp(
        [{ product_id: product.id, quantity: qty }],
        profile,
        null,
        attemptKey.current
      );
      attemptKey.current = newIdempotencyKey();
    } catch (err: any) {
      setBuyError(err?.message || "Order could not be placed. Please try again.");
    } finally {
      setBuying(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fadeSlide items-end justify-center bg-[#17120E]/60 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={displayName}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-3xl animate-fadeUp flex-col overflow-y-auto rounded-t-[32px] bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] dark:bg-gray-900 sm:flex-row sm:rounded-[32px]"
      >
        <button
          onClick={close}
          aria-label="close"
          className="glass absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full shadow-md ring-1 ring-black/5 transition hover:scale-105 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>

        <ProductGallery
          product={product}
          alt={displayName}
          soldOut={soldOut}
          soldOutLabel={t("outOfStock")}
        />

        <div className="flex flex-1 flex-col gap-3.5 p-6 sm:p-7">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald">{product.category}</span>
          <h2 className="text-2xl font-black leading-tight tracking-tight text-[#17120E] dark:text-white">{displayName}</h2>

          <div className="flex w-fit items-center gap-1.5 rounded-full bg-[#FFC400]/15 px-2.5 py-1 text-[#9a7b1e] dark:text-[#FFE066]">
            <Star className="h-4 w-4" filled />
            <span className="text-sm font-bold">{(product.rating ?? 4.5).toFixed(1)}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-[#17120E] dark:text-white">
              ৳{product.price.toLocaleString("en-BD")}
            </span>
            {product.original_price && product.discount_percent ? (
              <>
                <span className="text-sm text-gray-400 line-through">
                  ৳{product.original_price.toLocaleString("en-BD")}
                </span>
                <span className="btn-brand rounded-full px-2.5 py-1 text-xs font-extrabold text-white">
                  -{product.discount_percent}%
                </span>
              </>
            ) : null}
          </div>

          {/* live viewers + low-stock urgency */}
          {!soldOut && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-300">
                <Ico name="eye" className="h-4 w-4 text-emerald" />
                {lang === "bn" ? `${viewers} জন এখন দেখছে` : `${viewers} people viewing now`}
              </span>
              {lowStock && (
                <span className="flex items-center gap-1.5 text-red-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  {lang === "bn" ? `মাত্র ${product.stock}টি বাকি` : `Only ${product.stock} left`}
                </span>
              )}
            </div>
          )}

          {product.description && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                {t("description")}
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {product.description}
              </p>
            </div>
          )}

          <span
            className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
              preorder
                ? "bg-[#FFC400]/20 text-[#8a6d17]"
                : !soldOut
                ? "bg-emerald/10 text-emerald"
                : "bg-red-100 text-red-500"
            }`}
          >
            {preorder
              ? `${lang === "bn" ? "প্রি-অর্ডার" : "Pre-Order"}${product.preorder_eta ? ` · ${product.preorder_eta}` : ""}`
              : !soldOut
              ? t("inStock")
              : t("outOfStock")}
          </span>

          {/* quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {t("quantity")}
            </span>
            <div className="flex items-center gap-3 rounded-full bg-black/[0.04] px-3 py-1.5 dark:bg-white/10">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-semibold">{qty}</span>
              <button
                onClick={() =>
                  setQty((q) =>
                    product.stock > 0 && !preorder ? Math.min(q + 1, product.stock) : q + 1
                  )
                }
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {preorder && (
            <p className="rounded-2xl bg-[#FFC400]/10 px-3.5 py-2.5 text-xs font-medium text-[#6f5612] dark:text-[#FFE066]">
              {lang === "bn"
                ? "এটি প্রি-অর্ডার পণ্য। অর্ডার করলে আমরা হোয়াটসঅ্যাপে আপনাকে ডেলিভারির সময় জানিয়ে দেব।"
                : "This is a pre-order item. After you order, we'll confirm the delivery time with you on WhatsApp."}
            </p>
          )}
          <p className="flex items-center gap-2 rounded-2xl bg-[#f6f6f7] px-3.5 py-2.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
            <Ico name="truck" className="h-4 w-4 text-emerald" />
            {lang === "bn"
              ? `গাইবান্ধা সদরে ফ্রি ডেলিভারি · বাইরে ৳${SHOP.deliveryOutside}`
              : `Free delivery in Gaibandha Sadar · ৳${SHOP.deliveryOutside} elsewhere`}
          </p>

          {/* delivery date estimate (pre-orders confirm the date on WhatsApp) */}
          {!preorder && (
            <div className="rounded-2xl bg-emerald/5 px-3.5 py-2.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
              <p className="flex items-start gap-2">
                <Ico name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                <span>
                  {lang === "bn" ? "অর্ডার করলে পাবেন:" : "Order now, get it by:"}
                  <span className="mt-0.5 block font-bold text-[#17120E] dark:text-white">
                    {lang === "bn"
                      ? `সদরে ${formatDeliveryDate(dates.sadar, lang)} (ফ্রি) · বাইরে ${formatDeliveryDate(dates.outside, lang)} (৳${SHOP.deliveryOutside})`
                      : `Sadar ${formatDeliveryDate(dates.sadar, lang)} (free) · elsewhere ${formatDeliveryDate(dates.outside, lang)} (৳${SHOP.deliveryOutside})`}
                  </span>
                </span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="h-10 rounded-full border border-black/10 text-xs font-bold text-gray-700 transition active:scale-95 dark:border-white/15 dark:text-gray-200"
            >
              {copied ? (lang === "bn" ? "লিংক কপি হয়েছে" : "Link copied") : lang === "bn" ? "শেয়ার করুন" : "Share"}
            </button>
            <a
              href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(askText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center justify-center rounded-full border border-[#25D366]/50 text-xs font-bold text-[#128C4A] transition active:scale-95 dark:text-[#4ADE80]"
            >
              {lang === "bn" ? "হোয়াটসঅ্যাপে জিজ্ঞাসা" : "Ask on WhatsApp"}
            </a>
          </div>

          <ProductReviews productId={product.id} />

          {related.length > 0 && (
            <div className="border-t border-black/[0.06] pt-4 dark:border-white/10">
              <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                {lang === "bn" ? "একই ধরনের পণ্য" : "You may also like"}
              </h4>
              <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
                {related.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveProduct(r)}
                    className="w-24 shrink-0 text-left transition active:scale-95"
                  >
                    <span className="relative block aspect-square overflow-hidden rounded-xl bg-[#f4f4f5] dark:bg-white/10">
                      {r.image_url && (
                        <Image src={r.image_url} alt={r.name} fill sizes="96px" className={`object-cover ${isSoldOut(r) ? "grayscale" : ""}`} />
                      )}
                    </span>
                    <span className="mt-1 line-clamp-1 block text-[11px] font-semibold">{lang === "bn" && r.name_bn ? r.name_bn : r.name}</span>
                    <span className="text-[11px] font-extrabold text-emerald">৳{r.price.toLocaleString("en-BD")}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* bundle deal: this product + the first in-stock related item, 10% off the pair */}
          {bundlePartner && (
            <div className="rounded-2xl border border-[#FF6A1A]/25 bg-orange-50/70 p-4 dark:bg-orange-500/10">
              <h4 className="text-xs font-extrabold text-[#17120E] dark:text-white">
                {lang === "bn" ? "একসাথে কিনলে ছাড়" : "Buy together & save"}
              </h4>
              <div className="mt-3 flex items-center gap-2">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  {product.image_url && (
                    <Image src={product.image_url} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                  )}
                  <span className="line-clamp-1 min-w-0 text-[11px] font-bold">{displayName}</span>
                </span>
                <span className="shrink-0 text-sm font-black text-[#FF6A1A]">+</span>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  {bundlePartner.image_url && (
                    <Image src={bundlePartner.image_url} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                  )}
                  <span className="line-clamp-1 min-w-0 text-[11px] font-bold">
                    {lang === "bn" && bundlePartner.name_bn ? bundlePartner.name_bn : bundlePartner.name}
                  </span>
                </span>
              </div>
              <p className="mt-3 flex items-baseline gap-2 text-sm">
                <span className="text-gray-400 line-through">৳{bundleTotal.toLocaleString("en-BD")}</span>
                <span className="font-black text-[#17120E] dark:text-white">৳{bundlePrice.toLocaleString("en-BD")}</span>
                <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[11px] font-extrabold text-emerald">
                  {lang === "bn" ? `৳${bundleSaving.toLocaleString("en-BD")} ছাড়` : `Save ৳${bundleSaving.toLocaleString("en-BD")}`}
                </span>
              </p>
              <button
                type="button"
                onClick={handleAddBundle}
                className="btn-brand mt-3 h-11 w-full rounded-full text-sm font-bold text-white"
              >
                {lang === "bn"
                  ? `দুটোই কার্টে নিন — ৳${bundlePrice.toLocaleString("en-BD")}`
                  : `Add both to cart — ৳${bundlePrice.toLocaleString("en-BD")}`}
              </button>
            </div>
          )}

          {buyError && (
            <p role="alert" className="rounded-2xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
              {buyError}
            </p>
          )}

          <div className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-auto grid grid-cols-[auto_1fr_1.2fr] gap-2.5 bg-white/95 px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 backdrop-blur dark:bg-gray-900/95 sm:static sm:mx-0 sm:mb-0 sm:bg-transparent sm:p-0 sm:pt-2 sm:backdrop-blur-none">
            <button
              onClick={() => toggleWishlist(product)}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition active:scale-95 ${
                wished
                  ? "border-red-400 text-red-500"
                  : "border-gray-200 text-gray-500 dark:border-white/10"
              }`}
            >
              <Heart className="h-5 w-5" filled={wished} />
            </button>
            {!preorder ? (
            <button
              onClick={(e) => {
                flyToCart(
                  (e.currentTarget as HTMLElement).closest('[role="dialog"]')?.querySelector("img"),
                  product.image_url,
                  t("addedToCart"),
                  product.name
                );
                addToCart(product, qty);
                close();
              }}
              disabled={soldOut}
              className="h-12 rounded-full border-2 border-emerald/50 px-3 text-sm font-bold text-emerald transition hover:border-emerald hover:bg-emerald hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              {t("addToCart")}
            </button>
            ) : null}
            <button
              onClick={handleBuyNow}
              disabled={soldOut || buying}
              className={`btn-brand h-12 rounded-full px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70 ${preorder ? "col-span-2" : ""}`}
            >
              {buying
                ? (lang === "bn" ? "অপেক্ষা করুন…" : "Placing order…")
                : preorder ? (lang === "bn" ? "প্রি-অর্ডার করুন" : "Pre-Order Now") : t("buyNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
