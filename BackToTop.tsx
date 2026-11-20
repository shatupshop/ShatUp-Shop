"use client";

import { useEffect, useRef, useState } from "react";

// Floating "back to top" with a ring that fills as you scroll down the page.
export default function BackToTop() {
  const [show, setShow] = useState(false);
  const ringRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    function update() {
      raf = 0;
      const y = window.scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, y / max);
      ringRef.current?.style.setProperty("--p", `${Math.round(p * 360)}deg`);
      setShow(y > 700);
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <button
      aria-label="back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-[calc(env(safe-area-inset-bottom)+92px)] right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-[0_14px_30px_-10px_rgba(23,18,14,0.5)] transition-all duration-300 md:bottom-8 md:right-8 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <span
        ref={ringRef}
        className="absolute inset-0 rounded-full"
        style={{ background: "conic-gradient(#FF5A0A var(--p, 0deg), rgba(23,18,14,0.12) 0)" }}
      />
      <span className="glass absolute inset-[3px] flex items-center justify-center rounded-full text-[#17120E] dark:text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="m6 14 6-6 6 6" />
        </svg>
      </span>
    </button>
  );
}
