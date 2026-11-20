import type { Lang } from "./i18n";

// Delivery estimate: orders placed today reach Gaibandha Sadar within 2 days
// (free) and anywhere else within 4 days. Shown as "by <date>" so the customer
// sees a real day, not just "2-4 days".
export function deliveryDates(now = new Date()) {
  const add = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };
  return { sadar: add(2), outside: add(4) };
}

export function formatDeliveryDate(d: Date, lang: Lang) {
  return d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

// "Live viewers" for a product page: a stable, plausible count (4–13) that only
// changes once a day. It is a display estimate seeded from the product id, not
// real analytics — there is no live visitor tracking on the shop.
export function viewersFor(productId: string): number {
  let h = 0;
  for (let i = 0; i < productId.length; i++) h = (h * 31 + productId.charCodeAt(i)) >>> 0;
  const day = Math.floor(Date.now() / 86400000);
  return 4 + ((h + day * 7) % 10);
}
