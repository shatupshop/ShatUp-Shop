"use client";

import { useStore } from "@/context/StoreContext";
import FadeUp from "./FadeUp";
import { ShieldCheck, RotateCcw, BadgeCheck } from "./icons";

export default function About() {
  const { t } = useStore();

  const promises = [
    { Icon: BadgeCheck, title: t("promise1Title"), text: t("promise1Text") },
    { Icon: ShieldCheck, title: t("promise2Title"), text: t("promise2Text") },
    { Icon: RotateCcw, title: t("promise3Title"), text: t("promise3Text") }
  ];

  return (
    <FadeUp>
      <section id="about" className="mx-auto max-w-7xl scroll-mt-20 px-3 py-12 sm:px-4">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#17120E] to-[#2b1a0e] p-8 text-center shadow-lux ring-1 ring-[#FFC400]/25 sm:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-emerald/30 blur-3xl" />
          <h2 className="relative text-2xl font-black tracking-tight text-white sm:text-3xl">{t("about")}</h2>
          <span className="relative mx-auto mt-3 block h-1 w-10 rounded-full bg-gradient-to-r from-emerald to-[#FFC400]" />
          <p className="relative mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            {t("aboutText")}
          </p>
        </div>

        {/* the promise panel: why prices are low, and what happens if
            something's wrong — orange / white / black, no gold */}
        <div className="mx-auto mt-6 max-w-4xl">
          <div className="text-center">
            <h3 className="text-xl font-extrabold tracking-tight text-[#17120E] dark:text-white sm:text-2xl">
              {t("promiseTitle")}
            </h3>
            <p className="mx-auto mt-1 max-w-xl text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              {t("promiseSubtitle")}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {promises.map(({ Icon, title, text }, i) => (
              <div
                key={i}
                className="card-lux group rounded-[22px] bg-white p-6 text-center shadow-lux ring-1 ring-black/[0.05] dark:bg-white/5 dark:ring-white/10"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17120E] text-[#F5D77A] shadow-lg transition group-hover:bg-emerald group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-black dark:text-white">{title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </FadeUp>
  );
}
