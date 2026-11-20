"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CATEGORIES, isSoldOut, Product, ProductMedia } from "@/lib/types";
import { compressImage } from "@/lib/image";
import { resolveMime, storageExt } from "@/lib/media";
import ProductMediaEditor, { MAX_IMAGES, MAX_VIDEOS, MediaItem } from "@/components/admin/ProductMediaEditor";
import { Edit, Grid, ImageIcon, LogOut, Plus, ShoppingBag, Tag, Trash, X } from "@/components/icons";
import Logo from "@/components/Logo";
import Ico from "@/components/Ico";
import BannerManager from "@/components/admin/BannerManager";
import CollectionManager from "@/components/admin/CollectionManager";
import CouponManager from "@/components/admin/CouponManager";
import PromoBannerManager from "@/components/admin/PromoBannerManager";
import OrdersManager from "@/components/admin/OrdersManager";
import SalesReport from "@/components/admin/SalesReport";
import ReviewsManager from "@/components/admin/ReviewsManager";
import CountUp from "@/components/CountUp";

const emptyForm = {
  id: "",
  name: "",
  name_bn: "",
  description: "",
  category: CATEGORIES[0] as string,
  price: "",
  original_price: "",
  discount_percent: "",
  stock: "",
  rating: "4.5",
  image_url: "",
  is_flash_sale: false,
  is_new_arrival: false,
  is_sold_out: false,
  is_preorder: false,
  preorder_eta: "",
  flash_total: ""
};

// discount % always comes from the two prices: (original - price) / original * 100.
// Returns "" when there is no real discount to show (no original price, or the
// original price is not higher than the selling price); `fallback` keeps a
// manually typed % in that case, e.g. a discount with no original price.
function discountFromPrices(priceStr: string, originalStr: string, fallback: string): string {
  const price = Number(priceStr);
  const original = Number(originalStr);
  if (!originalStr || !Number.isFinite(original) || original <= 0) return fallback;
  if (!Number.isFinite(price) || price < 0 || original <= price) return "";
  return String(Math.min(100, Math.max(0, Math.round(((original - price) / original) * 100))));
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center dark:bg-gray-950">
        <div className="max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-card dark:border-white/10 dark:bg-white/5">
          <h1 className="text-lg font-bold text-emerald">Supabase not configured</h1>
          <p className="mt-2 text-sm text-gray-500">
            Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your <code>.env.local</code>{" "}
            file (see <code>.env.local.example</code>), run <code>supabase/schema.sql</code>{" "}
            in your Supabase project, then restart the app to use the admin panel.
          </p>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return session ? <Dashboard /> : <LoginForm />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-8 shadow-premium dark:border-white/10 dark:bg-white/5"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={48} showWordmark={false} />
          <h1 className="mt-3 text-lg font-bold">ShatUp Shop Admin</h1>
          <p className="text-xs text-gray-400">Sign in to manage products</p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
          />
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-full bg-emerald py-3 text-sm font-bold text-white shadow-premium hover:bg-emerald-dark disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [mediaLoading, setMediaLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  // stock as loaded into the form: if the admin did not change it we do not write it back,
  // otherwise a stale form would overwrite stock deducted by customer orders in the meantime
  const loadedStock = useRef<number | null>(null);
  const [tab, setTab] = useState<"products" | "banners" | "promo" | "collections" | "coupons" | "orders" | "report" | "reviews">("products");

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setProducts(data as Product[]);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const shownProducts = products.filter((p) => {
    const q = adminSearch.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.name_bn || "").includes(adminSearch.trim()) || p.category.toLowerCase().includes(q);
  });

  function openNewForm() {
    setMediaLoading(false);
    setForm(emptyForm);
    setMedia([]);
    setErrorMsg("");
    setUploadStatus("");
    loadedStock.current = null;
    setShowForm(true);
  }

  function openEditForm(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      name_bn: p.name_bn || "",
      description: p.description || "",
      category: p.category,
      price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : "",
      discount_percent:
        p.original_price && p.original_price > p.price
          ? String(Math.round(((p.original_price - p.price) / p.original_price) * 100))
          : p.discount_percent
            ? String(p.discount_percent)
            : "",
      stock: String(p.stock),
      rating: p.rating ? String(p.rating) : "4.5",
      image_url: p.image_url || "",
      is_flash_sale: Boolean(p.is_flash_sale),
      is_new_arrival: Boolean(p.is_new_arrival),
      is_sold_out: Boolean(p.is_sold_out),
      is_preorder: Boolean(p.is_preorder),
      preorder_eta: p.preorder_eta || "",
      flash_total: p.flash_total ? String(p.flash_total) : ""
    });
    loadedStock.current = p.stock;
    setUploadStatus("");
    // start from the cover image, then replace with the full gallery once loaded
    setMedia(
      p.image_url ? [{ key: "cover", url: p.image_url, type: "image" }] : []
    );
    setErrorMsg("");
    setShowForm(true);
    // Save stays disabled until the full gallery is loaded; saving early would replace the
    // gallery with just the cover photo and delete the other photos/videos.
    setMediaLoading(true);
    supabase
      .from("product_media")
      .select("*")
      .eq("product_id", p.id)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setErrorMsg("Could not load this product's photos/videos. Close and open it again.");
          return;
        }
        if (data && data.length > 0) {
          setMedia(
            (data as ProductMedia[]).map((m) => ({ key: m.id, url: m.url, type: m.media_type }))
          );
        }
        setMediaLoading(false);
      });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const price = Number(form.price);
    const originalPrice = form.original_price ? Number(form.original_price) : null;
    // the saved % always matches the two prices (a manually typed % only
    // survives when there is no original price to derive it from)
    const discount =
      originalPrice !== null && originalPrice > 0
        ? originalPrice > price
          ? Math.min(100, Math.max(0, Math.round(((originalPrice - price) / originalPrice) * 100)))
          : 0
        : form.discount_percent
          ? Number(form.discount_percent)
          : 0;
    // pre-order items may have no stock yet — an empty box means 0
    const stock = form.stock === "" && form.is_preorder ? 0 : Number(form.stock);
    const rating = form.rating ? Number(form.rating) : 4.5;

    if (!Number.isFinite(price) || price <= 0) {
      setErrorMsg("Price must be greater than 0.");
      setSaving(false);
      return;
    }
    if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice <= 0)) {
      setErrorMsg("Original price must be greater than 0.");
      setSaving(false);
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setErrorMsg("Stock must be 0 or a positive whole number.");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      setErrorMsg("Discount must be between 0 and 100%.");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      setErrorMsg("Rating must be between 0 and 5.");
      setSaving(false);
      return;
    }

    const imageCount = media.filter((m) => m.type === "image").length;
    const videoCount = media.filter((m) => m.type === "video").length;
    if (imageCount > MAX_IMAGES || videoCount > MAX_VIDEOS) {
      setErrorMsg(`A product can have at most ${MAX_IMAGES} photos and ${MAX_VIDEOS} videos. Remove the extra files and save again.`);
      setSaving(false);
      return;
    }

    try {
      // upload any newly-picked files (images are shrunk first), keep the admin's order
      const finalMedia: { url: string; media_type: "image" | "video" }[] = [];
      const totalNew = media.filter((m) => m.file).length;
      let doneNew = 0;
      for (const m of media) {
        if (!m.file) {
          finalMedia.push({ url: m.url, media_type: m.type });
          continue;
        }
        doneNew++;
        setUploadStatus(`Uploading file ${doneNew} of ${totalNew}…`);
        const file = m.type === "image" ? await compressImage(m.file, 1280, 0.85) : m.file;
        // extension + content type come from the real mime type (phones sometimes send none)
        const ext = storageExt(file);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-media")
          .upload(fileName, file, {
            cacheControl: "31536000",
            contentType: resolveMime(file) || undefined
          });
        if (uploadError) {
          throw new Error(`Upload failed for "${m.file.name}": ${uploadError.message}`);
        }
        const { data: publicUrlData } = supabase.storage.from("product-media").getPublicUrl(fileName);
        finalMedia.push({ url: publicUrlData.publicUrl, media_type: m.type });
      }
      // keep the uploaded URLs in the form, so a retry after a later failure does not upload everything again
      if (totalNew > 0) {
        setMedia(
          finalMedia.map((m, i) => ({ key: `up-${Date.now()}-${i}`, url: m.url, type: m.media_type }))
        );
      }
      // first photo = cover (cards, cart, WhatsApp flow keep using image_url)
      const imageUrl = finalMedia.find((m) => m.media_type === "image")?.url || "";

      const payload = {
        name: form.name,
        name_bn: form.name_bn || null,
        description: form.description || null,
        category: form.category,
        price,
        original_price: originalPrice,
        discount_percent: discount,
        // existing product: only send stock if the admin actually changed it (see loadedStock)
        ...(form.id && loadedStock.current === stock ? {} : { stock }),
        rating,
        image_url: imageUrl || null,
        is_flash_sale: form.is_flash_sale,
        is_new_arrival: form.is_new_arrival,
        is_sold_out: form.is_sold_out,
        is_preorder: form.is_preorder,
        preorder_eta: form.is_preorder ? form.preorder_eta.trim() || null : null,
        // only sent when filled in, so saving still works before growth_features.sql has been run
        ...(form.is_flash_sale && Number.isInteger(Number(form.flash_total)) && Number(form.flash_total) > 0
          ? { flash_total: Number(form.flash_total) }
          : {})
      };

      let productId = form.id;
      if (productId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id as string;
        // remember the new id right away: if the gallery step below fails, pressing Save again
        // must UPDATE this product instead of inserting a duplicate
        loadedStock.current = stock;
        setForm((f) => ({ ...f, id: productId }));
      }

      // save the gallery in ONE database transaction (also enforces 3 photos + 3 videos server-side)
      setUploadStatus("Saving gallery…");
      const { error: mediaErr } = await supabase.rpc("replace_product_media", {
        p_product_id: productId,
        p_media: finalMedia
      });
      if (mediaErr) {
        throw new Error(
          /could not find the function|schema cache/i.test(mediaErr.message)
            ? "Gallery could not be saved: run supabase/order_system_v2.sql in Supabase first."
            : mediaErr.message
        );
      }

      setShowForm(false);
      await loadProducts();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
      setUploadStatus("");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) loadProducts();
  }

  async function toggleSoldOut(p: Product) {
    const { error } = await supabase
      .from("products")
      .update({ is_sold_out: !p.is_sold_out })
      .eq("id", p.id);
    if (!error) loadProducts();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-950">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Logo size={38} showWordmark={false} />
            <div className="leading-tight">
              <p className="font-bold">ShatUp — Admin</p>
              <p className="text-[11px] font-medium text-gray-400">Manage your store</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-red-400 hover:text-red-500 dark:border-white/10 dark:text-gray-300"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
        <div className="h-[3px] w-full bg-gradient-to-r from-emerald via-black to-emerald-light" />
      </header>

      {/* tab switcher */}
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <div className="no-scrollbar flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-gray-200 bg-white p-1 shadow-card dark:border-white/10 dark:bg-white/5">
          {([
            ["products", "Products", <ShoppingBag key="i" className="h-4 w-4" />],
            ["orders", "Orders", <Ico key="i" name="receipt" className="h-4 w-4" />],
            ["report", "Sales", <Ico key="i" name="cash" className="h-4 w-4" />],
            ["reviews", "Reviews", <Ico key="i" name="heart" className="h-4 w-4" />],
            ["banners", "Banners", <ImageIcon key="i" className="h-4 w-4" />],
            ["promo", "Promo Strip", <Ico key="i" name="megaphone" className="h-4 w-4" />],
            ["collections", "Collections", <Grid key="i" className="h-4 w-4" />],
            ["coupons", "Coupons", <Tag key="i" className="h-4 w-4" />]
          ] as [typeof tab, string, React.ReactNode][]).map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                tab === key ? "bg-emerald text-white shadow-premium" : "text-gray-500 hover:text-emerald"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "banners" ? (
        <div className="mx-auto max-w-5xl px-4 py-6">
          <BannerManager />
        </div>
      ) : tab === "promo" ? (
        <div className="mx-auto max-w-5xl px-4 py-6">
          <PromoBannerManager />
        </div>
      ) : tab === "collections" ? (
        <div className="mx-auto max-w-5xl px-4 py-6">
          <CollectionManager />
        </div>
      ) : tab === "orders" ? (
        <OrdersManager />
      ) : tab === "report" ? (
        <SalesReport />
      ) : tab === "reviews" ? (
        <ReviewsManager />
      ) : tab === "coupons" ? (
        <div className="mx-auto max-w-5xl px-4 py-6">
          <CouponManager />
        </div>
      ) : (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Total products", products.length, "text-[#17120E] dark:text-white"],
            ["Low stock (≤5)", products.filter((p) => p.stock > 0 && p.stock <= 5 && !isSoldOut(p)).length, "text-amber-600"],
            ["Sold out", products.filter((p) => isSoldOut(p)).length, "text-red-500"],
            ["Pre-order", products.filter((p) => p.is_preorder).length, "text-emerald"]
          ].map(([label, value, color]) => (
            <div key={label as string} className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-card dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
              <p className={`mt-1 text-2xl font-black ${color}`}><CountUp value={Number(value)} /></p>
            </div>
          ))}
        </div>
        <input
          value={adminSearch}
          onChange={(e) => setAdminSearch(e.target.value)}
          placeholder="Search your products…"
          className="mb-4 w-full rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
        />
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">Products ({shownProducts.length})</h1>
          <button
            onClick={openNewForm}
            className="flex items-center gap-1 rounded-full bg-emerald px-4 py-2 text-sm font-semibold text-white shadow-premium hover:bg-emerald-dark"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            No products yet — click &quot;Add Product&quot; to create your first one.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shownProducts.map((p) => (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card dark:border-white/10 dark:bg-white/5"
              >
                <div className="relative h-36 w-full bg-gray-100 dark:bg-white/10">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      No Image
                    </div>
                  )}
                  {isSoldOut(p) && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-extrabold uppercase tracking-wide text-white">
                      Sold Out
                    </span>
                  )}
                  <div className="absolute left-2 top-2 flex gap-1">
                    {p.is_flash_sale && (
                      <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">
                        FLASH
                      </span>
                    )}
                    {p.is_new_arrival && (
                      <span className="rounded-full bg-emerald px-2 py-0.5 text-[10px] font-bold text-white">
                        NEW
                      </span>
                    )}
                    {p.is_preorder && (
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-black">
                        PRE-ORDER
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <span className="text-[11px] font-medium text-emerald">
                    {p.category}
                  </span>
                  <h3 className="line-clamp-2 text-sm font-semibold">{p.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold">৳{p.price}</span>
                    {p.original_price && (
                      <span className="text-xs text-gray-400 line-through">
                        ৳{p.original_price}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    Stock: {p.stock}
                    {p.stock > 0 && p.stock <= 5 && (
                      <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">Low</span>
                    )}
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openEditForm(p)}
                      className="flex items-center justify-center gap-1 rounded-full border border-emerald px-2 py-1.5 text-xs font-semibold text-emerald hover:bg-emerald hover:text-white"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="flex items-center justify-center gap-1 rounded-full border border-red-300 px-2 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <Trash className="h-3.5 w-3.5" /> Delete
                    </button>
                    <button
                      onClick={() => toggleSoldOut(p)}
                      className={`col-span-2 rounded-full px-2 py-1.5 text-xs font-bold ${
                        p.is_sold_out
                          ? "bg-emerald text-white hover:bg-emerald-dark"
                          : "border border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500 dark:border-white/20 dark:text-gray-300"
                      }`}
                    >
                      {p.is_sold_out ? "Back in stock" : "Mark Sold Out"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                {form.id ? "Edit Product" : "Add Product"}
              </h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <ProductMediaEditor items={media} onChange={setMedia} onError={setErrorMsg} />

              <input
                required
                placeholder="Product Name (English)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
              />
              <input
                placeholder="Product Name (বাংলা) — optional"
                value={form.name_bn}
                onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
              />
              <textarea
                placeholder="Description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
              />

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Price (৳)"
                  value={form.price}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({
                      ...f,
                      price: v,
                      discount_percent: discountFromPrices(v, f.original_price, f.discount_percent)
                    }));
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Original Price (৳)"
                  value={form.original_price}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({
                      ...f,
                      original_price: v,
                      discount_percent: discountFromPrices(f.price, v, f.discount_percent)
                    }));
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Discount % (auto)"
                  value={form.discount_percent}
                  onChange={(e) =>
                    setForm({ ...form, discount_percent: e.target.value })
                  }
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                />
                <input
                  required={!form.is_preorder}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                />
                <input
                  type="number"
                  step="0.1"
                  max={5}
                  placeholder="Rating"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_flash_sale}
                    onChange={(e) =>
                      setForm({ ...form, is_flash_sale: e.target.checked })
                    }
                  />
                  Flash Sale
                </label>
                {form.is_flash_sale && (
                  <input
                    type="number"
                    min={1}
                    value={form.flash_total}
                    onChange={(e) => setForm({ ...form, flash_total: e.target.value })}
                    placeholder="Total qty on sale (for % sold bar)"
                    className="w-56 rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                  />
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_new_arrival}
                    onChange={(e) =>
                      setForm({ ...form, is_new_arrival: e.target.checked })
                    }
                  />
                  New Arrival
                </label>
              </div>
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                <label className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                  <input
                    type="checkbox"
                    checked={form.is_preorder}
                    onChange={(e) => setForm({ ...form, is_preorder: e.target.checked })}
                  />
                  Pre-Order product (customers order now, you deliver later)
                </label>
                {form.is_preorder && (
                  <input
                    placeholder="Expected delivery, e.g. 7-10 days (optional)"
                    value={form.preorder_eta}
                    onChange={(e) => setForm({ ...form, preorder_eta: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald dark:border-white/10 dark:bg-white/5"
                  />
                )}
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10">
                <input
                  type="checkbox"
                  checked={form.is_sold_out}
                  onChange={(e) => setForm({ ...form, is_sold_out: e.target.checked })}
                />
                Mark as Sold Out (hidden Buy / Add to Cart)
              </label>

              {uploadStatus && (
                <p role="status" className="text-xs font-medium text-gray-500">{uploadStatus}</p>
              )}
              {errorMsg && (
                <p role="alert" className="text-xs font-medium text-red-500">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={saving || mediaLoading}
                className="mt-2 rounded-full bg-emerald py-3 text-sm font-bold text-white shadow-premium hover:bg-emerald-dark disabled:opacity-60"
              >
                {saving ? "Saving…" : mediaLoading ? "Loading photos…" : form.id ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
