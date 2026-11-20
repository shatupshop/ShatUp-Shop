"use client";

import { useStore } from "@/context/StoreContext";
import FadeUp from "./FadeUp";
import Ico, { IcoName } from "./Ico";

export default function QuickAccess({ hasPreorder = false }: { hasPreorder?: boolean }) {
  const { lang, setWishlistOpen } = useStore();

  const items: {
    icon: IcoName;
    label: string;
    href?: string;
    onClick?: () => void;
    external?: boolean;
  }[] = [
    { icon: "bolt", label: lang === "bn" ? "ফ্ল্যাশ সেল" : "Flash Sale", href: "#flash-sale" },
    { icon: "sparkle", label: lang === "bn" ? "নতুন পণ্য" : "New Arrivals", href: "#new-arrivals" },
    { icon: "heart", label: lang === "bn" ? "উইশলিস্ট" : "Wishlist", onClick: () => setWishlistOpen(true) },
    ...(hasPreorder ? [{ icon: "clock" as IcoName, label: lang === "bn" ? "প্রি-অর্ডার" : "Pre-Order", href: "#pre-order" }] : []),
    { icon: "truck", label: lang === "bn" ? "ফ্রি ডেলিভারি" : "Free Delivery", href: "#free-delivery" },
    { icon: "grid", label: lang === "bn" ? "সব পণ্য" : "All Products", href: "#products" },
    { icon: "chat", label: lang === "bn" ? "সরাসরি চ্যাট" : "Chat With Us", href: "https://wa.me/8801868561887", external: true }
  ];

  const inner = (item: (typeof items)[number]) => (
    <>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald ring-1 ring-black/[0.07] transition duration-300 group-hover:bg-emerald group-hover:text-white group-hover:ring-emerald dark:bg-white/5 dark:ring-white/10 sm:h-16 sm:w-16">
        <Ico name={item.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
      </span>
      <span className="whitespace-nowrap text-[11px] font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
    </>
  );
  const cls = "group flex min-w-[76px] shrink-0 flex-col items-center gap-2 active:scale-95 transition-transform";

  return (
    <FadeUp>
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
        <div className="no-scrollbar flex justify-between gap-3 overflow-x-auto scroll-smooth px-1 pb-1 sm:justify-center sm:gap-10">
          {items.map((item, i) =>
            item.onClick ? (
              <button key={i} onClick={item.onClick} className={cls}>
                {inner(item)}
              </button>
            ) : (
              <a
                key={i}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className={cls}
              >
                {inner(item)}
              </a>
            )
          )}
        </div>
      </section>
    </FadeUp>
  );
}
