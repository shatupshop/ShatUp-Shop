"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderLine = {
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  is_preorder: boolean;
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: { name: string; price: number; quantity: number; is_preorder?: boolean }[] | null;
  order_items: OrderLine[] | null;
  subtotal: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  status: Status;
  created_at: string;
};

const STATUS_STYLE: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700"
};

const LIMIT = 300;
const money = (n: number) => `৳${Number(n).toLocaleString("en-BD")}`;

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("orders")
      .select("*, order_items(product_name, unit_price, quantity, line_total, is_preorder)")
      .order("created_at", { ascending: false })
      .limit(LIMIT);
    if (err) {
      setError(
        /order_items|relationship|schema cache/i.test(err.message)
          ? "Orders could not be loaded. Run supabase/order_system_v2.sql in Supabase first."
          : err.message
      );
    } else {
      setOrders((data || []) as unknown as Order[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(order: Order, next: Status) {
    if (next === order.status) return;
    if (
      next === "cancelled" &&
      !confirm("Cancel this order? The stock will be returned automatically. This cannot be undone.")
    ) {
      return;
    }
    setBusy(order.id);
    setError("");
    const { error: err } = await supabase.rpc("update_order_status", {
      p_order_id: order.id,
      p_status: next
    });
    if (err) setError(err.message);
    await load();
    setBusy("");
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    const qDigits = q.replace(/\D/g, "");
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        (qDigits.length >= 3 && o.customer_phone.replace(/\D/g, "").includes(qDigits))
      );
    });
  }, [orders, query, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order ID or phone number"
          aria-label="Search orders"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | Status)}
          aria-label="Filter by status"
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold dark:border-white/10"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="p-6 text-sm text-gray-500">Loading orders…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 dark:bg-white/5">
          {orders.length === 0 ? "No orders yet." : "No orders match your search or filter."}
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            Showing {shown.length} of {orders.length} loaded orders
            {orders.length >= LIMIT ? ` (most recent ${LIMIT})` : ""}.
          </p>
          {shown.map((o) => {
            const lines: OrderLine[] =
              o.order_items && o.order_items.length > 0
                ? o.order_items
                : (o.items || []).map((it) => ({
                    product_name: it.name,
                    unit_price: it.price,
                    quantity: it.quantity,
                    line_total: it.price * it.quantity,
                    is_preorder: Boolean(it.is_preorder)
                  }));
            return (
              <article
                key={o.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">
                      #{o.id.slice(0, 8).toUpperCase()} · {o.customer_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {o.customer_phone} · {new Date(o.created_at).toLocaleString("en-BD")}
                    </p>
                    <p className="mt-1 break-words text-xs text-gray-500">{o.customer_address}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[o.status] || ""}`}>
                    {o.status}
                  </span>
                </div>

                <div className="my-3 space-y-1 border-y border-dashed border-gray-200 py-3 text-sm dark:border-white/10">
                  {lines.map((l, i) => (
                    <div key={i} className="flex justify-between gap-3">
                      <span className="min-w-0 break-words">
                        {l.product_name} × {l.quantity}
                        {l.is_preorder ? " (pre-order)" : ""}
                        <span className="text-xs text-gray-400"> @ {money(l.unit_price)}</span>
                      </span>
                      <span className="shrink-0">{money(l.line_total)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span>
                    Subtotal {money(o.subtotal)} · Discount {money(o.discount)}
                    {o.coupon_code ? ` (${o.coupon_code})` : ""}
                  </span>
                  <b className="text-emerald">Total {money(o.total)}</b>
                </div>

                {o.status === "cancelled" ? (
                  <p className="mt-3 text-xs text-gray-500">Cancelled. Stock was returned.</p>
                ) : (
                  <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Status
                    <select
                      value={o.status}
                      disabled={busy === o.id}
                      onChange={(e) => changeStatus(o, e.target.value as Status)}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none disabled:opacity-50 dark:border-white/10 dark:bg-white/5"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s === "cancelled" ? "Cancel order (returns stock)" : s[0].toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                    {busy === o.id && <span className="text-gray-400">Please wait…</span>}
                  </label>
                )}
              </article>
            );
          })}
        </>
      )}
    </div>
  );
}
