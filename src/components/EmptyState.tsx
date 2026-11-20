"use client";

import Ico from "./Ico";

export default function EmptyState({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <div className="lux-float flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald/15 to-[#FFC400]/20 text-emerald ring-1 ring-white/70">
        <Ico name="bag" className="h-10 w-10" />
      </div>
      <h3 className="text-lg font-black tracking-tight text-[#17120E] dark:text-gray-100">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      {children}
    </div>
  );
}
