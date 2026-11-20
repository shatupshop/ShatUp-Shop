"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { BundleEntry, BundleLine, CartItem, Coupon, Product, Profile } from "@/lib/types";
import { dict, DictKey, Lang } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { isSeasonId, SeasonId } from "@/lib/seasons";

interface StoreContextValue {
  // language
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;

  // theme
  theme: "light" | "dark";
  toggleTheme: () => void;

  // seasonal theme (re-skins the brand gradients)
  season: SeasonId;
  setSeason: (s: SeasonId) => void;

  // cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // bundle deal ("buy together & save", 10% off the pair) — the discount is
  // real: it lowers the cart total and is re-checked by the server at checkout
  addBundleToCart: (main: Product, partner: Product, mainQty?: number) => void;
  bundleDiscountAmount: number;
  activeBundles: BundleLine[];

  // coupon
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  couponLoading: boolean;
  couponError: string;
  discountAmount: number;
  cartGrandTotal: number;

  // wishlist
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;

  // profile
  profile: Profile;
  setProfile: (p: Profile) => void;
  isProfileComplete: boolean;

  // ui state
  isCartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  isWishlistOpen: boolean;
  setWishlistOpen: (v: boolean) => void;
  isProfileOpen: boolean;
  setProfileOpen: (v: boolean) => void;
  isSignupOpen: boolean;
  setSignupOpen: (v: boolean) => void;
  activeProduct: Product | null;
  setActiveProduct: (p: Product | null) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// keeps cart quantities from ever exceeding the product's real stock
function clampQuantity(quantity: number, stock: number) {
  const safe = Math.max(1, Math.floor(quantity) || 1);
  if (stock <= 0) return 0;
  return Math.min(safe, stock);
}

// 10% off a main + partner pair. Same formula as the server (place_store_order):
// saving = pair total - round(pair total * 0.9), so the "Save ৳X" shown in the
// modal is exactly the discount the cart applies.
function bundleSavingFor(main: Product, partner: Product, mainQty: number) {
  const pairTotal = main.price * mainQty + partner.price;
  return pairTotal - Math.round(pairTotal * 0.9);
}

function newBundleId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [season, setSeason] = useState<SeasonId>("default");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bundles, setBundles] = useState<BundleEntry[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [profile, setProfileState] = useState<Profile>({
    name: "",
    phone: "",
    address: ""
  });

  const [isCartOpen, setCartOpen] = useState(false);
  const [isWishlistOpen, setWishlistOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isSignupOpen, setSignupOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Persist only AFTER the saved values were read. Without this guard the first render
  // (still holding the empty defaults) can overwrite the customer's saved cart / profile.
  const [hydrated, setHydrated] = useState(false);

  // hydrate from localStorage on mount
  useEffect(() => {
    setLangState(loadJSON("shatup_lang", "en"));
    setTheme(loadJSON("shatup_theme", "light"));
    const savedSeason = loadJSON("shatup_season", "default");
    setSeason(isSeasonId(savedSeason) ? savedSeason : "default");
    setCart(loadJSON("shatup_cart", []));
    setBundles(loadJSON("shatup_bundles", []));
    setWishlist(loadJSON("shatup_wishlist", []));
    setProfileState(loadJSON("shatup_profile", { name: "", phone: "", address: "" }));
    setAppliedCoupon(loadJSON<Coupon | null>("shatup_coupon", null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (!hydrated) return;
    try {
      window.localStorage.setItem("shatup_theme", JSON.stringify(theme));
    } catch {
      /* storage full or blocked (private mode) - the shop still works, it just will not remember */
    }
  }, [theme, hydrated]);

  useEffect(() => {
    document.documentElement.dataset.season = season;
    if (!hydrated) return;
    try {
      window.localStorage.setItem("shatup_season", JSON.stringify(season));
    } catch {
      /* storage full or blocked (private mode) - the shop still works, it just will not remember */
    }
  }, [season, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("shatup_lang", JSON.stringify(lang));
    } catch {
      /* storage full or blocked (private mode) - the shop still works, it just will not remember */
    }
  }, [lang, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("shatup_cart", JSON.stringify(cart));
    } catch {
      /* storage full or blocked (private mode) - the shop still works, it just will not remember */
    }
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("shatup_bundles", JSON.stringify(bundles));
    } catch {
      /* storage full or blocked (private mode) - the shop still works, it just will not remember */
    }
  }, [bundles, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("shatup_wishlist", JSON.stringify(wishlist));
    } catch {
      /* storage full or blocked (private mode) - the shop still works, it just will not remember */
    }
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("shatup_profile", JSON.stringify(profile));
    } catch {
      /* storage full or blocked (private mode) - the shop still works, it just will not remember */
    }
  }, [profile, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("shatup_coupon", JSON.stringify(appliedCoupon));
    } catch {
      /* storage full or blocked (private mode) - the shop still works, it just will not remember */
    }
  }, [appliedCoupon, hydrated]);

  const t = useCallback((key: DictKey) => dict[lang][key], [lang]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    if (product.is_preorder || product.stock <= 0 || product.is_sold_out) return;
    track("AddToCart", { id: product.id, name: product.name, value: product.price, qty: quantity });
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const nextQty = clampQuantity(existing.quantity + quantity, product.stock);
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: nextQty } : i
        );
      }
      return [...prev, { product, quantity: clampQuantity(quantity, product.stock) }];
    });
  }, []);

  const addBundleToCart = useCallback(
    (main: Product, partner: Product, mainQty = 1) => {
      const qty = Math.max(1, Math.floor(mainQty) || 1);
      addToCart(main, qty);
      addToCart(partner, 1);
      // The discount is recorded against the pair, not the click: it only
      // counts while the cart still holds that pair (see activeBundleEntries).
      setBundles((prev) => [
        ...prev,
        {
          id: newBundleId(),
          mainId: main.id,
          partnerId: partner.id,
          mainQty: qty,
          amount: bundleSavingFor(main, partner, qty)
        }
      ]);
    },
    [addToCart]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: clampQuantity(quantity, i.product.stock) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setBundles([]);
    setAppliedCoupon(null);
    setCouponError("");
  }, []);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlist.some((p) => p.id === productId),
    [wishlist]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart]
  );

  // A bundle entry only discounts while the cart still holds its pair.
  // Quantities are consumed greedily, so adding the same bundle twice needs
  // two full pairs in the cart to discount twice.
  const activeBundleEntries = useMemo(() => {
    const remaining = new Map<string, number>();
    for (const item of cart) {
      remaining.set(item.product.id, (remaining.get(item.product.id) ?? 0) + item.quantity);
    }
    const active: BundleEntry[] = [];
    for (const entry of bundles) {
      const mainLeft = remaining.get(entry.mainId) ?? 0;
      const partnerLeft = remaining.get(entry.partnerId) ?? 0;
      if (mainLeft >= entry.mainQty && partnerLeft >= 1) {
        active.push(entry);
        remaining.set(entry.mainId, mainLeft - entry.mainQty);
        remaining.set(entry.partnerId, partnerLeft - 1);
      }
    }
    return active;
  }, [cart, bundles]);

  const bundleDiscountAmount = useMemo(
    () => activeBundleEntries.reduce((sum, e) => sum + e.amount, 0),
    [activeBundleEntries]
  );

  const activeBundles: BundleLine[] = useMemo(
    () =>
      activeBundleEntries.map((e) => ({
        main_product_id: e.mainId,
        partner_product_id: e.partnerId,
        main_qty: e.mainQty
      })),
    [activeBundleEntries]
  );

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (cartTotal <= 0) return 0;
    if (cartTotal < (appliedCoupon.min_order_amount || 0)) return 0;

    let raw =
      appliedCoupon.discount_type === "percent"
        ? (cartTotal * appliedCoupon.discount_value) / 100
        : appliedCoupon.discount_value;

    if (
      appliedCoupon.discount_type === "percent" &&
      appliedCoupon.max_discount_amount != null
    ) {
      raw = Math.min(raw, appliedCoupon.max_discount_amount);
    }

    return Math.min(Math.max(raw, 0), cartTotal);
  }, [appliedCoupon, cartTotal]);

  const cartGrandTotal = useMemo(
    () => Math.max(cartTotal - discountAmount - bundleDiscountAmount, 0),
    [cartTotal, discountAmount, bundleDiscountAmount]
  );

  // if the cart shrinks below the coupon's minimum after it was applied
  // (e.g. an item got removed), quietly drop it instead of overcharging
  // or silently ignoring a coupon that no longer qualifies
  useEffect(() => {
    if (!appliedCoupon) return;
    if (cartTotal > 0 && cartTotal < (appliedCoupon.min_order_amount || 0)) {
      setAppliedCoupon(null);
      setCouponError(
        `Cart total dropped below ৳${appliedCoupon.min_order_amount} — coupon removed.`
      );
    }
  }, [cartTotal, appliedCoupon]);

  const applyCoupon = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (!code) {
        setCouponError("Enter a coupon code.");
        return;
      }
      setCouponLoading(true);
      setCouponError("");
      try {
        // Validation happens on the server (validate_coupon). The browser never reads the coupons
        // table and never touches used_count; the discount shown here is a preview only, and
        // place_store_order recalculates it again when the order is created.
        const { data, error } = await supabase.rpc("validate_coupon", {
          p_code: code,
          p_subtotal: cartTotal
        });

        if (error || !data) {
          setAppliedCoupon(null);
          const raw = error?.message || "";
          setCouponError(
            /could not find the function|schema cache/i.test(raw)
              ? "Coupons are not set up yet."
              : raw || "Invalid coupon code."
          );
          return;
        }

        const v = data as {
          code: string;
          discount_type: "percent" | "fixed";
          discount_value: number;
          min_order_amount?: number | null;
          max_discount_amount?: number | null;
        };
        const coupon: Coupon = {
          id: v.code,
          code: v.code,
          discount_type: v.discount_type,
          discount_value: Number(v.discount_value),
          min_order_amount: v.min_order_amount != null ? Number(v.min_order_amount) : null,
          max_discount_amount: v.max_discount_amount != null ? Number(v.max_discount_amount) : null,
          is_active: true
        };
        setAppliedCoupon(coupon);
        setCouponError("");
      } catch {
        setAppliedCoupon(null);
        setCouponError("Could not verify coupon right now. Please try again.");
      } finally {
        setCouponLoading(false);
      }
    },
    [cartTotal]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError("");
  }, []);

  const isProfileComplete = Boolean(
    profile.name && profile.phone && profile.address
  );

  const value: StoreContextValue = {
    lang,
    setLang: setLangState,
    t,
    theme,
    toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
    season,
    setSeason,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
    addBundleToCart,
    bundleDiscountAmount,
    activeBundles,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponLoading,
    couponError,
    discountAmount,
    cartGrandTotal,
    wishlist,
    toggleWishlist,
    isWishlisted,
    profile,
    setProfile: setProfileState,
    isProfileComplete,
    isCartOpen,
    setCartOpen,
    isWishlistOpen,
    setWishlistOpen,
    isProfileOpen,
    setProfileOpen,
    isSignupOpen,
    setSignupOpen,
    activeProduct,
    setActiveProduct
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
