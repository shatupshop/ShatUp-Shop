"use client";

import Ico from "./Ico";

// slim announcement ticker (text only - no emoji)
export default function TrustStrip({ lang }: { lang: "en" | "bn" }) {
  const items =
    lang === "bn"
      ? ["সহজ হোয়াটসঅ্যাপ অর্ডার", "দ্রুত ডেলিভারি", "অরিজিনাল পণ্য", "সেরা দামের অফার", "বিক্রয়োত্তর সেবা"]
      : ["Easy WhatsApp Order", "Fast Delivery", "Genuine Products", "Best Price Deals", "After-Sales Support"];

  const row = (dup: boolean) => (
    <div className={`flex shrink-0 items-center ${dup ? "lux-marquee-dup" : ""}`} aria-hidden={dup}>
      {items.map((label, i) => (
        <span
          key={i}
          className="hx-ticker-item flex shrink-0 items-center gap-2 px-6 text-[11px] font-semibold tracking-wide text-white/90 sm:text-xs"
        >
          {label}
          <span className="hx-ico ml-6 text-[#FFC400]/70"><Ico name="sparkle" className="h-3 w-3" /></span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="hx-ticker w-full py-2.5">
      <div className="lux-marquee">
        {row(false)}
        {row(true)}
      </div>
      <span className="hx-ticker-line" aria-hidden />
    </div>
  );
}
