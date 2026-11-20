"use client";

import { Product } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import ProductCard from "./ProductCard";
import FadeUp from "./FadeUp";
import EmptyState from "./EmptyState";
import SectionHeading from "./SectionHeading";

export default function ProductGrid({
  title,
  products,
  emptyTitle,
  emptySubtitle,
  emptyAction,
  toolbar
}: {
  title: string;
  products: Product[];
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: React.ReactNode;
  toolbar?: React.ReactNode;
}) {
  const { lang } = useStore();
  return (
    <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4">
      <SectionHeading
        eyebrow={lang === "bn" ? "আমাদের কালেকশন" : "The collection"}
        title={title}
        right={
          products.length > 0 ? (
            <span className="rounded-full bg-black/[0.05] px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
              {products.length} {lang === "bn" ? "টি পণ্য" : "items"}
            </span>
          ) : undefined
        }
      />
      {toolbar}
      {products.length === 0 ? (
        <EmptyState title={emptyTitle || "No products found."} subtitle={emptySubtitle}>{emptyAction}</EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {products.map((p, i) => (
            <FadeUp key={p.id} delay={Math.min(i, 8) * 60} soft>
              <ProductCard product={p} />
            </FadeUp>
          ))}
        </div>
      )}
    </section>
  );
}
