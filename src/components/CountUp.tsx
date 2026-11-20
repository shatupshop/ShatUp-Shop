"use client";

import { useEffect, useRef, useState } from "react";

// Number that counts up when it appears. Shows the final value straight away if the
// phone asks for reduced motion, and never leaves a wrong number behind.
export default function CountUp({
  value,
  duration = 900,
  prefix = "",
  className
}: {
  value: number;
  duration?: number;
  prefix?: string;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !Number.isFinite(value)) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const base = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(base + (value - base) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {shown.toLocaleString("en-BD")}
    </span>
  );
}
