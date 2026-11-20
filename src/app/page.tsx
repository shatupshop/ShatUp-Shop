import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import HomeClient from "@/components/HomeClient";

// Server wrapper: a shared product link (/?p=<id>) gets its own title, price and photo
// in the WhatsApp / Facebook preview. Everything else lives in HomeClient.
export async function generateMetadata({
  searchParams
}: {
  searchParams: { p?: string | string[] };
}): Promise<Metadata> {
  const id = Array.isArray(searchParams?.p) ? searchParams.p[0] : searchParams?.p;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!id || !url || !key || !/^[0-9a-fA-F-]{20,40}$/.test(id)) return {};
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await sb
      .from("products")
      .select("name, description, price, image_url")
      .eq("id", id)
      .maybeSingle();
    if (!data) return {};
    const title = `${data.name} — ৳${Number(data.price).toLocaleString("en-BD")} | ShatUp Shop`;
    const description = (data.description || "Order easily on WhatsApp from ShatUp Shop.").slice(0, 180);
    const images = data.image_url ? [{ url: data.image_url }] : undefined;
    return {
      title,
      description,
      openGraph: { title, description, images, type: "website" },
      twitter: { card: images ? "summary_large_image" : "summary", title, description, images: images?.map((i) => i.url) }
    };
  } catch {
    return {};
  }
}

export default function Page() {
  return <HomeClient />;
}
