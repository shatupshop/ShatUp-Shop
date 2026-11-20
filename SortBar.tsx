"use client";

import Ico from "./Ico";

export type SortKey = "new" | "priceAsc" | "priceDesc" | "rating" | "discount";

const OPTIONS: { key: SortKey; en: string; bn: string }[] = [
  { key: "new", en: "Newest", bn: "নতুন" },
  { key: "priceAsc", en: "Price: Low to High", bn: "দাম: কম থেকে বেশি" },
  { key: "priceDesc", en: "Price: High to Low", bn: "দাম: বেশি থেকে কম" },
  { key: "rating", en: "Top Rated", bn: "সেরা রেটিং" },
  { key: "discount", en: "Biggest Discount", bn: "সবচেয়ে বেশি ছাড়" }
];

export default function SortBar({
  lang,
  sort,
  onSort,
  inStockOnly,
  onInStockOnly
}: {
  lang: "en" | "bn";
  sort: SortKey;
  onSort: (k: SortKey) => void;
  inStockOnly: boolean;
  onInStockOnly: (v: boolean) => void;
}) {
  return (
    <div className="no-scrollbar -mx-1 mb-4 flex items-center gap-2 overflow-x-auto px-1 py-1" role="toolbar" aria-label="Sort products">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => onSort(o.key)}
          aria-pressed={sort === o.key}
          className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
            sort === o.key
              ? "bg-[#17120E] text-white shadow-md dark:bg-white dark:text-black"
              : "bg-white text-gray-600 shadow-sm ring-1 ring-black/[0.06] hover:text-emerald hover:ring-emerald/50 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10"
          }`}
        >
          {lang === "bn" ? o.bn : o.en}
        </button>
      ))}
      <span className="mx-1 h-5 w-px shrink-0 bg-black/10 dark:bg-white/15" />
      <button
        onClick={() => onInStockOnly(!inStockOnly)}
        aria-pressed={inStockOnly}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
          inStockOnly
            ? "bg-emerald text-white shadow-md"
            : "bg-white text-gray-600 shadow-sm ring-1 ring-black/[0.06] hover:text-emerald dark:bg-white/5 dark:text-gray-300 dark:ring-white/10"
        }`}
      >
        <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] ${inStockOnly ? "bg-white text-emerald" : "bg-black/10"}`}>
          {inStockOnly ? <Ico name="check" className="h-2.5 w-2.5" strokeWidth={3} /> : ""}
        </span>
        {lang === "bn" ? "শুধু স্টকে আছে" : "In stock only"}
      </button>
    </div>
  );
}
