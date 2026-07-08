import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  /** Rough page layout to match the component being loaded */
  variant?: "dashboard" | "table" | "profile";
};

export default function ProtectedPageSkeleton({ variant = "table" }: Props) {
  return (
    <div className="min-h-[60vh] w-full">
      {variant === "dashboard" && (
        <div className="space-y-6 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-28" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-72 w-full rounded-lg" />
              <Skeleton className="h-56 w-full rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-72 w-full rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {variant === "profile" && (
        <div className="space-y-6 p-4 md:p-6">
          <Skeleton className="h-28 w-full rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-56 w-full rounded-lg" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      )}

      {variant === "table" && (
        <div className="space-y-6 p-4 md:p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-64" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-36" />
              </div>
            </div>

            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-14 rounded-md" />
                  <Skeleton className="h-10 w-2/5 rounded-md" />
                  <Skeleton className="h-10 w-1/6 rounded-md" />
                  <Skeleton className="h-10 w-1/6 rounded-md" />
                  <Skeleton className="h-10 w-1/6 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

