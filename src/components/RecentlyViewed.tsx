"use client";

import { useEffect, useMemo, useState } from "react";
import { Product } from "@/lib/types";
import { readRecent } from "@/lib/recent";
import { useStore } from "@/context/StoreContext";
import ScrollSection from "./ScrollSection";

// Products this customer opened before (kept on their phone only)
export default function RecentlyViewed({ products, version }: { products: Product[]; version: string | null }) {
  const { lang } = useStore();
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(readRecent()), [version]);
  const list = useMemo(
    () => ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p)).slice(0, 8),
    [ids, products]
  );
  if (list.length < 2) return null;
  return (
    <ScrollSection
      id="recently-viewed"
      eyebrow={lang === "bn" ? "আপনার জন্য" : "For you"}
      title={lang === "bn" ? "সম্প্রতি দেখেছেন" : "Recently viewed"}
      products={list}
    />
  );
}
