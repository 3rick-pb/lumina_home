import React from "react";

export default function ProductLoading() {
  return (
    <div className="min-h-screen pt-28 pb-20 bg-transparent animate-pulse">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-4 w-14 bg-black/[0.05] dark:bg-white/10 rounded-full" />
          <div className="h-4 w-3 bg-black/[0.04] dark:bg-white/[0.06] rounded-full" />
          <div className="h-4 w-20 bg-black/[0.05] dark:bg-white/10 rounded-full" />
          <div className="h-4 w-3 bg-black/[0.04] dark:bg-white/[0.06] rounded-full" />
          <div className="h-4 w-32 bg-black/[0.07] dark:bg-white/15 rounded-full" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          {/* Left Column: Gallery Skeleton */}
          <div className="lg:col-span-7 space-y-4">
            <div className="w-full aspect-[4/4.5] sm:aspect-[4/3.8] rounded-3xl bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/10" />
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="w-20 h-20 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/10 shrink-0"
                />
              ))}
            </div>
          </div>

          {/* Right Column: Details Skeleton */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-black/[0.05] dark:bg-white/10 rounded-full" />
              <div className="h-9 w-4/5 bg-black/[0.08] dark:bg-white/15 rounded-xl" />
              <div className="h-5 w-1/3 bg-black/[0.04] dark:bg-white/[0.08] rounded-md" />
            </div>

            <div className="h-10 w-36 bg-black/[0.09] dark:bg-white/20 rounded-xl" />

            <div className="h-px w-full bg-black/[0.06] dark:bg-white/10" />

            {/* Colors Skeleton */}
            <div className="space-y-3">
              <div className="h-4 w-20 bg-black/[0.05] dark:bg-white/10 rounded-md" />
              <div className="flex gap-2">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="w-8 h-8 rounded-full bg-black/[0.07] dark:bg-white/15" />
                ))}
              </div>
            </div>

            {/* Sizes Skeleton */}
            <div className="space-y-3">
              <div className="h-4 w-16 bg-black/[0.05] dark:bg-white/10 rounded-md" />
              <div className="flex gap-2">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="w-14 h-9 rounded-xl bg-black/[0.05] dark:bg-white/10" />
                ))}
              </div>
            </div>

            {/* CTA Buttons Skeleton */}
            <div className="space-y-3 pt-4">
              <div className="h-14 w-full rounded-2xl bg-black/[0.08] dark:bg-white/15" />
              <div className="h-12 w-full rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
            </div>

            {/* Trust Badges Skeleton */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="h-16 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] p-3" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
