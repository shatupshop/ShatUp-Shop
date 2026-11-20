"use client";

import { useStore } from "@/context/StoreContext";
import { SEASONS } from "@/lib/seasons";

// One-tap seasonal theme picker: Default / Eid / 11.11 / Puja.
// `variant` matches the surface it sits on (light drawer vs dark footer).
export default function SeasonPicker({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { season, setSeason, lang } = useStore();
  const dark = variant === "dark";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-xs font-bold ${dark ? "text-white/70" : "text-gray-700 dark:text-gray-200"}`}>
        {lang === "bn" ? "থিম" : "Theme"}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {SEASONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSeason(s.id)}
            aria-pressed={season === s.id}
            title={s.label}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 ${
              season === s.id
                ? dark
                  ? "border-white/60 bg-white/15 text-white"
                  : "border-[#FF6A1A] bg-[#FF6A1A]/10 text-[#17120E] dark:border-white/60 dark:bg-white/10 dark:text-white"
                : dark
                  ? "border-white/15 text-white/70 hover:border-white/40"
                  : "border-black/10 text-gray-600 hover:border-black/30 dark:border-white/15 dark:text-gray-300"
            }`}
          >
            <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: s.dot }} />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
