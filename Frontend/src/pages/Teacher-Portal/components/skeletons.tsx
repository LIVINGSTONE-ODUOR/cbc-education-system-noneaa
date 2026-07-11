import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

/**
 * Shared skeleton pieces for the Teacher Portal. Each one is shaped to match
 * the real content it stands in for, so the page never "jumps" once data
 * arrives — same dimensions, same layout, just skeleton blocks instead of text.
 */

/** A class-select dropdown that hasn't loaded yet. */
export const ClassSelectSkeleton: React.FC = () => (
  <Skeleton className="h-10 w-full md:w-[300px] rounded-md" />
);

/** Rows of students: avatar + two lines of text + a trailing action shape.
 *  Matches the "My Classes" / "Student Profiles" list rows. */
export const StudentRowsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center justify-between border rounded-md p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
    ))}
  </div>
);

/** Body-only skeleton for a real <Table>, so the real header (already known)
 *  stays visible while the rows are still loading. */
export const TableBodySkeleton: React.FC<{ columns: number; rows?: number }> = ({ columns, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <TableRow key={r}>
        {Array.from({ length: columns }).map((__, c) => (
          <TableCell key={c}>
            <Skeleton className="h-4 w-full max-w-[120px]" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

/** Generic bordered rows with two lines + a small trailing badge. Used for
 *  assignments, submissions, lesson plans, and other "list of cards" data. */
export const ListBlockSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="border rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full max-w-[70%]" />
      </div>
    ))}
  </div>
);

/** A row of small pill-shaped skeletons — matches exam/assessment chip lists. */
export const PillRowSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="flex flex-wrap gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-9 w-28 rounded-md" />
    ))}
  </div>
);

/** Profile header — avatar, name, role, id badge, then detail rows.
 *  `compact` shrinks it to fit the portal sidebar card. */
export const ProfileHeaderSkeleton: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className={compact ? 'px-4 pt-5 pb-6 flex flex-col items-center gap-2' : 'flex flex-col items-center py-6 gap-3'}>
    <Skeleton className={compact ? 'w-16 h-16 rounded-full' : 'w-24 h-24 rounded-full'} />
    <Skeleton className={compact ? 'h-4 w-28' : 'h-5 w-40'} />
    <Skeleton className={compact ? 'h-3 w-16' : 'h-4 w-24'} />
    <Skeleton className="h-5 w-20 rounded-full" />
  </div>
);

/** Key/value detail rows underneath a profile header. */
export const DetailRowsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-2.5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    ))}
  </div>
);

/** Learner attendance rows: avatar + name, then a row of status-button shapes. */
export const AttendanceRowsSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center justify-between border rounded-md p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

/** Full dashboard-home skeleton: stat card row + the 2x2 card grid below,
 *  shaped exactly like the real DashboardHome layout. */
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-4 text-center space-y-2">
          <Skeleton className="w-9 h-9 rounded-xl mx-auto" />
          <Skeleton className="h-5 w-10 mx-auto" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-lg" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-3 w-40" />
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
