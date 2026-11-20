"use client";

import { useStore } from "@/context/StoreContext";
import { Heart, Moon, Search, ShoppingCart, Sun, User, X } from "./icons";
import Ico from "./Ico";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDialog } from "@/lib/useDialog";
import { useBump } from "@/lib/useBump";
import LivePill from "./LivePill";
import SeasonPicker from "./SeasonPicker";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isPromoLive, Product, PromoSlide } from "@/lib/types";

// name of the campaign that is live right now (from the admin's Promo Strip), if any
function useLivePromoTitle() {
  const [title, setTitle] = useState<string | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from("promo_banners")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const live = (data as PromoSlide[] | null)?.find((b) => isPromoLive(b) && b.title);
        if (live?.title) setTitle(live.title);
      });
  }, []);
  return title;
}

export default function Header({
  onSearch,
  searchValue,
  products,
  onSelectProduct
}: {
  onSearch: (v: string) => void;
  searchValue: string;
  products: Product[];
  onSelectProduct: (p: Product) => void;
}) {
  const {
    t,
    lang,
    setLang,
    theme,
    toggleTheme,
    cartCount,
    wishlist,
    setCartOpen,
    setWishlistOpen,
    setProfileOpen,
    isProfileComplete,
    setSignupOpen
  } = useStore();

  const [scrolled, setScrolled] = useState(false); // page is no longer at the very top
  const [compact, setCompact] = useState(false); // scrolled far enough to show the header sticker
  const [logoOpen, setLogoOpen] = useState(true); // mobile logo row visible (hides on scroll down, returns on scroll up)
  const [menuOpen, setMenuOpen] = useState(false); // mobile navigation drawer
  const [suggestOpen, setSuggestOpen] = useState(false); // live search suggestions
  const [suggestFocus, setSuggestFocus] = useState(false);
  const cartBump = useBump(cartCount);
  useDialog(menuOpen, () => setMenuOpen(false));

  // live search suggestions: name / Bangla name / category, top 6
  const suggestions = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter((p) => `${p.name} ${p.name_bn ?? ""} ${p.category}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [products, searchValue]);
  const showSuggestions = suggestOpen && suggestFocus && searchValue.trim().length >= 2;
  // scrolling away dismisses the suggestions
  useEffect(() => {
    if (!showSuggestions) return;
    const close = () => setSuggestOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [showSuggestions]);
  function selectSuggestion(p: Product) {
    setSuggestOpen(false);
    onSearch("");
    onSelectProduct(p);
  }
  const searchInputProps = {
    onFocus: () => {
      setSuggestFocus(true);
      setSuggestOpen(true);
    },
    onBlur: () => setTimeout(() => setSuggestFocus(false), 150),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") setSuggestOpen(false);
    }
  };
  const barRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // publish the live header height so the sticky category bar sits right under it
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${Math.round(el.getBoundingClientRect().height)}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const promoTitle = useLivePromoTitle();

  // scroll behaviour (AppleGadgets-style): on phones the logo row slides away
  // while scrolling down so only the white search pill stays pinned at the top;
  // a real scroll-up brings the logo row back. Sticker pops in after a little
  // scrolling, thin progress line tracks the page.
  useEffect(() => {
    let lastY = window.scrollY;
    let acc = 0; // distance travelled in the current direction
    let raf = 0;
    function update() {
      raf = 0;
      const y = window.scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (barRef.current) barRef.current.style.transform = `scaleX(${Math.min(1, y / max)})`;
      setScrolled(y > 8);
      setCompact(y > 140);
      const dy = y - lastY;
      lastY = y;
      acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
      if (y <= 80) setLogoOpen(true);
      else if (acc > 14) setLogoOpen(false);
      else if (acc < -48) setLogoOpen(true); // needs a real scroll-up, not a layout wobble
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const nav = [
    { href: "#products", label: lang === "bn" ? "সব পণ্য" : "Shop" },
    { href: "#flash-sale", label: lang === "bn" ? "ফ্ল্যাশ সেল" : "Flash Sale" },
    { href: "#new-arrivals", label: lang === "bn" ? "নতুন পণ্য" : "New In" },
    { href: "#track-order", label: lang === "bn" ? "অর্ডার ট্র্যাক" : "Track Order" },
    { href: "#about", label: lang === "bn" ? "আমাদের কথা" : "About" }
  ];

  function goDeals(e: React.MouseEvent) {
    e.preventDefault();
    const el = document.getElementById("flash-sale") || document.getElementById("products");
    el?.scrollIntoView({ behavior: "smooth" });
  }

  const iconBtn =
    "hx-icon relative flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10 active:scale-95 sm:h-10 sm:w-10";

  // campaign badge: live promo title from the admin, otherwise the house campaign
  const campaignLabel = promoTitle ?? (lang === "bn" ? "মেগা সেল" : "MEGA SALE");

  return (
    <>
    <header
      ref={headerRef}
      data-scrolled={scrolled}
      className={`hx-header sticky top-0 z-40 border-b bg-black text-white transition-all duration-300 ${
        scrolled
          ? "border-white/10 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)]"
          : "border-transparent"
      }`}
    >
      {/* logo row — on phones it collapses on scroll down (search stays pinned) */}
      <div
        className={`hx-logo-row grid transition-[grid-template-rows,opacity] duration-300 ease-out md:block ${
          logoOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 md:opacity-100"
        }`}
        aria-hidden={!logoOpen}
      >
      <div className="overflow-hidden">
      <div className="hx-bar mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-5">
        {/* mobile / tablet menu button */}
        <button
          aria-label={menuOpen ? "close menu" : "open menu"}
          aria-expanded={menuOpen}
          aria-controls="hx-drawer"
          onClick={() => setMenuOpen((v) => !v)}
          className={`${iconBtn} hx-burger-btn -ml-2 shrink-0 lg:hidden`}
        >
          <span className="hx-burger" data-open={menuOpen}>
            <i /><i /><i />
          </span>
        </button>

        {/* Logo */}
        <a href="#top" aria-label="ShatUp Shop" className="hx-logo flex shrink-0 flex-col leading-none transition-transform active:scale-95">
          <span className="hx-logo-wrap flex items-baseline gap-1.5">
            <span className="text-[23px] font-black tracking-tight text-white sm:text-[26px]">
              Shat<span className="text-gradient-brand">Up</span>
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-[0.22em] text-gray-400 ${
                compact ? "max-sm:hidden" : ""
              }`}
            >
              Shop
            </span>
          </span>
          <span className="mt-1 hidden text-[10px] font-medium tracking-wide text-gray-400 sm:block">
            {t("tagline")}
          </span>
        </a>

        {/* animated campaign badge: always in the logo row on phones (like the
            video's 11.11 badge), pops in after scrolling on desktop */}
        <span className={`relative min-w-0 ${compact ? "lux-pop inline-flex" : "inline-flex lg:hidden"}`}>
          <a
            href="#flash-sale"
            onClick={goDeals}
            aria-label="live deals"
            className="sticker pill-gradient sheen relative flex min-w-0 items-center gap-1.5 rounded-full border-2 border-white/90 py-1 pl-1.5 pr-3 text-[11px] font-extrabold text-white shadow-lg dark:border-white/30"
          >
            {/* phones: just the pulsing dot, so the campaign name gets the room */}
            <span className="inline-flex sm:hidden">
              <LivePill label="" className="!gap-0 !px-1.5 !py-1.5" />
            </span>
            <span className="hidden sm:inline-flex">
              <LivePill label={lang === "bn" ? "লাইভ" : "LIVE"} className="!px-1.5 !py-px" />
            </span>
            <span className="max-w-[118px] truncate sm:max-w-[160px]">
              {campaignLabel}
            </span>
          </a>
          <span className="sticker-spark -right-1 -top-1.5" aria-hidden><Ico name="sparkle" className="h-2.5 w-2.5" /></span>
          <span className="sticker-spark -left-1.5 -bottom-1" style={{ animationDelay: "1.1s" }} aria-hidden><Ico name="sparkle" className="h-2.5 w-2.5" /></span>
        </span>

        {/* desktop nav */}
        <nav className="hx-nav ml-1 hidden items-center gap-1 lg:flex" aria-label="Main">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="hx-nav-link rounded-full px-3.5 py-2 text-[13px] font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Search - desktop: white pill with orange search button */}
        <div className="hx-search relative mx-2 hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            {...searchInputProps}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full bg-white py-2.5 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-4 focus:ring-[#FF6A1A]/30"
          />
          <button
            aria-label="search"
            onClick={() => inputRef.current?.focus()}
            className="btn-brand absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <div className="hx-stagger ml-auto flex items-center gap-0.5 sm:gap-1.5">
          {/* language switch (phones: lives in the menu drawer) */}
          <button
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className={`max-sm:hidden rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-bold text-gray-200 transition hover:border-[#FF6A1A] hover:text-white sm:px-3`}
          >
            {lang === "en" ? "বাংলা" : "EN"}
          </button>

          {/* theme toggle (tucked away on phones) */}
          <button
            aria-label="toggle theme"
            onClick={toggleTheme}
            className={`${iconBtn} max-sm:hidden`}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          {/* wishlist (phones: use the Quick Access row on the home page) */}
          <button aria-label="wishlist" onClick={() => setWishlistOpen(true)} className={`${iconBtn} max-sm:hidden`}>
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black ring-2 ring-black">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* cart */}
          <button aria-label="cart" data-cart-target="header" onClick={() => setCartOpen(true)} className={iconBtn}>
            <span className={`inline-flex rounded-full ${cartBump ? "hx-bump" : ""}`}>
              <ShoppingCart className="h-5 w-5" />
            </span>
            {cartCount > 0 && (
              <span
                key={cartCount}
                className={`btn-brand absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-black ${cartBump ? "hx-badge-bump" : ""}`}
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* profile / signup (phones: signup lives in the menu drawer) */}
          {isProfileComplete ? (
            <button
              aria-label="profile"
              onClick={() => setProfileOpen(true)}
              className={`${iconBtn} max-sm:hidden`}
            >
              <User className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => setSignupOpen(true)}
              className="btn-brand hx-glow ml-1 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white max-sm:hidden"
            >
              {t("signup")}
            </button>
          )}
        </div>
      </div>
      </div>
      </div>

      {/* phone search row — white pill, always visible: it is the pinned row
          once the logo row slides away on scroll */}
      <div className="hx-row hx-search-m grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-300 ease-out md:hidden">
        <div className="overflow-hidden">
          <div className="px-4 pb-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                {...searchInputProps}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-full bg-white py-2.5 pl-11 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-4 focus:ring-[#FF6A1A]/30"
              />
              {searchValue && (
                <button
                  aria-label="clear search"
                  onClick={() => onSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* page scroll progress */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
        <span
          ref={barRef}
          className="block h-full w-full origin-left bg-gradient-to-r from-[#7c3aed] via-emerald to-[#FFC400]"
          style={{ transform: "scaleX(0)" }}
        />
      </span>
    </header>

    {/* live search suggestions: fixed under the header (the header rows clip
        overflow, so an absolute dropdown inside them would be cut off) */}
    {showSuggestions && (
      <div
        className="fixed inset-x-3 z-50 md:left-1/2 md:right-auto md:w-[560px] md:-translate-x-1/2"
        style={{ top: "calc(var(--header-h, 110px) + 6px)" }}
      >
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-gray-900 dark:ring-white/15">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(p);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-black/[0.04] dark:hover:bg-white/5"
                >
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="h-11 w-11 shrink-0 rounded-xl bg-black/[0.05] dark:bg-white/10" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[#17120E] dark:text-white">
                      {lang === "bn" && p.name_bn ? p.name_bn : p.name}
                    </span>
                    <span className="block text-xs text-gray-500">{p.category}</span>
                  </span>
                  <span className="shrink-0 text-sm font-black text-emerald">
                    ৳{p.price.toLocaleString("en-BD")}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSuggestOpen(false);
                  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full border-t border-black/[0.06] px-4 py-2.5 text-center text-xs font-bold text-emerald dark:border-white/10"
              >
                {lang === "bn" ? "সব ফলাফল দেখুন" : "See all results"}
              </button>
            </>
          ) : (
            <p className="px-4 py-3.5 text-center text-sm text-gray-500">
              {lang === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}
            </p>
          )}
        </div>
      </div>
    )}

    {/* mobile navigation drawer (kept outside <header> so its backdrop-filter can't trap position:fixed) */}
    <div className="hx-overlay lg:hidden" data-open={menuOpen} onClick={() => setMenuOpen(false)} aria-hidden />
    <aside
      id="hx-drawer"
      className="hx-drawer lg:hidden"
      data-open={menuOpen}
      aria-hidden={!menuOpen}
      aria-label="Menu"
    >
      <div className="hx-drawer-item flex items-center justify-between border-b border-black/[0.06] px-5 py-4 dark:border-white/10" style={{ "--i": 0 } as React.CSSProperties}>
        <span className="text-[22px] font-black tracking-tight text-[#17120E] dark:text-white">
          Shat<span className="text-gradient-brand">Up</span>{" "}
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-gray-500">Shop</span>
        </span>
        <button aria-label="close menu" onClick={() => setMenuOpen(false)} className="hx-icon relative flex h-9 w-9 items-center justify-center rounded-full text-[#17120E] transition hover:bg-black/[0.05] active:scale-95 dark:text-white dark:hover:bg-white/10 sm:h-10 sm:w-10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Mobile">
        {nav.map((n, i) => (
          <a
            key={n.href}
            href={n.href}
            onClick={() => setMenuOpen(false)}
            style={{ "--i": i + 1 } as React.CSSProperties}
            className="hx-drawer-item hx-drawer-link flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] font-bold text-[#17120E] transition active:bg-emerald/10 dark:text-white"
          >
            {n.label}
            <span className="text-emerald" aria-hidden><Ico name="arrowRight" className="h-4 w-4" /></span>
          </a>
        ))}
      </nav>

      <div className="hx-drawer-item space-y-2 border-t border-black/[0.06] p-4 dark:border-white/10" style={{ "--i": nav.length + 1 } as React.CSSProperties}>
        <div className="hx-drawer-item rounded-2xl bg-black/[0.03] px-3 py-2.5 dark:bg-white/5">
          <SeasonPicker />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="flex-1 rounded-full border border-black/10 py-2.5 text-xs font-bold text-gray-700 transition active:scale-95 dark:border-white/15 dark:text-gray-200"
          >
            {lang === "en" ? "বাংলা" : "English"}
          </button>
          <button
            onClick={toggleTheme}
            className="flex-1 rounded-full border border-black/10 py-2.5 text-xs font-bold text-gray-700 transition active:scale-95 dark:border-white/15 dark:text-gray-200"
          >
            {theme === "light" ? (lang === "bn" ? "ডার্ক মোড" : "Dark mode") : lang === "bn" ? "লাইট মোড" : "Light mode"}
          </button>
        </div>
        {!isProfileComplete && (
          <button
            onClick={() => {
              setMenuOpen(false);
              setSignupOpen(true);
            }}
            className="btn-brand hx-glow flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-extrabold text-white"
          >
            {t("signup")}
          </button>
        )}
        <a
          href="#flash-sale"
          onClick={(e) => {
            setMenuOpen(false);
            goDeals(e);
          }}
          className="btn-brand hx-glow sheen flex items-center justify-center gap-2 rounded-full py-3 text-sm font-extrabold text-white"
        >
          <LivePill label={lang === "bn" ? "লাইভ ডিল" : "Live Deals"} />
        </a>
      </div>
    </aside>
    </>
  );
}
