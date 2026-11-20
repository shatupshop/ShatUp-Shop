"use client";

import FadeUp from "./FadeUp";
import Ico, { IcoName } from "./Ico";

const highlights: { icon: IcoName; en: string; bn: string; sub: string; subBn: string }[] = [
  { icon: "truck", en: "Fast Delivery", bn: "দ্রুত ডেলিভারি", sub: "Free in Gaibandha Sadar", subBn: "গাইবান্ধা সদরে ফ্রি" },
  { icon: "shield", en: "Genuine Products", bn: "অরিজিনাল পণ্য", sub: "Checked before shipping", subBn: "যাচাই করে পাঠানো হয়" },
  { icon: "tag", en: "Best Price Deals", bn: "সেরা দাম", sub: "Honest pricing", subBn: "কোনো লুকানো খরচ নেই" },
  { icon: "wrench", en: "After-Sales Support", bn: "বিক্রয়োত্তর সেবা", sub: "Easy exchange help", subBn: "এক্সচেঞ্জে সহায়তা" },
  { icon: "chat", en: "WhatsApp Support", bn: "হোয়াটসঅ্যাপ সাপোর্ট", sub: "Message us anytime", subBn: "যেকোনো সময় মেসেজ" }
];

export function TrustHighlights({ lang }: { lang: "en" | "bn" }) {
  return (
    <FadeUp>
      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {highlights.map((h, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-black/[0.06] transition hover:ring-emerald/40 dark:bg-white/5 dark:ring-white/10 ${
                i === 4 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                <Ico name={h.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block text-[13px] font-bold text-[#17120E] dark:text-gray-100">{lang === "bn" ? h.bn : h.en}</span>
                <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">{lang === "bn" ? h.subBn : h.sub}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </FadeUp>
  );
}

export function WhyRimonStore({ lang }: { lang: "en" | "bn" }) {
  const points =
    lang === "bn"
      ? [
          "সততার সাথে সঠিক দামে পণ্য",
          "সরাসরি হোয়াটসঅ্যাপে সহজ অর্ডার",
          "গাইবান্ধা সদরে ফ্রি ডেলিভারি",
          "প্রতিটি পণ্য যাচাই করে পাঠানো হয়"
        ]
      : [
          "Honest pricing, no hidden costs",
          "Simple ordering directly via WhatsApp",
          "Free delivery in Gaibandha Sadar",
          "Every product checked before shipping"
        ];

  return (
    <FadeUp>
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4">
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-black/[0.06] dark:bg-white/5 dark:ring-white/10 sm:p-10">
          <h2 className="relative text-center text-2xl font-black tracking-tight text-[#17120E] dark:text-white sm:text-3xl">
            {lang === "bn" ? "কেন " : "Why "}
            <span className="text-gradient-brand">{lang === "bn" ? "শ্যাটআপ শপ?" : "ShatUp Shop?"}</span>
          </h2>
          <div className="relative mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {points.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-[#f6f6f7] p-3.5 text-sm font-medium text-gray-700 dark:bg-white/5 dark:text-gray-200">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-white">
                  <Ico name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </FadeUp>
  );
}
