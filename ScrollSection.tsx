"use client";

import { Product } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import ProductCard from "./ProductCard";
import FadeUp from "./FadeUp";
import FlashCountdown from "./FlashCountdown";
import SectionHeading from "./SectionHeading";
import LivePill from "./LivePill";

export default function ScrollSection({
  title,
  products,
  accent,
  id,
  showCountdown,
  eyebrow
}: {
  title: string;
  products: Product[];
  accent?: "emerald" | "gold";
  id?: string;
  showCountdown?: boolean;
  eyebrow?: string;
}) {
  const { lang } = useStore();
  if (products.length === 0) return null;
  const dark = accent === "gold";

  const rail = (
    <div className="no-scrollbar rail-fade-r snap-x-mandatory flex gap-3.5 overflow-x-auto scroll-smooth pb-3 pt-1 sm:gap-4">
      {products.map((p) => (
        <div key={p.id} className="snap-center w-[10.25rem] shrink-0 sm:w-56">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );

  return (
    <FadeUp>
      <section id={id} className="mx-auto max-w-7xl scroll-mt-20 px-3 py-4 sm:px-4">
        {dark ? (
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1d130c] via-[#2b1a0e] to-[#0f0a07] p-4 shadow-[0_30px_60px_-30px_rgba(255,106,26,0.55)] ring-1 ring-[#FFC400]/25 sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#FFC400]/15 blur-3xl" />
            <div className="relative">
              <SectionHeading
                light
                eyebrow={lang === "bn" ? "সীমিত সময়" : "Limited time"}
                title={title}
                right={
                  showCountdown ? (
                    <div className="flex flex-col items-end gap-2">
                      <LivePill label={lang === "bn" ? "লাইভ চলছে" : "LIVE NOW"} />
                      <FlashCountdown />
                    </div>
                  ) : undefined
                }
              />
              {rail}
            </div>
          </div>
        ) : (
          <>
            <SectionHeading eyebrow={eyebrow ?? (lang === "bn" ? "সদ্য এসেছে" : "Just landed")} title={title} />
            {rail}
          </>
        )}
      </section>
    </FadeUp>
  );
}
