"use client";

import FadeUp from "./FadeUp";
import SectionHeading from "./SectionHeading";
import Ico, { CATEGORY_ICON } from "./Ico";
import { CATEGORIES } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { CATEGORY_TINT } from "@/lib/shop";

// "Featured Categories" grid (AppleGadgets-style): one clean tile per category
export default function PopularCategories({ onSelect }: { onSelect: (category: string) => void }) {
  const { t, lang } = useStore();
  return (
    <FadeUp>
      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4">
        <SectionHeading eyebrow={lang === "bn" ? "ব্রাউজ করুন" : "Browse"} title={t("categories")} />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-4 md:grid-cols-6">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                onSelect(c);
                document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group flex flex-col items-center gap-2.5 rounded-2xl bg-white px-2 py-4 text-center ring-1 ring-black/[0.06] transition hover:-translate-y-0.5 hover:ring-emerald/50 hover:shadow-lux dark:bg-white/5 dark:ring-white/10 sm:py-5"
            >
              <span
                style={CATEGORY_TINT[c] ? { backgroundColor: CATEGORY_TINT[c].bg, color: CATEGORY_TINT[c].fg } : undefined}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10 text-emerald transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 sm:h-16 sm:w-16"
              >
                <Ico name={CATEGORY_ICON[c] || "bag"} className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <span className="line-clamp-2 text-[11px] font-bold leading-tight text-[#17120E] dark:text-gray-100 sm:text-xs">{c}</span>
            </button>
          ))}
        </div>
      </section>
    </FadeUp>
  );
}
