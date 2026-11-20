// shimmering placeholder cards while products load
export default function ProductSkeletonGrid({ count = 10 }: { count?: number }) {
  const bar = "rounded-full bg-black/[0.06] dark:bg-white/10";
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[22px] bg-white shadow-lux ring-1 ring-black/[0.05] dark:bg-white/5 dark:ring-white/10"
        >
          <div className="aspect-square w-full animate-pulse bg-black/[0.05] dark:bg-white/10" />
          <div className="flex flex-col gap-2.5 p-3.5">
            <div className={`h-2.5 w-1/3 animate-pulse ${bar}`} />
            <div className={`h-3.5 w-full animate-pulse ${bar}`} />
            <div className={`h-3.5 w-2/3 animate-pulse ${bar}`} />
            <div className={`mt-1 h-5 w-1/2 animate-pulse ${bar}`} />
            <div className="mt-1 flex gap-2">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-black/[0.06] dark:bg-white/10" />
              <div className="h-10 flex-1 animate-pulse rounded-full bg-black/[0.06] dark:bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
