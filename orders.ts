import { supabase, isSupabaseConfigured } from "./supabase";
import { buildOrderMessage, whatsappLink } from "./whatsapp";
import type { BundleLine, Profile } from "./types";
import type { OrderExtras } from "./shop";
import { track } from "./analytics";

export interface PlacedOrderItem {
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  line_total: number;
  is_preorder: boolean;
}

export interface PlacedOrder {
  order_id: string;
  order_ref: string;
  status: string;
  subtotal: number;
  discount: number;
  bundle_discount: number;
  total: number;
  coupon_code: string | null;
  items: PlacedOrderItem[];
}

export interface OrderLine {
  product_id: string;
  quantity: number;
}

// One key per checkout attempt: if the customer double-taps or retries after a
// network drop, the database returns the same order instead of creating a second one.
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function friendlyError(raw: string): string {
  if (/could not find the function|schema cache/i.test(raw)) {
    return "Ordering is not set up yet. The shop owner needs to run the latest database update.";
  }
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return "No connection. Please check your internet and try again. Your order was NOT placed.";
  }
  return raw || "Order could not be placed. Please try again.";
}

// Creates the order in the database. Throws if it was not saved — callers must
// never show a success message or open WhatsApp unless this resolves.
export async function placeOrder(
  lines: OrderLine[],
  profile: Profile,
  couponCode: string | null,
  idempotencyKey: string,
  bundles?: BundleLine[]
): Promise<PlacedOrder> {
  if (!isSupabaseConfigured) {
    throw new Error("The shop is not connected to its database, so orders cannot be placed right now.");
  }
  // p_bundles is only sent when a bundle is actually in the cart, so orders
  // without one keep calling the old signature exactly (a database that has
  // not run the bundle migration yet still accepts them).
  const params: Record<string, unknown> = {
    p_customer_name: profile.name,
    p_customer_phone: profile.phone,
    p_customer_address: profile.address,
    p_items: lines,
    p_coupon_code: couponCode,
    p_idempotency_key: idempotencyKey
  };
  if (bundles && bundles.length > 0) params.p_bundles = bundles;
  const { data, error } = await supabase.rpc("place_store_order", params);
  if (error) throw new Error(friendlyError(error.message));
  const order = data as PlacedOrder | null;
  if (!order || !order.order_id) {
    throw new Error("The order could not be confirmed. Please try again.");
  }
  return order;
}

// Saves the order first, then continues the existing WhatsApp workflow.
// The blank tab is opened synchronously (inside the tap) so mobile browsers do not block it.
export async function placeOrderAndOpenWhatsApp(
  lines: OrderLine[],
  profile: Profile,
  couponCode: string | null,
  idempotencyKey: string,
  extras?: OrderExtras,
  bundles?: BundleLine[]
): Promise<PlacedOrder> {
  const waWindow = typeof window !== "undefined" ? window.open("about:blank", "_blank") : null;
  try {
    const order = await placeOrder(lines, profile, couponCode, idempotencyKey, bundles);
    track("Purchase", { value: Number(order.total), orderId: order.order_ref });
    const url = whatsappLink(buildOrderMessage(order, profile, extras));
    if (waWindow) waWindow.location.href = url;
    else window.location.href = url;
    return order;
  } catch (err) {
    if (waWindow) waWindow.close();
    throw err;
  }
}
