import { Product, Profile } from "./types";

// Pre-order WhatsApp message. Lives in its own file so the existing
// order messages (whatsapp.ts) stay exactly as they were.
export function buildPreorderMessage(product: Product, quantity: number, profile: Profile) {
  const fmt = (n: number) => `৳${n.toLocaleString("en-BD")}`;
  const lines = [
    "*PRE-ORDER — ShatUp Shop*",
    "",
    `*Product:* ${product.name}`,
    `*Quantity:* ${quantity}`,
    `*Price:* ${fmt(product.price)}`,
    `*Total:* ${fmt(product.price * quantity)}`
  ];
  if (product.preorder_eta) lines.push(`*Expected delivery:* ${product.preorder_eta}`);
  lines.push(
    "",
    `*Customer Name:* ${profile.name || "-"}`,
    `*Phone:* ${profile.phone || "-"}`,
    `*Address:* ${profile.address || "-"}`
  );
  return lines.join("\n");
}
