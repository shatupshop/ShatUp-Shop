"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Banner } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { ChevronLeft, ChevronRight, Balloon, ShoppingBag } from "./icons";
import Ico from "./Ico";

const AUTOPLAY_MS = 5000;

export default function BannerCarousel() {
  const { t } = useStore();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data) setBanners(data as Banner[]);
      setLoading(false);
    }
    load();
  }, []);

  const slideCount = banners.length > 0 ? banners.length : 1;

  useEffect(() => {
    if (slideCount <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slideCount);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slideCount]);

  function resetAutoplay() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slideCount <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slideCount);
    }, AUTOPLAY_MS);
  }

  function goTo(i: number) {
    setIndex((i + slideCount) % slideCount);
    resetAutoplay();
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) goTo(index + 1);
      else goTo(index - 1);
    }
    touchStartX.current = null;
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-4">
        <div className="h-56 w-full animate-pulse rounded-[28px] bg-black/[0.05] dark:bg-white/5 sm:h-72 md:h-80" />
      </div>
    );
  }

  return (
    <section
      id="top"
      className="relative mx-auto w-full max-w-7xl px-3 pt-3 sm:px-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-56 w-full overflow-hidden rounded-[28px] shadow-lux ring-1 ring-black/5 sm:h-72 md:h-80">
        {banners.length === 0 ? (
          <DefaultSlide tagline={t("tagline")} />
        ) : (
          banners.map((b, i) => (
            <div
              key={b.id}
              className={`absolute inset-0 overflow-hidden transition-opacity duration-[900ms] ease-in-out ${
                i === index ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {b.media_type === "video" ? (
                <video
                  src={b.image_url}
                  className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                    i === index ? "scale-110" : "scale-100"
                  }`}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.image_url}
                  alt={b.title || "ShatUp Shop"}
                  className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                    i === index ? "scale-110" : "scale-100"
                  }`}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent sm:bg-gradient-to-r sm:from-black/65 sm:via-black/20 sm:to-transparent" />
              {(b.title || b.subtitle || b.button_text) && (
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-end gap-2 px-6 pb-9 text-center text-white transition-all duration-700 ease-out sm:items-start sm:justify-center sm:px-14 sm:pb-0 sm:text-left ${
                    i === index ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                  }`}
                >
                  {b.title && (
                    <h2 className="max-w-xl text-2xl font-black leading-tight tracking-tight drop-shadow-lg sm:text-5xl">
                      {b.title}
                    </h2>
                  )}
                  {b.subtitle && (
                    <p className="max-w-md text-sm font-medium text-white/85 sm:text-lg">
                      {b.subtitle}
                    </p>
                  )}
                  {b.button_text && (
                    <a
                      href={b.button_link || "#products"}
                      className="btn-brand sheen mt-2 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold text-white sm:text-sm"
                    >
                      {b.button_text}
                      <span aria-hidden><Ico name="arrowRight" className="h-4 w-4" /></span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* prev / next controls */}
        {slideCount > 1 && (
          <>
            <button
              aria-label="previous slide"
              onClick={() => goTo(index - 1)}
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/40 sm:left-4 sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              aria-label="next slide"
              onClick={() => goTo(index + 1)}
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/40 sm:right-4 sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* dots */}
            <div className="absolute bottom-3.5 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur">
              {banners.map((_, i) => (
                <button
                  key={i}
                  aria-label={`go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`relative h-1.5 overflow-hidden rounded-full bg-white/50 transition-all duration-300 ${
                    i === index ? "w-9" : "w-1.5"
                  }`}
                >
                  {i === index && (
                    <span
                      key={index}
                      className="absolute inset-y-0 left-0 rounded-full bg-white"
                      style={{ animation: `luxProgress ${AUTOPLAY_MS}ms linear forwards` }}
                    />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function DefaultSlide({ tagline }: { tagline: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-emerald via-emerald-dark to-black text-center text-white">
      <div className="float-slow pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
      <div className="float-slow-delayed pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

      {/* balloons + shopping bags drifting in the open space around the copy */}
      <Balloon
        className="balloon-drift pointer-events-none absolute left-[8%] top-[14%] h-7 w-7 text-white/25 sm:h-9 sm:w-9"
      />
      <Balloon
        className="balloon-drift pointer-events-none absolute right-[10%] top-[10%] h-6 w-6 text-white/35 sm:h-8 sm:w-8"
        style={{ animationDelay: "2s" }}
      />
      <ShoppingBag
        className="bag-sway pointer-events-none absolute left-[12%] bottom-[16%] h-6 w-6 text-white/20 sm:h-8 sm:w-8"
        style={{ animationDelay: "1s" }}
      />
      <ShoppingBag
        className="bag-sway pointer-events-none absolute right-[9%] bottom-[20%] h-7 w-7 text-white/25 sm:h-9 sm:w-9"
        style={{ animationDelay: "3s" }}
      />

      <div className="relative mx-auto max-w-2xl px-6">
        <span className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 text-xs font-semibold tracking-wide backdrop-blur">
          বাংলাদেশের বিশ্বস্ত অনলাইন স্টোর
        </span>
        <h1 className="text-2xl font-extrabold leading-tight sm:text-4xl">ShatUp</h1>
        <p className="mt-2 text-sm font-medium text-white/90 sm:text-base">{tagline}</p>
        <a
          href="#products"
          className="animate-glowPulse mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-xs font-bold text-emerald shadow-premium sm:text-sm"
        >
          Shop Now
        </a>
      </div>
    </div>
  );
}
