import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentsPageSkeleton({ rowCount = 4 }: { rowCount?: number }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      {/* Search */}
      <div className="rounded-xl border bg-white p-6">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white">
            <div className="p-6 space-y-3 border-b">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="p-6">
              <Skeleton className="h-[180px] w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Ranking + table */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white md:col-span-1 xl:col-span-1 hidden" />
        <div className="rounded-xl border bg-white md:col-span-2 xl:col-span-2">
          <div className="p-6 space-y-3 border-b">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-52" />
          </div>
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white">
        <div className="p-6 border-b">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="p-6 space-y-3">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-3">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="mt-2 h-3 w-40" />
              </div>
              <div className="col-span-1">
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-3 w-32" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-3 w-32" />
              </div>
              <div className="col-span-1">
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
              <div className="col-span-1 flex justify-end">
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

