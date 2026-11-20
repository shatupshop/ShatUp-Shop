"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isSoldOut, Product, soldOutLast } from "@/lib/types";
import { useStore } from "@/context/StoreContext";

import "@/styles/premium.css";
import "@/styles/header-fx.css";
import Header from "@/components/Header";
import BackToTop from "@/components/BackToTop";
import SortBar, { SortKey } from "@/components/SortBar";
import PreorderSection from "@/components/PreorderSection";
import ScrollFx from "@/components/ScrollFx";
import BannerCarousel from "@/components/BannerCarousel";
import PromoSlider from "@/components/PromoSlider";
import TrustStrip from "@/components/TrustStrip";
import CategoryBar from "@/components/CategoryBar";
import QuickAccess from "@/components/QuickAccess";
import ScrollSection from "@/components/ScrollSection";
import PromoBanner from "@/components/PromoBanner";
import { TrustHighlights, WhyRimonStore } from "@/components/TrustHighlights";
import PopularCategories from "@/components/PopularCategories";
import CollectionsGrid from "@/components/CollectionsGrid";
import ProductGrid from "@/components/ProductGrid";
import ProductSkeletonGrid from "@/components/ProductSkeletonGrid";
import About from "@/components/About";
import Footer from "@/components/Footer";
import ProductModal from "@/components/ProductModal";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import SignupModal from "@/components/SignupModal";
import ProfileModal from "@/components/ProfileModal";
import EmptyState from "@/components/EmptyState";
import MobileBottomNav from "@/components/MobileBottomNav";
import FadeUp from "@/components/FadeUp";
import RecentlyViewed from "@/components/RecentlyViewed";
import Testimonials from "@/components/Testimonials";
import TrackOrder from "@/components/TrackOrder";
import { CATEGORIES } from "@/lib/types";
import { track } from "@/lib/analytics";

export default function HomeClient() {
  const { t, lang, activeProduct, setActiveProduct } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("new");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setLoadError(
          lang === "bn"
            ? "পণ্য লোড করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।"
            : "Products could not be loaded. Please try again in a moment."
        );
      } else {
        setLoadError("");
        setProducts((data || []) as Product[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  // shared product link (?p=<id>) opens that product straight away
  useEffect(() => {
    if (loading || products.length === 0) return;
    try {
      const id = new URLSearchParams(window.location.search).get("p");
      if (!id) return;
      const found = products.find((p) => p.id === id);
      if (found) setActiveProduct(found);
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, products]);

  // optional analytics: what do customers search for?
  useEffect(() => {
    if (search.trim().length < 3) return;
    const id = setTimeout(() => track("Search"), 800);
    return () => clearTimeout(id);
  }, [search]);

  // pre-order items live ONLY in their own section — never mixed into the normal lists
  const regular = useMemo(() => products.filter((p) => !p.is_preorder), [products]);

  const matchesFilters = (p: Product) => {
    const matchesCategory = category ? p.category === category : true;
    const matchesSearch = search
      ? p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.name_bn || "").includes(search)
      : true;
    return matchesCategory && matchesSearch;
  };

  const filtered = useMemo(() => {
    return regular.filter((p) => matchesFilters(p) && (!inStockOnly || !isSoldOut(p)))
    .sort((a, b) => {
      switch (sort) {
        case "priceAsc":
          return a.price - b.price;
        case "priceDesc":
          return b.price - a.price;
        case "rating":
          return (b.rating ?? 4.5) - (a.rating ?? 4.5);
        case "discount":
          return (b.discount_percent || 0) - (a.discount_percent || 0);
        default:
          return 0; // keep the newest-first order from the database
      }
    })
    // sold-out items always sink to the end (stable sort keeps the chosen order inside each group)
    .sort((a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b)));
  }, [regular, category, search, sort, inStockOnly]);

  const flashSale = useMemo(
    () => soldOutLast(regular.filter((p) => p.is_flash_sale)),
    [regular]
  );
  const newArrivals = useMemo(
    () => soldOutLast(regular.filter((p) => p.is_new_arrival)),
    [regular]
  );
  // the Pre-Order section follows the search / category, open ones first, closed ones last
  const preorders = useMemo(
    () => soldOutLast(products.filter((p) => p.is_preorder && matchesFilters(p))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, category, search]
  );
  const hasOpenPreorder = useMemo(
    () => products.some((p) => p.is_preorder && !isSoldOut(p)),
    [products]
  );

  return (
    <main className="lux-bg relative isolate min-h-screen dark:text-gray-100">
      {/* slow drifting colour orbs = the page feels alive */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 will-change-transform" style={{ transform: "translate3d(0, calc(var(--sy, 0) * -0.09px), 0)" }}>
          <div className="lux-orb lux-orb-a -left-24 top-[12%] h-72 w-72 bg-emerald/20 dark:opacity-40" />
        </div>
        <div className="absolute inset-0 will-change-transform" style={{ transform: "translate3d(0, calc(var(--sy, 0) * -0.17px), 0)" }}>
          <div className="lux-orb lux-orb-b -right-24 top-[46%] h-80 w-80 bg-[#7c3aed]/12 dark:opacity-40" />
        </div>
        <div className="absolute inset-0 will-change-transform" style={{ transform: "translate3d(0, calc(var(--sy, 0) * -0.05px), 0)" }}>
          <div className="lux-orb lux-orb-a bottom-[8%] left-[30%] h-64 w-64 bg-[#FFC400]/15 dark:opacity-40" />
        </div>
      </div>
      <ScrollFx />
      <TrustStrip lang={lang} />
      <Header onSearch={setSearch} searchValue={search} products={products} onSelectProduct={setActiveProduct} />
      <PromoSlider onSelectCategory={setCategory} />
      <BannerCarousel />
      <QuickAccess hasPreorder={hasOpenPreorder} />
      <CategoryBar active={category} onSelect={setCategory} />

      {/* Pre-Order sits right under the category bar, above everything else */}
      {preorders.length > 0 && <PreorderSection products={preorders} lang={lang} />}

      {!search && !category && flashSale.length > 0 && (
        <ScrollSection
          id="flash-sale"
          title={t("flashSale")}
          products={flashSale}
          accent="gold"
          showCountdown
        />
      )}
      {!search && !category && newArrivals.length > 0 && (
        <ScrollSection id="new-arrivals" title={t("newArrivals")} products={newArrivals} />
      )}

      {!search && !category && <RecentlyViewed products={regular} version={activeProduct?.id ?? null} />}

      <PromoBanner />
      <FadeUp>
        <TrustHighlights lang={lang} />
      </FadeUp>

      {!search && !category && <CollectionsGrid />}

      {!search && !category && (
        <PopularCategories onSelect={(c) => setCategory(c)} />
      )}

      <div id="products" className="scroll-mt-16">
        {loading ? (
          <section className="mx-auto max-w-7xl px-4 py-4">
            <ProductSkeletonGrid />
          </section>
        ) : loadError ? (
          <EmptyState
            title={lang === "bn" ? "কিছু একটা সমস্যা হয়েছে" : "Something went wrong"}
            subtitle={loadError}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title={
              lang === "bn"
                ? "এখনো কোনো পণ্য যোগ করা হয়নি"
                : "No products yet"
            }
            subtitle={
              lang === "bn"
                ? "শীঘ্রই নতুন পণ্য যুক্ত হবে — একটু পরে আবার দেখুন।"
                : "New products are on the way — please check back soon."
            }
          />
        ) : regular.length === 0 ? null : (
          <ProductGrid
            title={t("allProducts")}
            products={filtered}
            toolbar={
              <SortBar
                lang={lang}
                sort={sort}
                onSort={setSort}
                inStockOnly={inStockOnly}
                onInStockOnly={setInStockOnly}
              />
            }
            emptyAction={
              <div className="flex flex-col items-center gap-3">
                {(search || category) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setCategory(null);
                    }}
                    className="btn-brand rounded-full px-5 py-2 text-xs font-bold text-white"
                  >
                    {lang === "bn" ? "ফিল্টার মুছুন" : "Clear filters"}
                  </button>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  {CATEGORIES.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setSearch("");
                        setCategory(c);
                      }}
                      className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold text-gray-600 transition active:scale-95 dark:border-white/15 dark:text-gray-300"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            }
            emptyTitle={lang === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}
            emptySubtitle={
              lang === "bn"
                ? "অন্য কিছু খুঁজে দেখুন বা ফিল্টার পরিবর্তন করুন।"
                : "Try a different search or category."
            }
          />
        )}
      </div>

      {!search && !category && <Testimonials />}

      <FadeUp>
        <WhyRimonStore lang={lang} />
      </FadeUp>
      <FadeUp>
        <TrackOrder />
      </FadeUp>
      <FadeUp>
        <About />
      </FadeUp>
      <Footer />

      {/* overlays */}
      <ProductModal allProducts={products} />
      <CartDrawer />
      <WishlistDrawer />
      <SignupModal />
      <ProfileModal />

      {/* app-style bottom navigation (mobile only) */}
      <MobileBottomNav />
      <BackToTop />
    </main>
  );
}
