"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, isPromoLive, PromoSlide } from "@/lib/types";
import { compressImage } from "@/lib/image";
import { imageSizeWarning, SIZES } from "@/lib/imageHints";
import { ChevronDown, ChevronUp, Edit, Plus, Trash, Upload, X } from "@/components/icons";

// quick-fill chips for the Title box only — nothing is auto-created or hardcoded on the site
const CAMPAIGN_IDEAS = ["11.11 BIG SALE", "12.12 MEGA SALE", "EID SPECIAL OFFER", "FREE DELIVERY", "SPECIAL DISCOUNT"];

const emptyForm = {
  id: "",
  title: "",
  image_url: "",
  link_type: "none" as PromoSlide["link_type"],
  link_value: "",
  starts_at: "",
  ends_at: "",
  is_active: true
};

// ISO <-> <input type="datetime-local"> (local time)
function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fromLocalInput(v: string) {
  return v ? new Date(v).toISOString() : null;
}

function statusOf(b: PromoSlide): { label: string; cls: string } {
  const now = Date.now();
  if (!b.is_active) return { label: "Inactive", cls: "bg-gray-100 text-gray-400" };
  if (b.ends_at && new Date(b.ends_at).getTime() < now) return { label: "Expired", cls: "bg-red-100 text-red-500" };
  if (b.starts_at && new Date(b.starts_at).getTime() > now) return { label: "Scheduled", cls: "bg-amber-100 text-amber-600" };
  return { label: isPromoLive(b) ? "Live" : "Inactive", cls: "bg-emerald/10 text-emerald" };
}

const inputCls =
  "rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5";

export default function PromoBannerManager() {
  const [items, setItems] = useState<PromoSlide[]>([]);
  const [productOptions, setProductOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sizeHint, setSizeHint] = useState("");
  const [broken, setBroken] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("promo_banners").select("*").order("sort_order", { ascending: true });
    if (data) setItems(data as PromoSlide[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    supabase
      .from("products")
      .select("id,name")
      .order("name")
      .then(({ data }) => data && setProductOptions(data as { id: string; name: string }[]));
  }, []);

  function openNew() {
    setForm(emptyForm);
    setImageFile(null);
    setPreview("");
    setErrorMsg("");
    setShowForm(true);
  }

  function openEdit(b: PromoSlide) {
    setForm({
      id: b.id,
      title: b.title || "",
      image_url: b.image_url,
      link_type: b.link_type,
      link_value: b.link_value || "",
      starts_at: toLocalInput(b.starts_at),
      ends_at: toLocalInput(b.ends_at),
      is_active: b.is_active
    });
    setImageFile(null);
    setPreview(b.image_url);
    setErrorMsg("");
    setShowForm(true);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErrorMsg("Please select an image file.");
    if (f.size > 10 * 1024 * 1024) return setErrorMsg("Image must be 10 MB or smaller.");
    setErrorMsg("");
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
    setSizeHint(await imageSizeWarning(f, SIZES.promo));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      let imageUrl = form.image_url;
      if (imageFile) {
        const small = await compressImage(imageFile);
        const ext = small.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("promo-images").upload(fileName, small, {
          cacheControl: "31536000"
        });
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from("promo-images").getPublicUrl(fileName).data.publicUrl;
      }
      if (!imageUrl) throw new Error("Please upload a banner image.");

      const lv = form.link_value.trim();
      if (form.link_type !== "none" && !lv) throw new Error("Please set the destination for this link type.");
      if (form.link_type === "url" && !/^(https?:\/\/|\/|#)/i.test(lv)) {
        throw new Error("URL must start with https://, http://, / or #");
      }
      const startsAt = fromLocalInput(form.starts_at);
      const endsAt = fromLocalInput(form.ends_at);
      if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
        throw new Error("End date must be after the start date.");
      }

      const dupTitle = form.title.trim().toLowerCase();
      if (
        dupTitle &&
        items.some((x) => x.id !== form.id && (x.title || "").trim().toLowerCase() === dupTitle) &&
        !confirm("A promo with this same title already exists. Save anyway?")
      ) {
        setSaving(false);
        return;
      }

      const payload = {
        title: form.title.trim() || null,
        image_url: imageUrl,
        link_type: form.link_type,
        link_value: form.link_type === "none" ? null : lv,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: form.is_active,
        ...(form.id ? {} : { sort_order: items.length })
      };

      const { error } = form.id
        ? await supabase.from("promo_banners").update(payload).eq("id", form.id)
        : await supabase.from("promo_banners").insert(payload);
      if (error) throw error;

      setShowForm(false);
      await load();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promo banner?")) return;
    const { error } = await supabase.from("promo_banners").delete().eq("id", id);
    if (!error) load();
  }

  async function toggleActive(b: PromoSlide) {
    const { error } = await supabase.from("promo_banners").update({ is_active: !b.is_active }).eq("id", b.id);
    if (!error) load();
  }

  // re-number everything 0..n-1 so ordering never gets stuck on duplicate sort_order values
  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setItems(reordered);
    await Promise.all(
      reordered.map((b, i) => supabase.from("promo_banners").update({ sort_order: i }).eq("id", b.id))
    );
    load();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">Promo Strip ({items.length})</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-1 rounded-full bg-emerald px-4 py-2 text-sm font-semibold text-white shadow-premium hover:bg-emerald-dark"
        >
          <Plus className="h-4 w-4" /> Add Promo
        </button>
      </div>
      <p className="mb-4 text-xs text-gray-400">
        Small slider just under the header. Best image size: <b>1200×375px</b> (keep text in the middle band — it is
        cropped slightly on desktop). Expired, scheduled or inactive promos are hidden automatically.
      </p>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">
          No promo banners yet — the strip stays hidden until you add one.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((b, i) => {
            const st = statusOf(b);
            return (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-card dark:border-white/10 dark:bg-white/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.image_url}
                  alt={b.title || "promo"}
                  onError={() => setBroken((x) => (x.includes(b.id) ? x : [...x, b.id]))}
                  className="h-12 w-28 shrink-0 rounded-lg bg-gray-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">{b.title || "(no title)"}</p>
                  <p className="line-clamp-1 text-[11px] text-gray-400">
                    {b.link_type === "none" ? "No link" : `${b.link_type}: ${b.link_value}`}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {b.starts_at ? new Date(b.starts_at).toLocaleString() : "Now"} –{" "}
                    {b.ends_at ? new Date(b.ends_at).toLocaleString() : "No end"}
                  </p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>
                    {st.label}
                  </span>
                  {broken.includes(b.id) && (
                    <span className="ml-1 mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-500">
                      Broken image — re-upload
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="inline-flex items-center justify-center rounded-full border border-gray-200 px-2 py-1 disabled:opacity-30 dark:border-white/10"><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="inline-flex items-center justify-center rounded-full border border-gray-200 px-2 py-1 disabled:opacity-30 dark:border-white/10"><ChevronDown className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleActive(b)} className="rounded-full border border-gray-200 px-2 py-1 text-[11px] font-semibold hover:border-emerald hover:text-emerald dark:border-white/10">
                      {b.is_active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => openEdit(b)} className="flex items-center rounded-full border border-emerald px-2 py-1 text-emerald hover:bg-emerald hover:text-white">
                      <Edit className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="flex items-center rounded-full border border-red-300 px-2 py-1 text-red-500 hover:bg-red-500 hover:text-white">
                      <Trash className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
              <h2 className="text-lg font-bold">{form.id ? "Edit Promo" : "Add Promo"}</h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                Banner image (1200×375px)
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-36 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/10">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <Upload className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={onFile} className="text-xs" />
                </div>
                {sizeHint && <span className="text-[11px] font-medium text-amber-600">Note: {sizeHint}</span>}
              </label>

              <div>
                <input
                  placeholder="Campaign title (also used as image alt text)"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={`${inputCls} w-full`}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {CAMPAIGN_IDEAS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, title: c })}
                      className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:border-emerald hover:text-emerald dark:border-white/10"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                When clicked, go to…
                <select
                  value={form.link_type}
                  onChange={(e) => setForm({ ...form, link_type: e.target.value as PromoSlide["link_type"], link_value: "" })}
                  className={inputCls}
                >
                  <option value="none">Nowhere (display only)</option>
                  <option value="url">A URL / link</option>
                  <option value="product">A product</option>
                  <option value="category">A category</option>
                </select>
              </label>

              {form.link_type === "url" && (
                <input
                  placeholder="https://… or #flash-sale"
                  value={form.link_value}
                  onChange={(e) => setForm({ ...form, link_value: e.target.value })}
                  className={inputCls}
                />
              )}
              {form.link_type === "product" && (
                <select value={form.link_value} onChange={(e) => setForm({ ...form, link_value: e.target.value })} className={inputCls}>
                  <option value="">Select a product…</option>
                  {productOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
              {form.link_type === "category" && (
                <select value={form.link_value} onChange={(e) => setForm({ ...form, link_value: e.target.value })} className={inputCls}>
                  <option value="">Select a category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                  Start (optional)
                  <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                  End (optional)
                  <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className={inputCls} />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active (show when inside its date range)
              </label>

              {errorMsg && <p className="text-xs font-medium text-red-500">{errorMsg}</p>}

              <button
                type="submit"
                disabled={saving}
                className="mt-2 rounded-full bg-emerald py-3 text-sm font-bold text-white shadow-premium hover:bg-emerald-dark disabled:opacity-60"
              >
                {saving ? "Saving…" : form.id ? "Update Promo" : "Add Promo"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
