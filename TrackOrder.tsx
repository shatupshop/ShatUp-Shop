"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useStore } from "@/context/StoreContext";
import SectionHeading from "./SectionHeading";
import Ico from "./Ico";

type Tracked = {
  order_ref: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total: number;
  created_at: string;
  items: { name: string; quantity: number }[];
};

const STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;

export default function TrackOrder() {
  const { lang, profile } = useStore();
  const bn = lang === "bn";
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Tracked | null>(null);

  const label: Record<string, string> = bn
    ? { pending: "অপেক্ষমাণ", confirmed: "কনফার্মড", shipped: "পাঠানো হয়েছে", delivered: "ডেলিভারড", cancelled: "বাতিল" }
    : { pending: "Pending", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setOrder(null);
    if (!isSupabaseConfigured) {
      setBusy(false);
      setError(bn ? "শপ ডাটাবেসের সাথে যুক্ত নয়।" : "The shop is not connected to its database.");
      return;
    }
    const { data, error: err } = await supabase.rpc("track_order", { p_order_ref: ref.trim(), p_phone: phone.trim() });
    setBusy(false);
    if (err) {
      setError(/could not find the function|schema cache/i.test(err.message) ? (bn ? "অর্ডার ট্র্যাকিং এখনো চালু হয়নি।" : "Order tracking is not set up yet.") : err.message);
      return;
    }
    if (!data) {
      setError(bn ? "এই অর্ডার আইডি ও ফোন নম্বরে কোনো অর্ডার পাওয়া যায়নি।" : "No order found for this Order ID and phone number.");
      return;
    }
    setOrder(data as Tracked);
  }

  const step = order ? STEPS.indexOf(order.status as (typeof STEPS)[number]) : -1;

  return (
    <section id="track-order" className="mx-auto max-w-2xl scroll-mt-20 px-3 py-6 sm:px-4">
      <SectionHeading eyebrow={bn ? "অর্ডার" : "Orders"} title={bn ? "অর্ডার ট্র্যাক করুন" : "Track your order"} />
      <form onSubmit={submit} className="grid gap-2.5 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] dark:bg-white/5 dark:ring-white/10 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          required
          minLength={6}
          maxLength={12}
          placeholder={bn ? "অর্ডার আইডি (WhatsApp মেসেজে)" : "Order ID (from WhatsApp message)"}
          className="rounded-full border border-black/[0.08] bg-black/[0.03] px-4 py-2.5 text-sm uppercase outline-none focus:border-emerald/60 focus:bg-white dark:border-white/10 dark:bg-white/5"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          inputMode="tel"
          placeholder={bn ? "ফোন নম্বর" : "Phone number"}
          className="rounded-full border border-black/[0.08] bg-black/[0.03] px-4 py-2.5 text-sm outline-none focus:border-emerald/60 focus:bg-white dark:border-white/10 dark:bg-white/5"
        />
        <button type="submit" disabled={busy} className="btn-brand rounded-full px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy ? "…" : bn ? "খুঁজুন" : "Track"}
        </button>
      </form>

      {error && <p role="alert" className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

      {order && (
        <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] dark:bg-white/5 dark:ring-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="font-extrabold">#{order.order_ref}</span>
            <span className="font-black text-emerald">৳{Number(order.total).toLocaleString("en-BD")}</span>
          </div>
          {order.status === "cancelled" ? (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 dark:bg-red-500/10">{label.cancelled}</p>
          ) : (
            <ol className="mt-4 grid grid-cols-4 gap-1">
              {STEPS.map((s, i) => (
                <li key={s} className="flex flex-col items-center gap-1.5 text-center">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${i <= step ? "bg-emerald text-white" : "bg-black/[0.07] text-gray-400 dark:bg-white/10"}`}>
                    {i <= step ? <Ico name="check" className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                  </span>
                  <span className={`text-[10px] font-bold ${i <= step ? "text-emerald" : "text-gray-400"}`}>{label[s]}</span>
                </li>
              ))}
            </ol>
          )}
          <ul className="mt-4 space-y-1 border-t border-dashed border-black/10 pt-3 text-xs text-gray-600 dark:border-white/10 dark:text-gray-300">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="truncate">{it.name}</span>
                <span className="shrink-0 font-semibold">x{it.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-gray-400">{new Date(order.created_at).toLocaleString(bn ? "bn-BD" : "en-GB")}</p>
        </div>
      )}
    </section>
  );
}
