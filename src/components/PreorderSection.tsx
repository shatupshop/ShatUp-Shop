"use client";

import Ico from "./Ico";

import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import FadeUp from "./FadeUp";

// The Pre-Order area: its own highlighted band, deliberately styled differently
// from the normal shop so the two are never confused.
export default function PreorderSection({ products, lang }: { products: Product[]; lang: "en" | "bn" }) {
  const bn = lang === "bn";
  const steps = bn
    ? [
        { n: "১", t: "প্রি-অর্ডার করুন", d: "পছন্দের পণ্যে ট্যাপ করুন" },
        { n: "২", t: "হোয়াটসঅ্যাপে কনফার্ম", d: "আমরা ডেলিভারির সময় জানাব" },
        { n: "৩", t: "ঘরে পেয়ে যান", d: "পণ্য এলেই পৌঁছে দেব" }
      ]
    : [
        { n: "1", t: "Pre-order it", d: "Tap the item you love" },
        { n: "2", t: "Confirm on WhatsApp", d: "We share the delivery time" },
        { n: "3", t: "Get it delivered", d: "We bring it as soon as it lands" }
      ];

  return (
    <FadeUp>
      <section id="pre-order" className="mx-auto max-w-7xl scroll-mt-28 px-3 py-6 sm:px-4">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#FFF7DF] via-[#FFEEBF] to-[#FFE19A] p-4 shadow-[0_34px_70px_-34px_rgba(212,175,55,0.85)] ring-1 ring-[#FFC400]/50 dark:from-[#2b220f] dark:via-[#211a0c] dark:to-[#17110a] sm:p-8">
          {/* decoration */}
          <div className="pointer-events-none absolute inset-2 rounded-[26px] border-2 border-dashed border-[#FFC400]/45" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#F5D77A]/60 blur-3xl dark:bg-[#FFC400]/20" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-emerald/20 blur-3xl" />
          <span aria-hidden className="preorder-hourglass pointer-events-none absolute right-5 top-4 text-emerald opacity-90 sm:right-10 sm:top-6 sm:text-6xl"><Ico name="clock" className="h-14 w-14 sm:h-20 sm:w-20" strokeWidth={1.4} /></span>

          <div className="relative px-1 pt-2 sm:px-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#F5D77A] to-[#FFC400] px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#17120E] shadow">
              <span className="live-dot !bg-[#17120E]" aria-hidden />
              {bn ? "প্রি-অর্ডার" : "Pre-Order"}
            </span>
            <h2 className="mt-3 max-w-[80%] text-[26px] font-black leading-[1.1] tracking-tight text-[#17120E] dark:text-[#F5E6B8] sm:text-4xl">
              {bn ? "আগে অর্ডার করুন, " : "Order first, "}
              <span className="text-gradient-brand">{bn ? "পরে ডেলিভারি" : "we deliver soon"}</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm font-medium text-[#6f5612] dark:text-[#FFE066]/80">
              {bn
                ? "এই পণ্যগুলো এখন স্টকে নেই — আগে অর্ডার করলে আপনার জন্য আনিয়ে রাখব। সাধারণ পণ্যের সাথে এগুলো আলাদা।"
                : "These items are not in stock yet — pre-order now and we'll get yours. They are kept separate from the regular shop."}
            </p>

            <ol className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              {steps.map((s) => (
                <li key={s.n} className="rounded-2xl bg-white/70 p-2.5 text-center shadow-sm ring-1 ring-[#FFC400]/30 backdrop-blur dark:bg-white/5 sm:p-3.5">
                  <span className="btn-brand mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white">{s.n}</span>
                  <p className="mt-1.5 text-[11px] font-extrabold leading-tight text-[#17120E] dark:text-white sm:text-sm">{s.t}</p>
                  <p className="mt-0.5 hidden text-[11px] text-[#6f5612] dark:text-[#FFE066]/80 sm:block">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
            {products.map((p, i) => (
              <FadeUp key={p.id} delay={Math.min(i, 6) * 70} soft>
                <ProductCard product={p} />
              </FadeUp>
            ))}
          </div>
        </div>
      </section>
    </FadeUp>
  );
}
