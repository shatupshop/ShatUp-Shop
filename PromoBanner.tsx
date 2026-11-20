"use client";

import FadeUp from "./FadeUp";
import Ico from "./Ico";

export default function PromoBanner() {
  return (
    <FadeUp>
      <section id="free-delivery" className="mx-auto my-8 max-w-7xl scroll-mt-20 px-3 sm:px-4">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1d130c] via-[#2b1a0e] to-[#0f0a07] px-6 py-9 text-center shadow-[0_30px_60px_-30px_rgba(255,106,26,0.6)] ring-1 ring-[#FFC400]/30 sm:py-12">
          <div className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full bg-emerald/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-[#FFC400]/20 blur-3xl" />
          <div className="relative">
            <span className="mx-auto mb-3 inline-block rounded-full border border-[#FFC400]/40 bg-[#FFC400]/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#FFE066]">
              Free Delivery
            </span>
            <h3 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              গাইবান্ধা সদরে <span className="text-gradient-brand">ফ্রি ডেলিভারি</span>
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-white/75 sm:text-base">
              অর্ডার করুন হোয়াটসঅ্যাপের মাধ্যমে — সহজ ও দ্রুত!
            </p>
            <a
              href="#products"
              className="btn-brand sheen mt-5 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white"
            >
              এখনই অর্ডার করুন <span aria-hidden><Ico name="arrowRight" className="h-4 w-4" /></span>
            </a>
          </div>
        </div>
      </section>
    </FadeUp>
  );
}
