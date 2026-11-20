// Central shop settings (edit via .env.local, no code changes needed)
const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? n : d;
};

export const SHOP = {
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8801868561887").replace(/\D/g, ""),
  freeZone: "Gaibandha Sadar",
  deliveryOutside: num(process.env.NEXT_PUBLIC_DELIVERY_OUTSIDE, 120),
  bkash: (process.env.NEXT_PUBLIC_BKASH_NUMBER || "").trim(),
  nagad: (process.env.NEXT_PUBLIC_NAGAD_NUMBER || "").trim(),
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")
};

export type DeliveryArea = "inside" | "outside";
export type PayMethod = "later" | "bkash" | "nagad";

export interface OrderExtras {
  deliveryArea: DeliveryArea;
  deliveryCharge: number;
  payment: PayMethod;
  trxId?: string;
}

export const deliveryChargeFor = (area: DeliveryArea) => (area === "outside" ? SHOP.deliveryOutside : 0);

// pastel tint per category (inline colours, so Tailwind purging can never drop them)
export const CATEGORY_TINT: Record<string, { bg: string; fg: string }> = {
  Electronics: { bg: "#E3E9FF", fg: "#3B5BDB" },
  "Mobile Accessories": { bg: "#E0F4FF", fg: "#0B7BB5" },
  Fashion: { bg: "#FFE3EE", fg: "#D6336C" },
  "Men's Fashion": { bg: "#E6ECF5", fg: "#364FC7" },
  "Women's Fashion": { bg: "#FFE0F0", fg: "#C2255C" },
  Beauty: { bg: "#FFE8E0", fg: "#E8590C" },
  "Home & Kitchen": { bg: "#FFF1D6", fg: "#C77700" },
  Grocery: { bg: "#E3F6D8", fg: "#2F9E44" },
  Gadgets: { bg: "#EADFFF", fg: "#7048E8" },
  Lifestyle: { bg: "#D9F5EF", fg: "#0CA678" },
  Accessories: { bg: "#FFF0C7", fg: "#B58105" },
  "Personal Care": { bg: "#FFE3E3", fg: "#E03131" }
};
