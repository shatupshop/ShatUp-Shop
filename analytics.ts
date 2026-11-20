// Optional tracking helpers. Do nothing unless a Pixel / GA id is set in .env.local.
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
  }
}

type Ev = "AddToCart" | "ViewContent" | "Purchase" | "Search";

export function track(event: Ev, p: { id?: string; name?: string; value?: number; qty?: number; orderId?: string } = {}) {
  try {
    if (typeof window === "undefined") return;
    const value = p.value ?? 0;
    window.fbq?.("track", event, {
      content_ids: p.id ? [p.id] : undefined,
      content_name: p.name,
      value,
      currency: "BDT"
    });
    const ga: Record<Ev, string> = {
      AddToCart: "add_to_cart",
      ViewContent: "view_item",
      Purchase: "purchase",
      Search: "search"
    };
    window.gtag?.("event", ga[event], {
      value,
      currency: "BDT",
      transaction_id: p.orderId,
      items: p.id ? [{ item_id: p.id, item_name: p.name, quantity: p.qty ?? 1, price: value }] : undefined
    });
  } catch {
    /* tracking must never break the shop */
  }
}
