import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  termCount?: number;
  gradePerTerm?: number;
  examPerGrade?: number;
};

export default function ExamGroupsPageSkeleton({
  termCount = 2,
  gradePerTerm = 2,
  examPerGrade = 3,
}: Props) {
  const terms = Array.from({ length: termCount });

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl bg-indigo-200" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 shadow-sm bg-white">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Skeleton className="h-10 md:col-span-2 rounded-xl" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Grouped view */}
      <div className="rounded-2xl border border-gray-200 shadow-sm bg-white">
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="space-y-6">
            {terms.map((_, ti) => (
              <div key={ti} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-xl bg-indigo-200" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-72" />
                      <Skeleton className="h-4 w-44" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-56 rounded-full" />
                </div>

                {Array.from({ length: gradePerTerm }).map((__, gi) => (
                  <div key={gi} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-56" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>

                    <div className="overflow-x-auto">
                      <div className="space-y-2">
                        {/* table header */}
                        <div className="grid grid-cols-7 gap-2">
                          {Array.from({ length: 7 }).map((_, ci) => (
                            <Skeleton key={ci} className="h-4 rounded bg-gray-100" />
                          ))}
                        </div>

                        {/* table rows */}
                        <div className="space-y-2">
                          {Array.from({ length: examPerGrade }).map((_, ei) => (
                            <div key={ei} className="grid grid-cols-7 gap-2 items-center">
                              <Skeleton className="h-5 rounded col-span-1" />
                              <Skeleton className="h-6 rounded-full col-span-1" />
                              <Skeleton className="h-5 rounded col-span-1" />
                              <Skeleton className="h-5 rounded col-span-1" />
                              <Skeleton className="h-5 rounded col-span-1" />
                              <Skeleton className="h-6 rounded-full col-span-1" />
                              <div className="flex items-center justify-end gap-2 col-span-1">
                                {Array.from({ length: 3 }).map((__, ai) => (
                                  <Skeleton key={ai} className="h-8 w-8 rounded-lg" />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

