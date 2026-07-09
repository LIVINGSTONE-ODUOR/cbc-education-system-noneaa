import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  rowCount?: number;
};

export default function PromotionsPageSkeleton({ rowCount = 6 }: Props) {
  const rows = Array.from({ length: rowCount });

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100/60 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-7 sm:px-8 sm:py-8 shadow-lg shadow-indigo-200/50">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 flex-shrink-0 rounded-2xl bg-white/15 ring-1 ring-white/25" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-72 bg-white/20" />
              <Skeleton className="h-4 w-[420px] max-w-full bg-white/15" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28 rounded-xl bg-white/20" />
            <Skeleton className="h-10 w-36 rounded-xl bg-white/70" />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200/80 bg-white shadow-sm p-4 overflow-hidden"
          >
            <Skeleton className="absolute" />
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36 bg-gray-200" />
                <Skeleton className="h-10 w-20 bg-gray-200" />
                <Skeleton className="h-4 w-32 bg-gray-200" />
              </div>
              <Skeleton className="h-10 w-10 rounded-xl bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200/80 shadow-sm bg-white">
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg bg-gray-200" />
              <Skeleton className="h-6 w-72 bg-gray-200" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-28 rounded-full bg-gray-200" />
              <Skeleton className="h-8 w-32 rounded-full bg-gray-200" />
            </div>
          </div>
          <Skeleton className="mt-3 h-5 w-[520px] max-w-full bg-gray-200" />

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Skeleton className="h-10 w-full bg-gray-200 rounded-xl" />
            </div>
            <Skeleton className="h-10 w-full bg-gray-200 rounded-xl" />
            <Skeleton className="h-10 w-full bg-gray-200 rounded-xl" />
            <Skeleton className="h-10 w-full bg-gray-200 rounded-xl" />
            <Skeleton className="h-10 w-full bg-gray-200 rounded-xl md:col-start-5" />
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-gray-200/80 shadow-sm bg-white">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg bg-gray-200" />
            <Skeleton className="h-6 w-72 bg-gray-200" />
          </div>
          <Skeleton className="mt-2 h-4 w-[560px] max-w-full bg-gray-200" />
        </div>

        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Table header skeleton */}
                <div className="bg-gray-50/80 border-b">
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs">
                    <Skeleton className="h-4 col-span-2 bg-gray-200" />
                    <Skeleton className="h-4 col-span-2 bg-gray-200" />
                    <Skeleton className="h-4 col-span-2 bg-gray-200" />
                    <Skeleton className="h-4 col-span-2 bg-gray-200" />
                    <Skeleton className="h-4 col-span-1 bg-gray-200" />
                    <Skeleton className="h-4 col-span-1 bg-gray-200" />
                    <Skeleton className="h-4 col-span-1 bg-gray-200" />
                    <Skeleton className="h-4 col-span-1 bg-gray-200" />
                  </div>
                </div>

                {/* Table body skeleton rows */}
                <div className="space-y-0">
                  {rows.map((_, r) => (
                    <div key={r} className="grid grid-cols-12 gap-2 px-4 py-4 border-b last:border-b-0 hover:bg-indigo-50/30">
                      {/* Batch */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-xl bg-gray-200" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-20 bg-gray-200" />
                            <Skeleton className="h-4 w-28 bg-gray-200" />
                          </div>
                        </div>
                      </div>
                      {/* Type */}
                      <div className="col-span-2 pt-2">
                        <Skeleton className="h-6 w-28 rounded-full bg-gray-200" />
                      </div>
                      {/* Academic year */}
                      <div className="col-span-2 pt-2">
                        <Skeleton className="h-5 w-36 bg-gray-200" />
                      </div>
                      {/* Grade & Stream */}
                      <div className="col-span-2 pt-2">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-44 bg-gray-200" />
                          <Skeleton className="h-4 w-32 bg-gray-200" />
                        </div>
                      </div>
                      {/* Effective */}
                      <div className="col-span-1 pt-2">
                        <Skeleton className="h-5 w-20 bg-gray-200" />
                      </div>
                      {/* Status */}
                      <div className="col-span-1 pt-2">
                        <Skeleton className="h-6 w-24 rounded-full bg-gray-200" />
                      </div>
                      {/* Progress */}
                      <div className="col-span-1 pt-2">
                        <Skeleton className="h-5 w-28 bg-gray-200" />
                        <div className="mt-2">
                          <Skeleton className="h-2 w-full bg-gray-200 rounded-full" />
                          <Skeleton className="mt-2 h-4 w-28 bg-gray-200" />
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="col-span-1 pt-2 flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg bg-gray-200" />
                        <Skeleton className="h-8 w-8 rounded-lg bg-gray-200" />
                        <Skeleton className="h-8 w-8 rounded-lg bg-gray-200" />
                        <Skeleton className="h-8 w-8 rounded-lg bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

