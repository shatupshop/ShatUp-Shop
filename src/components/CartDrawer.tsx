"use client";

import Ico from "./Ico";
import { useRef, useState } from "react";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { Minus, Plus, Tag, Trash, WhatsApp, X } from "./icons";
import { newIdempotencyKey, placeOrderAndOpenWhatsApp } from "@/lib/orders";
import { useDialog } from "@/lib/useDialog";
import { SHOP, deliveryChargeFor, DeliveryArea, PayMethod } from "@/lib/shop";

export default function CartDrawer() {
  const {
    isCartOpen,
    setCartOpen,
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponLoading,
    couponError,
    discountAmount,
    bundleDiscountAmount,
    activeBundles,
    cartGrandTotal,
    t,
    lang,
    profile,
    isProfileComplete,
    setSignupOpen,
    clearCart
  } = useStore();

  const [couponInput, setCouponInput] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");
  const attemptKey = useRef(newIdempotencyKey());
  const [area, setArea] = useState<DeliveryArea>("inside");
  const [pay, setPay] = useState<PayMethod>("later");
  const [trxId, setTrxId] = useState("");
  const deliveryCharge = deliveryChargeFor(area);
  const payable = cartGrandTotal + deliveryCharge;
  const bn = lang === "bn";

  useDialog(isCartOpen, () => setCartOpen(false));

  if (!isCartOpen) return null;

  async function handleOrder() {
    if (!isProfileComplete) { setSignupOpen(true); return; }
    if (!cart.length || ordering) return;
    setOrdering(true); setOrderError("");
    try {
      const lines = cart.map((item) => ({ product_id: item.product.id, quantity: item.quantity }));
      // Saved in the database first; WhatsApp only opens after the server confirmed the order.
      // Active bundles go along so the server can re-derive the same 10% pair discount.
      await placeOrderAndOpenWhatsApp(lines, profile, appliedCoupon?.code ?? null, attemptKey.current, {
        deliveryArea: area,
        deliveryCharge,
        payment: pay,
        trxId: pay === "later" ? undefined : trxId.trim().slice(0, 30) || undefined
      }, activeBundles);
      attemptKey.current = newIdempotencyKey();
      clearCart();
      setCartOpen(false);
    } catch (err: any) {
      setOrderError(err?.message || "অর্ডার করা যায়নি। আবার চেষ্টা করুন।");
    } finally { setOrdering(false); }
  }

  function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon(couponInput);
    setCouponInput("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fadeSlide justify-end bg-[#17120E]/60 backdrop-blur-md"
      onClick={() => setCartOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("yourCart")}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md animate-fadeUp flex-col bg-[#f6f6f7] shadow-[0_0_80px_-10px_rgba(0,0,0,0.5)] dark:bg-gray-900 sm:rounded-l-[32px]"
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black tracking-tight">{t("yourCart")}</h2>
            {cart.length > 0 && (
              <span className="btn-brand flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-xs font-bold text-white">
                {cart.length}
              </span>
            )}
          </div>
          <button
            aria-label="close"
            onClick={() => setCartOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] transition hover:bg-black/10 active:scale-95 dark:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {cart.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald/10 text-emerald"><Ico name="cart" className="h-9 w-9" /></span>
              <p className="text-sm font-medium text-gray-500">{t("emptyCart")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cart.map((item) => {
                const displayName =
                  lang === "bn" && item.product.name_bn
                    ? item.product.name_bn
                    : item.product.name;
                return (
                  <div
                    key={item.product.id}
                    className="flex gap-3 rounded-[22px] bg-white p-3 shadow-lux ring-1 ring-black/[0.04] dark:bg-white/5 dark:ring-white/10"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f3eee8] dark:bg-white/10">
                      {item.product.image_url && (
                        <Image
                          src={item.product.image_url}
                          alt={displayName}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="line-clamp-2 text-sm font-semibold leading-snug">
                        {displayName}
                      </span>
                      <span className="mt-0.5 text-sm font-extrabold text-emerald">
                        ৳{item.product.price.toLocaleString("en-BD")}
                      </span>
                      <div className="mt-auto flex items-center justify-between pt-1.5">
                        <div className="flex items-center gap-1 rounded-full bg-black/[0.05] p-1 dark:bg-white/10">
                          <button
                            aria-label="decrease quantity"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm transition active:scale-90 dark:bg-white/10"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <button
                            aria-label="increase quantity"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm transition active:scale-90 dark:bg-white/10"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          aria-label="remove item"
                          onClick={() => removeFromCart(item.product.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-red-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
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

        {cart.length > 0 && (
          <div className="rounded-t-[28px] bg-white p-5 shadow-[0_-20px_40px_-20px_rgba(23,18,14,0.25)] dark:bg-gray-950">
            {appliedCoupon ? (
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-emerald/30 bg-emerald/5 px-3.5 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-emerald" />
                  <span className="font-bold text-emerald">{appliedCoupon.code}</span>
                  <span className="text-xs text-gray-500">
                    {appliedCoupon.discount_type === "percent"
                      ? `${appliedCoupon.discount_value}% ${t("off")}`
                      : `৳${appliedCoupon.discount_value} ${t("off")}`}
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-semibold text-red-500 hover:underline"
                >
                  {t("removeCoupon")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="mb-3">
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-500">
                  <Tag className="h-3.5 w-3.5" /> {t("haveCoupon")}
                </label>
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder={t("couponCode")}
                    className="flex-1 rounded-full border border-black/[0.08] bg-black/[0.03] px-4 py-2.5 text-sm uppercase tracking-wide outline-none transition focus:border-emerald/60 focus:bg-white focus:ring-4 focus:ring-emerald/15 dark:border-white/10 dark:bg-white/5"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput.trim()}
                    className="btn-brand rounded-full px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {couponLoading ? "…" : t("applyCoupon")}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{couponError}</p>
                )}
              </form>
            )}

            {/* delivery area */}
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-500">
                <Ico name="truck" className="h-3.5 w-3.5" /> {bn ? "ডেলিভারি এলাকা" : "Delivery area"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["inside", bn ? "গাইবান্ধা সদর" : "Gaibandha Sadar", bn ? "ফ্রি" : "Free"],
                  ["outside", bn ? "সদরের বাইরে" : "Outside Sadar", `৳${SHOP.deliveryOutside}`]
                ] as [DeliveryArea, string, string][]).map(([key, label, fee]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setArea(key)}
                    aria-pressed={area === key}
                    className={`rounded-2xl border px-3 py-2 text-left text-xs transition active:scale-[0.98] ${
                      area === key
                        ? "border-emerald bg-emerald/5 ring-2 ring-emerald/20"
                        : "border-black/[0.08] dark:border-white/10"
                    }`}
                  >
                    <span className="block font-bold">{label}</span>
                    <span className={`font-semibold ${key === "inside" ? "text-emerald" : "text-gray-500"}`}>{fee}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* payment */}
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-semibold text-gray-500">{bn ? "পেমেন্ট" : "Payment"}</p>
              <div className="flex flex-wrap gap-2">
                {([
                  ["later", bn ? "হোয়াটসঅ্যাপে জানাব" : "Decide on WhatsApp"],
                  ...(SHOP.bkash ? [["bkash", "bKash"]] : []),
                  ...(SHOP.nagad ? [["nagad", "Nagad"]] : [])
                ] as [PayMethod, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPay(key)}
                    aria-pressed={pay === key}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                      pay === key ? "border-emerald bg-emerald text-white" : "border-black/[0.1] dark:border-white/15"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {pay !== "later" && (
                <div className="mt-2 rounded-2xl bg-[#f6f6f7] p-3 text-xs dark:bg-white/5">
                  <p className="font-medium text-gray-600 dark:text-gray-300">
                    {bn ? "এই নম্বরে Send Money করুন:" : "Send money to this number:"}{" "}
                    <span className="select-all font-extrabold tracking-wide text-[#17120E] dark:text-white">
                      {pay === "bkash" ? SHOP.bkash : SHOP.nagad}
                    </span>
                  </p>
                  <p className="mt-0.5 text-gray-500">{bn ? "পরিমাণ" : "Amount"}: ৳{payable.toLocaleString("en-BD")}</p>
                  <input
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    maxLength={30}
                    placeholder={bn ? "Transaction ID (পাঠানোর পর)" : "Transaction ID (after sending)"}
                    className="mt-2 w-full rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs uppercase outline-none focus:border-emerald/60 dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              )}
            </div>

            <div className="mb-4 flex flex-col gap-1.5 text-sm">
              <div className="flex items-center justify-between text-gray-500">
                <span>{t("subtotal")}</span>
                <span>৳{cartTotal.toLocaleString("en-BD")}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald">
                  <span>{t("discount")}</span>
                  <span>-৳{discountAmount.toLocaleString("en-BD")}</span>
                </div>
              )}
              {bundleDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald">
                  <span>{t("bundleDiscount")} (10%)</span>
                  <span>-৳{bundleDiscountAmount.toLocaleString("en-BD")}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-gray-500">
                <span>{bn ? "ডেলিভারি" : "Delivery"}</span>
                <span className={deliveryCharge === 0 ? "font-semibold text-emerald" : ""}>
                  {deliveryCharge === 0 ? (bn ? "ফ্রি" : "Free") : `৳${deliveryCharge.toLocaleString("en-BD")}`}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-dashed border-black/10 pt-2.5 dark:border-white/10">
                <span className="font-bold">{t("total")}</span>
                <span className="text-2xl font-black tracking-tight text-emerald">
                  ৳{payable.toLocaleString("en-BD")}
                </span>
              </div>
            </div>

            {orderError && <p className="mb-2 text-xs font-medium text-red-500">{orderError}</p>}
            <button
              onClick={handleOrder}
              disabled={ordering}
              className="btn-brand sheen flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white disabled:opacity-60"
            >
              <WhatsApp className="h-5 w-5" /> {ordering ? "অর্ডার সংরক্ষণ হচ্ছে…" : t("orderOnWhatsapp")}
            </button>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400">
              <Ico name="truck" className="h-3.5 w-3.5" /> {bn
                ? `গাইবান্ধা সদরে ফ্রি ডেলিভারি · বাইরে ৳${SHOP.deliveryOutside}`
                : `Free delivery in Gaibandha Sadar · ৳${SHOP.deliveryOutside} elsewhere`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
