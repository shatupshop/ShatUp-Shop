"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import CountUp from "@/components/CountUp";

type Row = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  order_items: { product_name: string; quantity: number; line_total: number }[] | null;
};

const DAY = 86400000;
const money = (n: number) => `৳${Math.round(n).toLocaleString("en-BD")}`;
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function SalesReport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    const since = new Date(Date.now() - 90 * DAY).toISOString();
    supabase
      .from("orders")
      .select("id, total, status, created_at, order_items(product_name, quantity, line_total)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000)
      .then(({ data, error: err }) => {
        if (!live) return;
        if (err) setError(err.message);
        else setRows((data || []) as unknown as Row[]);
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const stats = useMemo(() => {
    const live = rows.filter((r) => r.status !== "cancelled");
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const t0 = startToday.getTime();
    const within = (ms: number) => live.filter((r) => new Date(r.created_at).getTime() >= ms);
    const sum = (list: Row[]) => list.reduce((a, r) => a + Number(r.total || 0), 0);
    const today = within(t0);
    const week = within(t0 - 6 * DAY);
    const month = within(t0 - 29 * DAY);

    const top = new Map<string, { qty: number; revenue: number }>();
    month.forEach((r) =>
      (r.order_items || []).forEach((i) => {
        const cur = top.get(i.product_name) || { qty: 0, revenue: 0 };
        cur.qty += Number(i.quantity);
        cur.revenue += Number(i.line_total);
        top.set(i.product_name, cur);
      })
    );
    const topList = Array.from(top.entries()).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);

    const byDay = new Map<string, number>();
    live.forEach((r) => byDay.set(dayKey(new Date(r.created_at)), (byDay.get(dayKey(new Date(r.created_at))) || 0) + Number(r.total || 0)));
    const bars = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(t0 - (13 - i) * DAY);
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, value: byDay.get(dayKey(d)) || 0 };
    });

    const statusCount: Record<string, number> = {};
    rows.filter((r) => new Date(r.created_at).getTime() >= t0 - 29 * DAY).forEach((r) => (statusCount[r.status] = (statusCount[r.status] || 0) + 1));

    return {
      today: { n: today.length, sum: sum(today) },
      week: { n: week.length, sum: sum(week) },
      month: { n: month.length, sum: sum(month) },
      avg: month.length ? sum(month) / month.length : 0,
      topList,
      bars,
      statusCount
    };
  }, [rows]);

  if (loading) return <p className="p-8 text-center text-sm text-gray-400">Loading report…</p>;
  if (error) return <p className="mx-auto max-w-3xl p-6 text-sm text-red-500">{error}</p>;

  const maxBar = Math.max(1, ...stats.bars.map((b) => b.value));
  const card = "rounded-2xl border border-gray-200 bg-white p-4 shadow-card dark:border-white/10 dark:bg-white/5";

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Today", stats.today],
          ["Last 7 days", stats.week],
          ["Last 30 days", stats.month]
        ].map(([label, v]) => (
          <div key={label as string} className={card}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label as string}</p>
            <p className="mt-1 text-2xl font-black text-emerald">
              <CountUp value={Math.round((v as { sum: number }).sum)} prefix="৳" />
            </p>
            <p className="text-xs text-gray-500">{(v as { n: number }).n} orders</p>
          </div>
        ))}
        <div className={card}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Avg order (30d)</p>
          <p className="mt-1 text-2xl font-black">{money(stats.avg)}</p>
          <p className="text-xs text-gray-500">cancelled orders excluded</p>
        </div>
      </div>

      <div className={card}>
        <p className="mb-3 text-sm font-bold">Daily sales — last 14 days</p>
        <div className="flex h-36 items-end gap-1.5">
          {stats.bars.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1" title={`${b.label}: ${money(b.value)}`}>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-[#FF7900] to-[#FFC400] transition-[height] duration-700"
                  style={{ height: `${Math.max(b.value > 0 ? 4 : 0, (b.value / maxBar) * 100)}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-400">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <p className="mb-2 text-sm font-bold">Best sellers (30 days)</p>
          {stats.topList.length === 0 ? (
            <p className="text-xs text-gray-400">No sales yet.</p>
          ) : (
            <ol className="space-y-2">
              {stats.topList.map(([name, v], i) => (
                <li key={name} className="flex items-center gap-2 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-xs font-black text-emerald">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <span className="shrink-0 text-xs font-bold">{v.qty} sold</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className={card}>
          <p className="mb-2 text-sm font-bold">Orders by status (30 days)</p>
          <ul className="space-y-1.5 text-sm">
            {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
              <li key={s} className="flex justify-between capitalize">
                <span className="text-gray-500">{s}</span>
                <span className="font-bold">{stats.statusCount[s] || 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-center text-[11px] text-gray-400">Based on the last 90 days of orders (up to 2000). Delivery charges are not included.</p>
    </div>
  );
}
