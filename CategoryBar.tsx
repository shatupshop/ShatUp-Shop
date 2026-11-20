"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import Ico, { CATEGORY_ICON } from "./Ico";

// Sticks right under the header while you scroll, turning into frosted glass.
export default function CategoryBar({
  active,
  onSelect
}: {
  active: string | null;
  onSelect: (c: string | null) => void;
}) {
  const { t } = useStore();
  const ref = useRef<HTMLElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    let raf = 0;
    function update() {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;
      setStuck(el.getBoundingClientRect().top <= headerH + 1);
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const base =
    "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold tracking-wide transition active:scale-95";
  const idle =
    "bg-white text-gray-600 shadow-sm ring-1 ring-black/[0.06] hover:text-emerald hover:ring-emerald/50 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10";
  return (
    <section
      id="categories"
      ref={ref}
      style={{ top: "var(--header-h, 64px)" }}
      className={`sticky z-30 scroll-mt-24 transition-[background,box-shadow] duration-300 ${stuck ? "cat-stuck" : ""}`}
    >
      <div className="mx-auto max-w-7xl px-3 py-2 sm:px-4">
        <div className="no-scrollbar rail-fade-r -mx-1 flex gap-2 overflow-x-auto scroll-smooth px-1 py-1">
          <button
            onClick={() => onSelect(null)}
            aria-pressed={active === null}
            className={`${base} ${active === null ? "btn-brand text-white" : idle}`}
          >
            {t("allProducts")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => onSelect(c)}
              aria-pressed={active === c}
              className={`${base} ${active === c ? "btn-brand text-white" : idle}`}
            >
              <Ico name={CATEGORY_ICON[c] || "bag"} className="h-4 w-4" /> {c}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
