"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isPromoLive, Product, PromoSlide } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { ChevronLeft, ChevronRight } from "./icons";

const AUTOPLAY_MS = 4000;
const SLIDE_MS = 450;

// only allow safe link targets (blocks javascript: etc.)
function safeHref(v?: string | null): string {
  const s = (v || "").trim();
  if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(s)) return s;
  return "#products";
}

export default function PromoSlider({
  onSelectCategory
}: {
  onSelectCategory?: (category: string) => void;
}) {
  const { setActiveProduct } = useStore();
  const [all, setAll] = useState<PromoSlide[]>([]);
  const [now, setNow] = useState(0);

  // position: 0..n-1 real slides, n = clone of slide 0 (for seamless forward loop)
  const [pos, setPos] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState<string[]>([]); // ids whose image failed to load

  const viewportRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const pendingPrev = useRef(false);

  // load once
  useEffect(() => {
    setNow(Date.now());
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    if (!isSupabaseConfigured) return;
    supabase
      .from("promo_banners")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setAll(data as PromoSlide[]);
      });
  }, []);

  // re-check dates every minute so expired / newly-started banners switch automatically
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const slides = useMemo(
    () => all.filter((b) => isPromoLive(b, now || Date.now()) && !failed.includes(b.id)),
    [all, now, failed]
  );
  const n = slides.length;

  // if the slide list shrinks (a banner expired), start from a valid position
  useEffect(() => {
    setPos(0);
    setAnimate(true);
  }, [n]);

  // after an instant jump (loop reset / wrap-back), re-enable animation on the next frames
  useEffect(() => {
    if (animate) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        setAnimate(true);
        if (pendingPrev.current) {
          pendingPrev.current = false;
          setPos(n - 1);
        }
      });
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [animate, n]);

  function next() {
    if (n <= 1 || !animate || pos >= n) return;
    setPos(pos + 1);
  }
  function prev() {
    if (n <= 1 || !animate || pos >= n) return;
    if (pos === 0) {
      pendingPrev.current = true;
      setAnimate(false);
      setPos(n);
    } else {
      setPos(pos - 1);
    }
  }
  function goTo(i: number) {
    if (n <= 1 || !animate) return;
    setPos(i);
  }

  function handleTransitionEnd(e: React.TransitionEvent) {
    if (e.target !== e.currentTarget) return;
    if (pos === n && n > 1) {
      setAnimate(false);
      setPos(0);
    }
  }

  // autoplay (pauses on hover/drag, hidden tab, or reduced-motion)
  useEffect(() => {
    if (n <= 1 || hover || dragging || reduced) return;
    const id = setTimeout(() => {
      if (!document.hidden) next();
    }, AUTOPLAY_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, n, hover, dragging, reduced, animate]);

  // swipe / drag (touch + mouse) — vertical scrolling stays native via touch-action: pan-y
  function onPointerDown(e: React.PointerEvent) {
    if (n <= 1 || (e.pointerType === "mouse" && e.button !== 0)) return;
    start.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!start.current) return;
    let dx = e.clientX - start.current.x;
    if (Math.abs(dx) > 6) {
      moved.current = true;
      if (!dragging) setDragging(true);
    }
    if (!moved.current) return;
    if (pos === 0 && dx > 0) dx *= 0.3; // gentle resistance at the first slide
    setDragX(dx);
  }
  function endDrag(e: React.PointerEvent) {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const width = viewportRef.current?.offsetWidth || 320;
    start.current = null;
    setDragging(false);
    setDragX(0);
    if (moved.current && Math.abs(dx) > Math.max(40, width * 0.12)) {
      if (dx < 0) next();
      else prev();
    }
  }
  function cancelDrag() {
    start.current = null;
    setDragging(false);
    setDragX(0);
  }

  async function handleClick(e: React.MouseEvent, b: PromoSlide) {
    if (moved.current) {
      // that was a swipe, not a tap
      e.preventDefault();
      moved.current = false;
      return;
    }
    if (b.link_type === "category" && b.link_value) {
      e.preventDefault();
      onSelectCategory?.(b.link_value);
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    } else if (b.link_type === "product" && b.link_value) {
      e.preventDefault();
      const { data } = await supabase.from("products").select("*").eq("id", b.link_value).maybeSingle();
      if (data) setActiveProduct(data as Product);
      else document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  if (n === 0) return null;

  const track = n > 1 ? [...slides, slides[0]] : slides;
  const active = pos % n;

  return (
    <section aria-label="Promotions" className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-4">
      <div
        ref={viewportRef}
        className="group relative aspect-[16/5] w-full touch-pan-y select-none overflow-hidden rounded-2xl bg-black/[0.04] shadow-lux ring-1 ring-black/5 dark:bg-white/5 md:aspect-[7/1]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
        onPointerLeave={(e) => {
          if (start.current) endDrag(e);
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div
          className="flex h-full w-full will-change-transform"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translate3d(calc(${-pos * 100}% + ${dragX}px), 0, 0)`,
            transition: animate && !dragging && !reduced ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)` : "none"
          }}
        >
          {track.map((b, i) => {
            const isClone = n > 1 && i === n;
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.image_url}
                alt={isClone ? "" : b.title || "ShatUp offer"}
                draggable={false}
                loading={i <= 1 ? "eager" : "lazy"}
                decoding="async"
                onError={() => setFailed((f) => (f.includes(b.id) ? f : [...f, b.id]))}
                className="h-full w-full object-cover"
              />
            );
            const cls = "block h-full w-full shrink-0 grow-0 basis-full";
            return b.link_type === "none" ? (
              <div key={`${b.id}-${i}`} className={cls} aria-hidden={isClone}>
                {img}
              </div>
            ) : (
              <a
                key={`${b.id}-${i}`}
                href={b.link_type === "url" ? safeHref(b.link_value) : "#products"}
                target={b.link_type === "url" && /^https?:/i.test(b.link_value || "") ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={(e) => handleClick(e, b)}
                draggable={false}
                aria-hidden={isClone}
                tabIndex={isClone ? -1 : 0}
                className={cls}
              >
                {img}
              </a>
            );
          })}
        </div>

        {n > 1 && (
          <>
            {/* desktop arrows (mobile uses swipe) */}
            <button
              aria-label="previous promotion"
              onClick={prev}
              className="absolute left-2 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="next promotion"
              onClick={next}
              className="absolute right-2 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 md:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* pagination dots */}
            <div className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 items-center">
              {slides.map((b, i) => (
                <button
                  key={b.id}
                  aria-label={`go to promotion ${i + 1}`}
                  aria-current={i === active}
                  onClick={() => goTo(i)}
                  className="p-1"
                >
                  <span
                    className={`relative block h-1.5 overflow-hidden rounded-full bg-white/55 shadow transition-all duration-300 ${
                      i === active ? "w-6" : "w-1.5"
                    }`}
                  >
                    {i === active && (
                      <span
                        key={`${pos}-${hover}-${dragging}`}
                        className="absolute inset-y-0 left-0 rounded-full bg-white"
                        style={
                          hover || dragging || reduced
                            ? { width: "100%" }
                            : { animation: `luxProgress ${AUTOPLAY_MS}ms linear forwards` }
                        }
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
