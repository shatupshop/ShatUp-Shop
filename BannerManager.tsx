"use client";

import { compressImage } from "@/lib/image";
import { imageSizeWarning, SIZES } from "@/lib/imageHints";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Banner } from "@/lib/types";
import { ChevronDown, ChevronUp, Edit, Play, Plus, Trash, Upload, X } from "@/components/icons";

const emptyForm = {
  id: "",
  title: "",
  subtitle: "",
  button_text: "",
  button_link: "",
  image_url: "",
  media_type: "image" as "image" | "video",
  is_active: true,
  sort_order: "0"
};

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sizeHint, setSizeHint] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function loadBanners() {
    setLoading(true);
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setBanners(data as Banner[]);
    setLoading(false);
  }

  useEffect(() => {
    loadBanners();
  }, []);

  function openNewForm() {
    setForm({ ...emptyForm, sort_order: String(banners.length) });
    setImageFile(null);
    setImagePreview("");
    setErrorMsg("");
    setShowForm(true);
  }

  function openEditForm(b: Banner) {
    setForm({
      id: b.id,
      title: b.title || "",
      subtitle: b.subtitle || "",
      button_text: b.button_text || "",
      button_link: b.button_link || "",
      image_url: b.image_url,
      media_type: b.media_type || "image",
      is_active: b.is_active,
      sort_order: String(b.sort_order ?? 0)
    });
    setImageFile(null);
    setImagePreview(b.image_url);
    setErrorMsg("");
    setShowForm(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setSizeHint(await imageSizeWarning(file, SIZES.hero));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      let imageUrl = form.image_url;

      if (imageFile) {
        if (form.media_type === "video" && imageFile.size > 20 * 1024 * 1024) {
          throw new Error(
            "That video is over 20MB — large videos slow the home page down for visitors on mobile data. Please compress it first (aim for under ~8MB for a smooth page load)."
          );
        }
        // photos are shrunk in the browser first so the homepage loads fast on mobile data
        const uploadFile =
          form.media_type === "video" ? imageFile : await compressImage(imageFile, 1920, 0.85);
        const ext = uploadFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("banner-images")
          .upload(fileName, uploadFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("banner-images")
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }

      if (!imageUrl) {
        throw new Error(
          form.media_type === "video" ? "Please upload a banner video." : "Please upload a banner image."
        );
      }

      const payload = {
        title: form.title || null,
        subtitle: form.subtitle || null,
        button_text: form.button_text || null,
        button_link: form.button_link || null,
        image_url: imageUrl,
        media_type: form.media_type,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0
      };

      if (form.id) {
        const { error } = await supabase.from("banners").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(payload);
        if (error) throw error;
      }

      setShowForm(false);
      await loadBanners();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this banner?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (!error) loadBanners();
  }

  async function toggleActive(b: Banner) {
    const { error } = await supabase
      .from("banners")
      .update({ is_active: !b.is_active })
      .eq("id", b.id);
    if (!error) loadBanners();
  }

  async function move(b: Banner, direction: -1 | 1) {
    const idx = banners.findIndex((x) => x.id === b.id);
    const swapWith = banners[idx + direction];
    if (!swapWith) return;
    await supabase.from("banners").update({ sort_order: swapWith.sort_order }).eq("id", b.id);
    await supabase.from("banners").update({ sort_order: b.sort_order }).eq("id", swapWith.id);
    loadBanners();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Home Banners ({banners.length})</h2>
        <button
          onClick={openNewForm}
          className="flex items-center gap-1 rounded-full bg-emerald px-4 py-2 text-sm font-semibold text-white shadow-premium hover:bg-emerald-dark"
        >
          <Plus className="h-4 w-4" /> Add Banner
        </button>
      </div>

      <p className="mb-4 text-xs text-gray-400">
        Add 2–3 banners for the best carousel experience on the home page. Drag order using the
        up/down arrows.
      </p>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
      ) : banners.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">
          No banners yet — the home page will show a default welcome banner until you add one.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {banners.map((b, i) => (
            <div
              key={b.id}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-card dark:border-white/10 dark:bg-white/5"
            >
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/10">
                {b.media_type === "video" ? (
                  <video src={b.image_url} className="h-full w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.image_url} alt={b.title || "banner"} className="h-full w-full object-cover" />
                )}
                {b.media_type === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-black">
                      <Play className="h-3 w-3" filled />
                    </span>
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="line-clamp-1 text-sm font-semibold">{b.title || "(no title)"}</p>
                <p className="line-clamp-1 text-xs text-gray-400">{b.subtitle}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    b.is_active ? "bg-emerald/10 text-emerald" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {b.is_active ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => move(b, -1)}
                    disabled={i === 0}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 px-2 py-1 disabled:opacity-30 dark:border-white/10"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move(b, 1)}
                    disabled={i === banners.length - 1}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 px-2 py-1 disabled:opacity-30 dark:border-white/10"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive(b)}
                    className="rounded-full border border-gray-200 px-2 py-1 text-[11px] font-semibold hover:border-emerald hover:text-emerald dark:border-white/10"
                  >
                    {b.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => openEditForm(b)}
                    className="flex items-center gap-1 rounded-full border border-emerald px-2 py-1 text-[11px] font-semibold text-emerald hover:bg-emerald hover:text-white"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
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
              <h2 className="text-lg font-bold">{form.id ? "Edit Banner" : "Add Banner"}</h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...form, media_type: "image" });
                    setImageFile(null);
                    setImagePreview(form.id ? form.image_url : "");
                  }}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    form.media_type === "image"
                      ? "border-emerald bg-emerald/10 text-emerald"
                      : "border-gray-200 text-gray-500 dark:border-white/10"
                  }`}
                >
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...form, media_type: "video" });
                    setImageFile(null);
                    setImagePreview(form.id ? form.image_url : "");
                  }}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    form.media_type === "video"
                      ? "border-emerald bg-emerald/10 text-emerald"
                      : "border-gray-200 text-gray-500 dark:border-white/10"
                  }`}
                >
                  Video
                </button>
              </div>

              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                {form.media_type === "video"
                  ? "Banner Video (short clips work best — under ~8MB)"
                  : "Banner Image (recommended 1200×500px)"}
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/10">
                    {imagePreview ? (
                      form.media_type === "video" ? (
                        <video src={imagePreview} className="h-full w-full object-cover" muted autoPlay loop />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <Upload className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept={form.media_type === "video" ? "video/*" : "image/*"}
                    onChange={handleFileChange}
                    className="text-xs"
                  />
                </div>
                <span className="text-[11px] font-normal text-gray-400">
                  {form.media_type === "video"
                    ? "Video: MP4, under 20MB (about 8MB loads fastest on mobile)."
                    : `Best size: ${SIZES.hero.w}×${SIZES.hero.h}px. Keep text and faces inside the middle 960×400 area — phones show the centre, desktop crops the top and bottom a little.`}
                </span>
                {sizeHint && <span className="text-[11px] font-medium text-amber-600">Note: {sizeHint}</span>}
              </label>

              <input
                placeholder="Title (optional)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
              />
              <input
                placeholder="Subtitle (optional)"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Button text (optional)"
                  value={form.button_text}
                  onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                />
                <input
                  placeholder="Button link (e.g. #products)"
                  value={form.button_link}
                  onChange={(e) => setForm({ ...form, button_link: e.target.value })}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active (show on home page)
              </label>

              {errorMsg && <p className="text-xs font-medium text-red-500">{errorMsg}</p>}

              <button
                type="submit"
                disabled={saving}
                className="mt-2 rounded-full bg-emerald py-3 text-sm font-bold text-white shadow-premium hover:bg-emerald-dark disabled:opacity-60"
              >
                {saving ? "Saving…" : form.id ? "Update Banner" : "Add Banner"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
