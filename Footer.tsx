"use client";

import { Facebook, Mail, Telegram, WhatsApp } from "./icons";
import { SHOP } from "@/lib/shop";
import { useStore } from "@/context/StoreContext";
import Logo from "./Logo";
import SmokeWisps from "./SmokeWisps";
import Ico, { IcoName } from "./Ico";
import SeasonPicker from "./SeasonPicker";

export default function Footer() {
  const { t, lang } = useStore();
  const bn = lang === "bn";

  const perks: { icon: IcoName; title: string; sub: string }[] = [
    { icon: "truck", title: bn ? "দ্রুত ডেলিভারি" : "Fast Delivery", sub: bn ? "গাইবান্ধা সদরে ফ্রি" : "Free in Gaibandha Sadar" },
    { icon: "tag", title: bn ? "সেরা দাম" : "Best Price", sub: bn ? "সততার সাথে সঠিক দাম" : "Honest pricing" },
    { icon: "shield", title: bn ? "অরিজিনাল পণ্য" : "Genuine Products", sub: bn ? "যাচাই করে পাঠানো হয়" : "Checked before shipping" },
    { icon: "chat", title: bn ? "হোয়াটসঅ্যাপ সাপোর্ট" : "WhatsApp Support", sub: bn ? "যেকোনো সময় মেসেজ করুন" : "Message us anytime" }
  ];

  const shop = [
    { href: "#products", label: bn ? "সব পণ্য" : "All Products" },
    { href: "#flash-sale", label: bn ? "ফ্ল্যাশ সেল" : "Flash Sale" },
    { href: "#new-arrivals", label: bn ? "নতুন পণ্য" : "New Arrivals" },
    { href: "#pre-order", label: bn ? "প্রি-অর্ডার" : "Pre-Order" },
    { href: "#categories", label: bn ? "ক্যাটাগরি" : "Categories" }
  ];
  const help = [
    { href: "#about", label: bn ? "আমাদের কথা" : "About Us" },
    { href: "#free-delivery", label: bn ? "ডেলিভারি তথ্য" : "Delivery Info" },
    { href: `https://wa.me/${SHOP.whatsapp}`, label: bn ? "অর্ডার ট্র্যাক / সাপোর্ট" : "Order Support" }
  ];
  const contacts = [
    { href: `https://wa.me/${SHOP.whatsapp}`, Icon: WhatsApp, label: `+${SHOP.whatsapp}` },
    { href: "mailto:rimonstorebd@gmail.com", Icon: Mail, label: "rimonstorebd@gmail.com" },
    { href: "https://t.me/RimonGT", Icon: Telegram, label: "@RimonGT" },
    { href: "https://www.facebook.com/share/14s2d7iJ5wA/", Icon: Facebook, label: "Facebook" }
  ];

  const colTitle = "text-xs font-bold uppercase tracking-[0.18em] text-white";
  const link = "text-sm text-white/60 transition hover:text-emerald";

  return (
    <footer className="relative mt-12 bg-black px-4 pb-28 pt-12 text-white/70 md:pb-10">
      <div className="relative mx-auto max-w-7xl">
        {/* perks */}
        <div className="grid grid-cols-2 gap-3 border-b border-white/10 pb-10 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.title} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald/15 text-emerald">
                <Ico name={p.icon} className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-[13px] font-bold text-white">{p.title}</span>
                <span className="mt-0.5 block text-[11px] text-white/50">{p.sub}</span>
              </span>
            </div>
          ))}
        </div>

        {/* columns */}
        <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-white/5 p-2.5 ring-1 ring-white/10">
                <Logo size={36} showWordmark={false} />
              </span>
              <span className="text-2xl font-black tracking-tight text-gradient-brand">ShatUp</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">{t("tagline")}</p>
          </div>

          <div>
            <h4 className={colTitle}>{bn ? "শপ" : "Shop"}</h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {shop.map((l) => (
                <li key={l.label}><a href={l.href} className={link}>{l.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={colTitle}>{bn ? "সহায়তা" : "Support"}</h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {help.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className={link} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={colTitle}>{bn ? "যোগাযোগ" : "Contact"}</h4>
            <ul className="mt-4 flex flex-col gap-3">
              {contacts.map(({ href, Icon, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    target={href.startsWith("mailto") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-white/60 transition hover:text-emerald"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-emerald" /> {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* developer credit - wording unchanged */}
        <div className="relative mx-auto mt-10 w-fit">
          <SmokeWisps className="absolute -left-12 -right-12 bottom-[78%] h-40 w-[calc(100%+6rem)]" />
          <div className="lux-breathe relative flex w-fit items-center gap-2.5 rounded-full border border-[#FFC400]/30 bg-[#FFC400]/[0.06] px-5 py-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFC400]" />
            <div className="text-left leading-tight">
              <p className="text-sm font-bold text-white">✦ Developed by Rimon</p>
              <p className="text-[10px] font-medium text-white/50">Web Developer</p>
            </div>
          </div>
        </div>

        {/* payment + tracking */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            <span className="text-white/50">Pay with</span>
            {SHOP.bkash && <span className="rounded-full bg-[#E2136E] px-3 py-1 text-white">bKash</span>}
            {SHOP.nagad && <span className="rounded-full bg-[#F6921E] px-3 py-1 text-white">Nagad</span>}
            <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">WhatsApp confirm</span>
          </div>
          <a href="#track-order" className="text-xs font-semibold text-white/70 underline-offset-4 transition hover:text-emerald hover:underline">
            Track your order
          </a>
        </div>

        <div className="mt-6 flex items-center justify-center border-t border-white/10 pt-5">
          <div className="w-full max-w-xs">
            <SeasonPicker variant="dark" />
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5 text-center text-xs text-white/40">
          © {new Date().getFullYear()} ShatUp Shop. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
