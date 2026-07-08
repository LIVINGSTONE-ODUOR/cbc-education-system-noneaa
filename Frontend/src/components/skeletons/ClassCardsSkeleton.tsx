import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export type ClassCardsSkeletonMode = "grid" | "list";

type Props = {
  mode?: ClassCardsSkeletonMode;
  rowCount?: number;
};

export default function ClassCardsSkeleton({
  mode = "grid",
  rowCount = 8,
}: Props) {
  const cards = Array.from({ length: Math.max(1, rowCount) });

  if (mode === "list") {
    return (
      <div className="space-y-3">
        {cards.map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-2 h-4 w-64" />
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 p-5"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-5/6" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

