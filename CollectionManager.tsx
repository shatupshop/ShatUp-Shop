"use client";

import { compressImage } from "@/lib/image";
import { imageSizeWarning, SIZES } from "@/lib/imageHints";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Collection } from "@/lib/types";
import { ChevronDown, ChevronUp, Edit, Plus, Trash, Upload, X } from "@/components/icons";

const emptyForm = {
  id: "",
  title: "",
  button_link: "",
  image_url: "",
  is_active: true,
  sort_order: "0"
};

export default function CollectionManager() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sizeHint, setSizeHint] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function loadCollections() {
    setLoading(true);
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setCollections(data as Collection[]);
    setLoading(false);
  }

  useEffect(() => {
    loadCollections();
  }, []);

  function openNewForm() {
    setForm({ ...emptyForm, sort_order: String(collections.length) });
    setImageFile(null);
    setImagePreview("");
    setErrorMsg("");
    setShowForm(true);
  }

  function openEditForm(c: Collection) {
    setForm({
      id: c.id,
      title: c.title,
      button_link: c.button_link || "",
      image_url: c.image_url,
      is_active: c.is_active,
      sort_order: String(c.sort_order ?? 0)
    });
    setImageFile(null);
    setImagePreview(c.image_url);
    setErrorMsg("");
    setShowForm(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setSizeHint(await imageSizeWarning(file, SIZES.collection));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      let imageUrl = form.image_url;

      if (imageFile) {
        const uploadFile = await compressImage(imageFile, 900, 0.85);
        const ext = uploadFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("collection-images")
          .upload(fileName, uploadFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("collection-images")
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }

      if (!imageUrl) {
        throw new Error("Please upload an image for this collection card.");
      }
      if (!form.title.trim()) {
        throw new Error("Please give this collection a title.");
      }

      const payload = {
        title: form.title,
        button_link: form.button_link || null,
        image_url: imageUrl,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0
      };

      if (form.id) {
        const { error } = await supabase
          .from("collections")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("collections").insert(payload);
        if (error) throw error;
      }

      setShowForm(false);
      await loadCollections();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this collection card?")) return;
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (!error) loadCollections();
  }

  async function toggleActive(c: Collection) {
    const { error } = await supabase
      .from("collections")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    if (!error) loadCollections();
  }

  async function move(c: Collection, direction: -1 | 1) {
    const idx = collections.findIndex((x) => x.id === c.id);
    const swapWith = collections[idx + direction];
    if (!swapWith) return;
    await supabase
      .from("collections")
      .update({ sort_order: swapWith.sort_order })
      .eq("id", c.id);
    await supabase
      .from("collections")
      .update({ sort_order: c.sort_order })
      .eq("id", swapWith.id);
    loadCollections();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Collection Cards ({collections.length})</h2>
        <button
          onClick={openNewForm}
          className="flex items-center gap-1 rounded-full bg-emerald px-4 py-2 text-sm font-semibold text-white shadow-premium hover:bg-emerald-dark"
        >
          <Plus className="h-4 w-4" /> Add Collection
        </button>
      </div>

      <p className="mb-4 text-xs text-gray-400">
        These appear as a small 3-card promo grid on the home page (e.g. &quot;Home &amp;
        Lifestyle&quot;, &quot;Hot Deals&quot;). Square images work best. The grid is hidden
        automatically when there are none.
      </p>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
      ) : collections.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">
          No collection cards yet — this section stays hidden on the home page until you add
          one.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {collections.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-card dark:border-white/10 dark:bg-white/5"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="line-clamp-1 text-sm font-semibold">{c.title}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    c.is_active ? "bg-emerald/10 text-emerald" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {c.is_active ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => move(c, -1)}
                    disabled={i === 0}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 px-2 py-1 disabled:opacity-30 dark:border-white/10"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move(c, 1)}
                    disabled={i === collections.length - 1}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 px-2 py-1 disabled:opacity-30 dark:border-white/10"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
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
              <h2 className="text-lg font-bold">
                {form.id ? "Edit Collection" : "Add Collection"}
              </h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
                Card Image (square, e.g. 600×600px)
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/10">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <Upload className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs" />
                </div>
                <span className="text-[11px] font-normal text-gray-400">
                  Best size: {SIZES.collection.w}×{SIZES.collection.h}px (square). The collection name sits on the bottom third.
                </span>
                {sizeHint && <span className="text-[11px] font-medium text-amber-600">Note: {sizeHint}</span>}
              </label>

              <input
                required
                placeholder="Title (e.g. Hot Deals)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
              />
              <input
                placeholder="Link when tapped (optional, e.g. #products)"
                value={form.button_link}
                onChange={(e) => setForm({ ...form, button_link: e.target.value })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
              />

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
                {saving ? "Saving…" : form.id ? "Update Collection" : "Add Collection"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
