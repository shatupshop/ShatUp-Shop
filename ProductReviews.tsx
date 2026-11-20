"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useStore } from "@/context/StoreContext";
import { Star } from "./icons";

type Review = { id: string; customer_name: string; rating: number; comment: string; created_at: string };

export function Stars({ value, className = "h-3.5 w-3.5" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5 text-[#F5B400]" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={className} filled={n <= Math.round(value)} />
      ))}
    </span>
  );
}

// Customer reviews for one product (only admin-approved ones are shown).
// Hides itself if the reviews table has not been created yet.
export default function ProductReviews({ productId }: { productId: string }) {
  const { lang, profile } = useStore();
  const bn = lang === "bn";
  const [reviews, setReviews] = useState<Review[]>([]);
  const [available, setAvailable] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAvailable(false);
      return;
    }
    let live = true;
    setReviews([]);
    setMsg(null);
    setOpen(false);
    supabase
      .from("product_reviews")
      .select("id, customer_name, rating, comment, created_at")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!live) return;
        if (error) setAvailable(false);
        else {
          setAvailable(true);
          setReviews((data || []) as Review[]);
        }
      });
    return () => {
      live = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!name && profile?.name) setName(profile.name);
  }, [profile?.name, name]);

  if (!available) return null;

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setMsg(null);
    const { error } = await supabase.rpc("submit_review", {
      p_product_id: productId,
      p_name: name,
      p_rating: rating,
      p_comment: comment
    });
    setSending(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setComment("");
    setOpen(false);
    setMsg({
      ok: true,
      text: bn ? "ধন্যবাদ! অনুমোদনের পর আপনার রিভিউ দেখা যাবে।" : "Thank you! Your review will appear after approval."
    });
  }

  return (
    <div className="border-t border-black/[0.06] pt-4 dark:border-white/10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{bn ? "কাস্টমার রিভিউ" : "Customer reviews"}</h4>
          {reviews.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-[#9a7b1e] dark:text-[#FFE066]">
              <Stars value={avg} className="h-3 w-3" /> {avg.toFixed(1)} ({reviews.length})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border border-emerald/40 px-3 py-1 text-xs font-bold text-emerald transition active:scale-95"
        >
          {bn ? "রিভিউ লিখুন" : "Write a review"}
        </button>
      </div>

      {msg && (
        <p role="status" className={`mt-2 rounded-xl px-3 py-2 text-xs font-medium ${msg.ok ? "bg-emerald/10 text-emerald" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </p>
      )}

      {open && (
        <form onSubmit={submit} className="mt-3 space-y-2 rounded-2xl bg-[#f6f6f7] p-3 dark:bg-white/5">
          <div className="flex items-center gap-1" role="radiogroup" aria-label="rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n}`}
                onClick={() => setRating(n)}
                className={`transition active:scale-90 ${n <= rating ? "text-[#F5B400]" : "text-gray-300"}`}
              >
                <Star className="h-6 w-6" filled={n <= rating} />
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
            placeholder={bn ? "আপনার নাম" : "Your name"}
            className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={600}
            required
            rows={3}
            placeholder={bn ? "পণ্যটি কেমন লাগলো?" : "How was the product?"}
            className="w-full resize-none rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
          />
          <button type="submit" disabled={sending} className="btn-brand h-10 w-full rounded-full text-sm font-bold text-white disabled:opacity-60">
            {sending ? "…" : bn ? "রিভিউ পাঠান" : "Submit review"}
          </button>
        </form>
      )}

      {reviews.length > 0 && (
        <ul className="mt-3 space-y-2.5">
          {reviews.slice(0, 4).map((r) => (
            <li key={r.id} className="rounded-2xl bg-[#f6f6f7] px-3.5 py-2.5 dark:bg-white/5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{r.customer_name}</span>
                <Stars value={r.rating} className="h-3 w-3" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
