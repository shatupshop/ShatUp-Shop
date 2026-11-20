"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Product, ProductMedia } from "@/lib/types";
import { ChevronLeft, ChevronRight, Play } from "./icons";

type Item = { url: string; type: "image" | "video" };

// Swipeable gallery (images + videos) for the product modal.
// Falls back to the product's single image_url when it has no gallery rows yet.
export default function ProductGallery({
  product,
  alt,
  soldOut,
  soldOutLabel
}: {
  product: Product;
  alt: string;
  soldOut: boolean;
  soldOutLabel: string;
}) {
  const fallback: Item[] = product.image_url ? [{ url: product.image_url, type: "image" }] : [];
  const [items, setItems] = useState<Item[]>(fallback);
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);
  const moved = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    setItems(fallback);
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    supabase
      .from("product_media")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (cancelled || !data || data.length === 0) return;
        setItems((data as ProductMedia[]).map((m) => ({ url: m.url, type: m.media_type })));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const n = items.length;
  const go = (i: number) => setIndex(Math.max(0, Math.min(n - 1, i)));

  function down(e: React.PointerEvent) {
    if (n <= 1 || (e.pointerType === "mouse" && e.button !== 0)) return;
    // let the native video controls (bottom strip of a video) work without starting a swipe
    if ((e.target as HTMLElement).tagName === "VIDEO") {
      const r = (e.target as HTMLElement).getBoundingClientRect();
      if (e.clientY > r.bottom - 48) return;
    }
    start.current = e.clientX;
    moved.current = false;
  }
  function move(e: React.PointerEvent) {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    if (Math.abs(dx) > 6) {
      moved.current = true;
      setDragging(true);
    }
    if (!moved.current) return;
    const atEdge = (index === 0 && dx > 0) || (index === n - 1 && dx < 0);
    setDragX(atEdge ? dx * 0.3 : dx);
  }
  function end(e: React.PointerEvent) {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    const w = boxRef.current?.offsetWidth || 300;
    start.current = null;
    setDragging(false);
    setDragX(0);
    if (moved.current && Math.abs(dx) > Math.max(40, w * 0.15)) go(index + (dx < 0 ? 1 : -1));
  }

  return (
    <div className="flex w-full shrink-0 flex-col bg-gray-100 dark:bg-white/10 sm:w-1/2">
     <div className="relative aspect-square w-full">
      <div
        ref={boxRef}
        className="relative h-full w-full touch-pan-y select-none overflow-hidden"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={() => {
          start.current = null;
          setDragging(false);
          setDragX(0);
        }}
      >
        {n === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-gray-300">No Image</div>
        ) : (
          <div
            className="flex h-full w-full will-change-transform"
            style={{
              transform: `translate3d(calc(${-index * 100}% + ${dragX}px), 0, 0)`,
              transition: dragging ? "none" : "transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1)"
            }}
          >
            {items.map((m, i) => (
              <div key={`${m.url}-${i}`} className="relative h-full w-full shrink-0 grow-0 basis-full bg-black/5">
                {m.type === "video" ? (
                  i === index ? (
                    <video
                      src={m.url}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full bg-black object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black text-white/80"><Play className="h-10 w-10" filled /></div>
                  )
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={alt}
                    draggable={false}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className={`h-full w-full object-cover ${soldOut ? "grayscale" : ""}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {soldOut && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="-rotate-6 rounded-full border-2 border-white bg-black/60 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-white">
              {soldOutLabel}
            </span>
          </div>
        )}

        {n > 1 && (
          <>
            <button
              aria-label="previous media"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur disabled:opacity-30 sm:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="next media"
              onClick={() => go(index + 1)}
              disabled={index === n - 1}
              className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur disabled:opacity-30 sm:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {n > 1 && (
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          {index + 1} / {n}
        </span>
      )}
     </div>

      {/* thumbnails live BELOW the media so they never cover a video's play / seek controls */}
      {n > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto bg-white px-3 py-2.5 dark:bg-gray-900">
          {items.map((m, i) => (
            <button
              key={`t-${m.url}-${i}`}
              type="button"
              aria-label={`show ${m.type} ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-black/10 transition ${
                i === index ? "border-emerald shadow-md" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {m.type === "video" ? (
                <>
                  <video src={`${m.url}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white"><Play className="h-3 w-3" filled /></span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" draggable={false} loading="lazy" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
