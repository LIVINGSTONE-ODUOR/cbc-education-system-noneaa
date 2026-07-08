import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  rowCount?: number;
  /** approximate columns count */
  columnCount?: number;
  /** optional heading skeleton */
  showHeading?: boolean;
};

export default function ProtectedTableSkeleton({
  rowCount = 8,
  columnCount = 6,
  showHeading = true,
}: Props) {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {showHeading && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex flex-col gap-2">
          {Array.from({ length: Math.max(1, columnCount) }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: rowCount }).map((_, r) => (
            <div key={r} className="flex items-center gap-3">
              <Skeleton className="h-10 w-14 rounded-md" />
              <Skeleton className="h-10 w-2/4 rounded-md" />
              <Skeleton className="h-10 w-1/6 rounded-md" />
              {Array.from({ length: Math.max(0, columnCount - 3) }).map((__, c) => (
                <Skeleton key={c} className="h-10 w-1/6 rounded-md" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

