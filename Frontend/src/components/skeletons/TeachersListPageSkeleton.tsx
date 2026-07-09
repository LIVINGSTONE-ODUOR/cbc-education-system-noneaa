import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeachersListPageSkeleton({ rowCount = 8 }: { rowCount?: number }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-[260px]" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      {/* Search */}
      <div className="rounded-xl border bg-white p-6">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-white">
        <div className="p-6 border-b">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="mt-2 h-4 w-52" />
        </div>
        <div className="p-6 space-y-3">
          {/* rows */}
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="col-span-3">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="mt-2 h-4 w-48" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-4 w-24" />
              </div>
              <div className="col-span-1">
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
              <div className="col-span-1 flex justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

