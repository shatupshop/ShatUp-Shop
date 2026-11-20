import { CartItem, Coupon, Product, Profile } from "./types";

const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8801868561887"
).replace(/\D/g, "");

function fmt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export function buildSingleProductMessage(
  product: Product,
  quantity: number,
  profile: Profile
) {
  const total = product.price * quantity;
  const lines = [
    "*New Order — ShatUp Shop*",
    "",
    `*Product:* ${product.name}`,
    `*Quantity:* ${quantity}`,
    `*Price:* ${fmt(product.price)}`,
    `*Total:* ${fmt(total)}`,
    "",
    `*Customer Name:* ${profile.name || "-"}`,
    `*Phone:* ${profile.phone || "-"}`,
    `*Address:* ${profile.address || "-"}`
  ];
  return lines.join("\n");
}

export function buildCartMessage(
  items: CartItem[],
  profile: Profile,
  coupon?: Coupon | null,
  discountAmount = 0
) {
  const lines = ["*New Cart Order — ShatUp Shop*", ""];
  let subtotal = 0;
  items.forEach((item, idx) => {
    const lineTotal = item.product.price * item.quantity;
    subtotal += lineTotal;
    lines.push(
      `${idx + 1}. *${item.product.name}* x${item.quantity} — ${fmt(
        lineTotal
      )}`
    );
  });
  lines.push("", `*Subtotal:* ${fmt(subtotal)}`);
  if (coupon && discountAmount > 0) {
    const label =
      coupon.discount_type === "percent"
        ? `${coupon.discount_value}% off`
        : `${fmt(coupon.discount_value)} off`;
    lines.push(`*Coupon:* ${coupon.code} (${label})`);
    lines.push(`*Discount:* -${fmt(discountAmount)}`);
  }
  lines.push(`*Grand Total:* ${fmt(Math.max(subtotal - discountAmount, 0))}`, "");
  lines.push(`*Customer Name:* ${profile.name || "-"}`);
  lines.push(`*Phone:* ${profile.phone || "-"}`);
  lines.push(`*Address:* ${profile.address || "-"}`);
  return lines.join("\n");
}

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;
}

// ---------------------------------------------------------------------------
// Message built from the order the DATABASE confirmed (prices, discount and total
// come from the server, never from the browser).
// ---------------------------------------------------------------------------
import type { PlacedOrder } from "./orders";
import type { OrderExtras } from "./shop";

export function buildOrderMessage(order: PlacedOrder, profile: Profile, extras?: OrderExtras) {
  const preorderCount = order.items.filter((i) => i.is_preorder).length;
  const allPreorder = preorderCount > 0 && preorderCount === order.items.length;
  const hasPreorder = preorderCount > 0;
  const rule = "------------------------";

  const title = allPreorder
    ? "*PRE-ORDER — ShatUp Shop*"
    : hasPreorder
    ? "*NEW ORDER (with Pre-Order items) — ShatUp Shop*"
    : "*NEW ORDER — ShatUp Shop*";

  const lines: string[] = [
    title,
    `Order ID: *${order.order_ref}*`,
    "",
    allPreorder
      ? "Hello ShatUp Shop, I have pre-ordered the item(s) below. Please confirm the delivery time."
      : "Hello ShatUp Shop, I would like to confirm this order:",
    rule,
    "*Items*"
  ];

  order.items.forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item.name}${item.is_preorder ? "  [PRE-ORDER]" : ""}`);
    lines.push(`    ${fmt(Number(item.price))} x ${item.quantity} = *${fmt(Number(item.line_total))}*`);
  });

  lines.push(rule);
  lines.push(`Subtotal: ${fmt(Number(order.subtotal))}`);
  if (order.coupon_code && Number(order.discount) > 0) {
    lines.push(`Coupon (${order.coupon_code}): -${fmt(Number(order.discount))}`);
  }
  if (Number(order.bundle_discount) > 0) {
    lines.push(`Bundle discount (10% off): -${fmt(Number(order.bundle_discount))}`);
  }
  if (extras) {
    const area = extras.deliveryArea === "inside" ? "Gaibandha Sadar" : "Outside Gaibandha Sadar";
    lines.push(
      extras.deliveryCharge > 0
        ? `Delivery (${area}): ${fmt(extras.deliveryCharge)} (to be confirmed)`
        : `Delivery (${area}): Free`
    );
    lines.push(`*Total to pay: ${fmt(Number(order.total) + extras.deliveryCharge)}*`);
  } else {
    lines.push(`*Total: ${fmt(Number(order.total))}*`);
  }
  lines.push(rule);

  lines.push("*Customer*");
  lines.push(`Name: ${profile.name || "-"}`);
  lines.push(`Phone: ${profile.phone || "-"}`);
  lines.push(`Address: ${profile.address || "-"}`);

  if (extras) {
    const pay = extras.payment === "bkash" ? "bKash" : extras.payment === "nagad" ? "Nagad" : "Will confirm on WhatsApp";
    lines.push("", `Payment: ${pay}`);
    if (extras.trxId) lines.push(`Transaction ID: ${extras.trxId}`);
  }

  if (hasPreorder) {
    lines.push(
      "",
      allPreorder
        ? "Note: Pre-order - please tell me the expected delivery time."
        : "Note: Pre-order items will be delivered later - please confirm the delivery time."
    );
  }
  lines.push("", "Thank you!");
  return lines.join("\n");
}
