"use client";

// small red pulsing LIVE tag
export default function LivePill({ label = "LIVE", className = "" }: { label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#17120E] shadow ${className}`}
    >
      <span className="live-dot" aria-hidden />
      {label}
    </span>
  );
}
