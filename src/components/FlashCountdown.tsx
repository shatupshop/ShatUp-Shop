"use client";

import { useEffect, useState } from "react";

function getTimeLeft() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // next midnight, local time
  const diff = Math.max(0, midnight.getTime() - now.getTime());

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Designed to sit on the dark flash-sale panel.
export default function FlashCountdown() {
  const [time, setTime] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    setTime(getTimeLeft());
    const interval = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-center gap-1.5" aria-label="time left">
      {[time.hours, time.minutes, time.seconds].map((unit, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="flex h-8 min-w-[34px] items-center justify-center rounded-lg bg-gradient-to-b from-[#F5D77A] to-[#FFC400] px-1.5 text-sm font-black tabular-nums text-[#17120E] shadow-[0_6px_14px_-6px_rgba(212,175,55,0.8)]">
            {pad(unit)}
          </span>
          {i < 2 && <span className="text-sm font-black text-[#FFC400]">:</span>}
        </span>
      ))}
    </div>
  );
}
