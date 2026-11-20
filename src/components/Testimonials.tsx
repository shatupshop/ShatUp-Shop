"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useStore } from "@/context/StoreContext";
import SectionHeading from "./SectionHeading";
import { Stars } from "./ProductReviews";

type Row = { id: string; customer_name: string; rating: number; comment: string };

// Home page strip with the best approved customer reviews. Stays hidden until there are some.
export default function Testimonials() {
  const { lang } = useStore();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let live = true;
    supabase
      .from("product_reviews")
      .select("id, customer_name, rating, comment")
      .eq("is_approved", true)
      .gte("rating", 4)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (live && !error) setRows((data || []) as Row[]);
      });
    return () => {
      live = false;
    };
  }, []);

  if (rows.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4">
      <SectionHeading eyebrow={lang === "bn" ? "ভালোবাসা" : "Love from customers"} title={lang === "bn" ? "ক্রেতারা কী বলছেন" : "What customers say"} />
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {rows.map((r) => (
          <figure key={r.id} className="w-72 shrink-0 snap-center rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] dark:bg-white/5 dark:ring-white/10">
            <Stars value={r.rating} className="h-4 w-4" />
            <blockquote className="mt-2 line-clamp-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{r.comment}</blockquote>
            <figcaption className="mt-3 text-xs font-bold">{r.customer_name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
