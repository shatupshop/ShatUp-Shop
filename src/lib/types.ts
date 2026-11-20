export interface Product {
  id: string;
  name: string;
  name_bn?: string | null;
  description?: string | null;
  category: string;
  price: number;
  original_price?: number | null;
  discount_percent?: number | null;
  stock: number;
  rating?: number | null;
  image_url?: string | null;
  is_flash_sale?: boolean | null;
  is_new_arrival?: boolean | null;
  is_sold_out?: boolean | null;
  is_preorder?: boolean | null;
  preorder_eta?: string | null;
  flash_total?: number | null;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// One "buy together" pair added from a product modal: 10% off the pair.
// amount is fixed at add time (pair total minus 10%); the entry only counts
// while the cart still holds at least mainQty of the main product + 1 partner.
export interface BundleEntry {
  id: string;
  mainId: string;
  partnerId: string;
  mainQty: number;
  amount: number;
}

// What the client sends to place_store_order so the server can re-derive
// the same discount from database prices (never trust the client's amount).
export interface BundleLine {
  main_product_id: string;
  partner_product_id: string;
  main_qty: number;
}

export const CATEGORIES = [
  "Electronics",
  "Mobile Accessories",
  "Fashion",
  "Men's Fashion",
  "Women's Fashion",
  "Beauty",
  "Home & Kitchen",
  "Grocery",
  "Gadgets",
  "Lifestyle",
  "Accessories",
  "Personal Care"
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount?: number | null;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  used_count?: number | null;
  is_active: boolean;
  expires_at?: string | null;
  created_at?: string;
}

export interface Profile {
  name: string;
  phone: string;
  address: string;
}

export interface Banner {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  image_url: string;
  media_type: "image" | "video";
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface Collection {
  id: string;
  title: string;
  image_url: string;
  button_link?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface PromoSlide {
  id: string;
  title?: string | null;
  image_url: string;
  link_type: "none" | "url" | "product" | "category";
  link_value?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

// single source of truth for "should this promo be visible right now?"
export function isPromoLive(b: PromoSlide, nowMs: number = Date.now()): boolean {
  if (!b.is_active) return false;
  if (b.starts_at && new Date(b.starts_at).getTime() > nowMs) return false;
  if (b.ends_at && new Date(b.ends_at).getTime() < nowMs) return false;
  return true;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  url: string;
  media_type: "image" | "video";
  sort_order: number;
}

// a product is sold out when the admin switched it off OR its stock is 0
// pre-order items are never "out of stock" just because stock is 0;
// the admin can still close one with the Sold Out switch.
export function isSoldOut(p: Pick<Product, "stock" | "is_sold_out" | "is_preorder">): boolean {
  return Boolean(p.is_sold_out) || (p.stock <= 0 && !p.is_preorder);
}

// keeps the given order, but sold-out items always go to the end
export function soldOutLast<T extends Pick<Product, "stock" | "is_sold_out" | "is_preorder">>(list: T[]): T[] {
  return [...list].sort((a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b)));
}
