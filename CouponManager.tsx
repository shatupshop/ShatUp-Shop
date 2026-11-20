"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Coupon } from "@/lib/types";
import { Edit, Plus, Tag, Trash, X } from "@/components/icons";

const emptyForm = {
  id: "",
  code: "",
  discount_type: "percent" as "percent" | "fixed",
  discount_value: "",
  min_order_amount: "",
  max_discount_amount: "",
  usage_limit: "",
  expires_at: "",
  is_active: true
};

export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function loadCoupons() {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCoupons(data as Coupon[]);
    setLoading(false);
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  function openNewForm() {
    setForm(emptyForm);
    setErrorMsg("");
    setShowForm(true);
  }

  function openEditForm(c: Coupon) {
    setForm({
      id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: c.min_order_amount != null ? String(c.min_order_amount) : "",
      max_discount_amount:
        c.max_discount_amount != null ? String(c.max_discount_amount) : "",
      usage_limit: c.usage_limit != null ? String(c.usage_limit) : "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
      is_active: c.is_active
    });
    setErrorMsg("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const code = form.code.trim().toUpperCase();
    const value = Number(form.discount_value);

    if (!code) {
      setErrorMsg("Enter a coupon code, e.g. ROJA20.");
      return;
    }
    if (!value || value <= 0) {
      setErrorMsg("Enter a discount value greater than 0.");
      return;
    }
    if (form.discount_type === "percent" && value > 100) {
      setErrorMsg("A percentage discount can't be more than 100.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code,
        discount_type: form.discount_type,
        discount_value: value,
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
        max_discount_amount:
          form.discount_type === "percent" && form.max_discount_amount
            ? Number(form.max_discount_amount)
            : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        is_active: form.is_active
      };

      if (form.id) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }

      setShowForm(false);
      await loadCoupons();
    } catch (err: any) {
      if (String(err?.message || "").toLowerCase().includes("duplicate")) {
        setErrorMsg("This coupon code already exists — use a different one.");
      } else {
        setErrorMsg(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon? Customers won't be able to use it anymore.")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (!error) loadCoupons();
  }

  async function toggleActive(c: Coupon) {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    if (!error) loadCoupons();
  }

  function summarize(c: Coupon) {
    const parts = [
      c.discount_type === "percent" ? `${c.discount_value}% off` : `৳${c.discount_value} off`
    ];
    if (c.min_order_amount) parts.push(`min ৳${c.min_order_amount}`);
    if (c.discount_type === "percent" && c.max_discount_amount) {
      parts.push(`cap ৳${c.max_discount_amount}`);
    }
    if (c.usage_limit) parts.push(`limit ${c.used_count ?? 0}/${c.usage_limit}`);
    if (c.expires_at) parts.push(`expires ${new Date(c.expires_at).toLocaleDateString("en-GB")}`);
    return parts.join(" · ");
  }

  const isExpired = (c: Coupon) =>
    Boolean(c.expires_at && new Date(c.expires_at).getTime() < Date.now());

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Coupons ({coupons.length})</h2>
        <button
          onClick={openNewForm}
          className="flex items-center gap-1 rounded-full bg-emerald px-4 py-2 text-sm font-semibold text-white shadow-premium hover:bg-emerald-dark"
        >
          <Plus className="h-4 w-4" /> Add Coupon
        </button>
      </div>

      <p className="mb-4 text-xs text-gray-400">
        Codes are matched exactly as typed (case-insensitive — customers can type in any case).
        Leave min order, cap, usage limit or expiry blank for "no limit".
      </p>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
      ) : coupons.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">
          No coupons yet — add one to let customers get a discount at checkout.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-card dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                <Tag className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold tracking-wide">{c.code}</p>
                <p className="line-clamp-1 text-xs text-gray-400">{summarize(c)}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    c.is_active && !isExpired(c)
                      ? "bg-emerald/10 text-emerald"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isExpired(c) ? "Expired" : c.is_active ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive(c)}
                    className="rounded-full border border-gray-200 px-2 py-1 text-[11px] font-semibold hover:border-emerald hover:text-emerald dark:border-white/10"
                  >
                    {c.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => openEditForm(c)}
                    className="flex items-center gap-1 rounded-full border border-emerald px-2 py-1 text-[11px] font-semibold text-emerald hover:bg-emerald hover:text-white"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="flex items-center gap-1 rounded-full border border-red-300 px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <Trash className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setShowForm(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
            className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{form.id ? "Edit Coupon" : "Add Coupon"}</h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                Coupon code
                <input
                  placeholder="e.g. EID20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm uppercase tracking-wide outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                  Discount type
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discount_type: e.target.value as "percent" | "fixed",
                        max_discount_amount:
                          e.target.value === "fixed" ? "" : form.max_discount_amount
                      })
                    }
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed amount (৳)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                  {form.discount_type === "percent" ? "Percent off" : "Amount off (৳)"}
                  <input
                    type="number"
                    min={0}
                    max={form.discount_type === "percent" ? 100 : undefined}
                    placeholder={form.discount_type === "percent" ? "e.g. 15" : "e.g. 100"}
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                  Minimum order (optional)
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 1000"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                  />
                </label>
                {form.discount_type === "percent" && (
                  <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                    Max discount cap (৳, optional)
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 300"
                      value={form.max_discount_amount}
                      onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                  Usage limit (optional)
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 100"
                    value={form.usage_limit}
                    onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                  Expires on (optional)
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active (customers can use it right away)
              </label>

              {errorMsg && <p className="text-xs font-medium text-red-500">{errorMsg}</p>}

              <button
                type="submit"
                disabled={saving}
                className="mt-2 rounded-full bg-emerald py-3 text-sm font-bold text-white shadow-premium hover:bg-emerald-dark disabled:opacity-60"
              >
                {saving ? "Saving…" : form.id ? "Update Coupon" : "Add Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
