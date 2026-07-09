import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  variant?: "dashboard" | "list" | "form" | "details" | "performance";
};

export default function TeacherStaffManagementSkeleton({
  variant = "dashboard",
}: Props) {
  const common = (
    <div className="w-full space-y-6 pb-8 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-[420px] max-w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-56 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="relative rounded-xl border border-border/60 bg-card p-4 overflow-hidden"
          >
            <Skeleton className="absolute top-0 left-0 right-0 h-0.5" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-32 mt-3" />
            <Skeleton className="h-7 w-24 mt-2" />
            <Skeleton className="h-4 w-44 mt-2" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-44" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-card p-4"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-48 mt-3" />
              <Skeleton className="h-3 w-40 mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (variant === "dashboard") {
    return (
      <div className="w-full space-y-6 pb-8">
        {common}
        <div className="px-4 md:px-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-4">
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-4 w-64 mt-2" />
                  <Skeleton className="h-44 w-full mt-4 rounded-lg" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-4">
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-4 w-64 mt-2" />
                  <Skeleton className="h-44 w-full mt-4 rounded-lg" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-card p-4">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-64 mt-2" />
              <div className="space-y-3 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-full rounded-full" />
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card">
              <div className="p-4 border-b">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
              <div className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-6 w-20 ml-auto" />
                    <Skeleton className="h-8 w-8 rounded-md ml-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: use dashboard skeleton for other variants until dedicated ones are needed.
  return common;
}

