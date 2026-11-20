"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Star } from "@/components/icons";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  products: { name: string } | null;
};

export default function ReviewsManager() {
  const [rows, setRows] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("product_reviews")
      .select("*, products(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (err) {
      setError(
        /relation|does not exist|schema cache/i.test(err.message)
          ? "Reviews are not set up yet. Run supabase/growth_features.sql in the SQL Editor."
          : err.message
      );
    } else setRows((data || []) as unknown as Review[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setApproved(id: string, value: boolean) {
    setBusy(id);
    const { error: err } = await supabase.from("product_reviews").update({ is_approved: value }).eq("id", id);
    setBusy("");
    if (err) setError(err.message);
    else setRows((r) => r.map((x) => (x.id === id ? { ...x, is_approved: value } : x)));
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this review?")) return;
    setBusy(id);
    const { error: err } = await supabase.from("product_reviews").delete().eq("id", id);
    setBusy("");
    if (err) setError(err.message);
    else setRows((r) => r.filter((x) => x.id !== id));
  }

  const shown = rows.filter((r) => (filter === "all" ? true : filter === "pending" ? !r.is_approved : r.is_approved));
  const pending = rows.filter((r) => !r.is_approved).length;

  return (
    <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
      <div className="flex gap-2">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize transition ${filter === f ? "bg-emerald text-white" : "bg-black/[0.05] text-gray-600 dark:bg-white/10 dark:text-gray-300"}`}
          >
            {f}
            {f === "pending" && pending > 0 ? ` (${pending})` : ""}
          </button>
        ))}
      </div>
      {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">{error}</p>}
      {loading ? (
        <p className="p-6 text-center text-sm text-gray-400">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-400">No reviews here.</p>
      ) : (
        shown.map((r) => (
          <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {r.customer_name}{" "}
                  <span className="inline-flex items-center gap-0.5 align-middle text-[#F5B400]">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={`f-${i}`} className="h-3.5 w-3.5" filled />
                    ))}
                  </span>
                  <span className="inline-flex items-center gap-0.5 align-middle text-gray-300">
                    {Array.from({ length: 5 - r.rating }).map((_, i) => (
                      <Star key={`e-${i}`} className="h-3.5 w-3.5" filled />
                    ))}
                  </span>
                </p>
                <p className="truncate text-xs text-gray-400">{r.products?.name || "Deleted product"} · {new Date(r.created_at).toLocaleDateString("en-GB")}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${r.is_approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}`}>
                {r.is_approved ? "Live" : "Pending"}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>
            <div className="mt-3 flex gap-2">
              <button
                disabled={busy === r.id}
                onClick={() => setApproved(r.id, !r.is_approved)}
                className="rounded-full bg-emerald px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {r.is_approved ? "Hide" : "Approve"}
              </button>
              <button
                disabled={busy === r.id}
                onClick={() => remove(r.id)}
                className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-bold text-red-500 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
