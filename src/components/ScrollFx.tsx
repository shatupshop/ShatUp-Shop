"use client";

import { useEffect } from "react";

// Publishes the scroll position as a CSS variable (--sy) so background layers
// can drift at different speeds (parallax). Nothing renders.
export default function ScrollFx() {
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    let raf = 0;
    const update = () => {
      raf = 0;
      root.style.setProperty("--sy", String(Math.round(window.scrollY)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty("--sy");
    };
  }, []);
  return null;
}
