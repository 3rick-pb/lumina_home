import React from "react";

export default function ShopLoading() {
  return (
    <div className="min-h-screen pt-32 pb-24 bg-transparent relative animate-pulse">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        {/* Header Skeleton */}
        <div className="mb-8 sm:mb-12 space-y-3">
          <div className="h-9 sm:h-12 w-64 sm:w-80 bg-black/[0.06] dark:bg-white/10 rounded-2xl" />
          <div className="h-4 w-full max-w-xl bg-black/[0.04] dark:bg-white/[0.06] rounded-lg" />
          <div className="h-4 w-3/4 max-w-md bg-black/[0.04] dark:bg-white/[0.06] rounded-lg" />
        </div>

        {/* Category Pills Skeleton */}
        <div className="flex items-center gap-2 sm:gap-3 mb-8 sm:mb-10 overflow-x-auto pb-2 hide-scrollbar">
          {[18, 24, 28, 20, 24, 26, 22].map((w, idx) => (
            <div
              key={idx}
              className={`h-9 rounded-full bg-black/[0.05] dark:bg-white/[0.08] shrink-0`}
              style={{ width: `${w * 4}px` }}
            />
          ))}
        </div>

        {/* Products Grid Skeleton (8 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-black/[0.04] dark:border-white/10 bg-white/60 dark:bg-[#1c1c1f]/60 p-4 space-y-4 shadow-sm backdrop-blur-xl"
            >
              {/* Product Image Skeleton */}
              <div className="w-full aspect-[4/5] rounded-2xl bg-black/[0.05] dark:bg-white/[0.08] relative overflow-hidden">
                <div className="absolute top-3 left-3 w-20 h-5 rounded-full bg-black/[0.06] dark:bg-white/15" />
              </div>

              {/* Product Info Skeleton */}
              <div className="space-y-2 pt-1">
                <div className="h-3.5 w-20 bg-black/[0.04] dark:bg-white/[0.06] rounded-full" />
                <div className="h-5 w-3/4 bg-black/[0.07] dark:bg-white/10 rounded-lg" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-6 w-24 bg-black/[0.08] dark:bg-white/15 rounded-lg" />
                  <div className="h-9 w-9 rounded-full bg-black/[0.06] dark:bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
