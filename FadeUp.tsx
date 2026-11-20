"use client";

import React, { useEffect, useRef, useState } from "react";

// Scroll reveal: content eases up and un-blurs as it enters the screen.
// `soft` = lighter version (no blur) for lots of small cards.
export default function FadeUp({
  children,
  className = "",
  delay = 0,
  soft = false
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  soft?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={visible && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`${soft ? "reveal-soft" : "reveal"} ${visible ? "reveal-in" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
