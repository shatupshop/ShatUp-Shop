"use client";

import Ico from "./Ico";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { Trash, X } from "./icons";
import { useDialog } from "@/lib/useDialog";
import { isSoldOut } from "@/lib/types";

export default function WishlistDrawer() {
  const { isWishlistOpen, setWishlistOpen, wishlist, toggleWishlist, addToCart, t, lang } =
    useStore();

  useDialog(isWishlistOpen, () => setWishlistOpen(false));

  if (!isWishlistOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fadeSlide justify-end bg-[#17120E]/60 backdrop-blur-md"
      onClick={() => setWishlistOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("yourWishlist")}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md animate-fadeUp flex-col bg-[#f6f6f7] shadow-[0_0_80px_-10px_rgba(0,0,0,0.5)] dark:bg-gray-900 sm:rounded-l-[32px]"
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black tracking-tight">{t("yourWishlist")}</h2>
            {wishlist.length > 0 && (
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#17120E] px-1.5 text-xs font-bold text-white dark:bg-white dark:text-black">
                {wishlist.length}
              </span>
            )}
          </div>
          <button
            aria-label="close"
            onClick={() => setWishlistOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] transition hover:bg-black/10 active:scale-95 dark:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {wishlist.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10"><Ico name="heart" className="h-9 w-9" /></span>
              <p className="text-sm font-medium text-gray-500">{t("emptyWishlist")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {wishlist.map((product) => {
                const displayName =
                  lang === "bn" && product.name_bn ? product.name_bn : product.name;
                const out = isSoldOut(product) && !product.is_preorder;
                return (
                  <div
                    key={product.id}
                    className="flex gap-3 rounded-[22px] bg-white p-3 shadow-lux ring-1 ring-black/[0.04] dark:bg-white/5 dark:ring-white/10"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f3eee8] dark:bg-white/10">
                      {product.image_url && (
                        <Image
                          src={product.image_url}
                          alt={displayName}
                          fill
                          sizes="80px"
                          className={`object-cover ${out ? "grayscale" : ""}`}
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <span className="line-clamp-2 text-sm font-semibold leading-snug">
                        {displayName}
                      </span>
                      <span className="mt-0.5 text-sm font-extrabold text-emerald">
                        ৳{product.price.toLocaleString("en-BD")}
                      </span>
                      <div className="mt-2 flex items-center gap-2">
                        {product.is_preorder ? (
                          <span className="rounded-full bg-[#FFC400]/20 px-2.5 py-1 text-[11px] font-bold text-[#8a6d17]">
                            {lang === "bn" ? "প্রি-অর্ডার" : "Pre-Order"}
                          </span>
                        ) : (
                          <button
                            onClick={() => addToCart(product, 1)}
                            disabled={out}
                            className="btn-brand rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white disabled:cursor-not-allowed"
                          >
                            {out ? t("outOfStock") : t("addToCart")}
                          </button>
                        )}
                        <button
                          aria-label="remove from wishlist"
                          onClick={() => toggleWishlist(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
