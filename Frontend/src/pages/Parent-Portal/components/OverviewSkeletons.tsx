import { Skeleton } from "@/components/ui/skeleton";

// Shared row shape used by the four "list of items" cards (assignments,
// exams, messages, announcements, comments, timetable, events) — each real
// row is: a couple of text lines on the left, an optional badge on the
// right. Reused with small prop tweaks so every skeleton lines up with
// what actually renders once data arrives.
function ListRowSkeleton({ lines = 2, withBadge = true }: { lines?: number; withBadge?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2 border-t pt-2 first:border-t-0 first:pt-0">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        {lines > 1 && <Skeleton className="h-3 w-1/2" />}
      </div>
      {withBadge && <Skeleton className="h-4 w-14 shrink-0 rounded-full" />}
    </div>
  );
}

// 1. Attendance summary — big rate + days fraction, progress bar,
// 4 status badges, then a short "Recent" list of date + status badges.
export function AttendanceSummarySkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="pt-2 border-t space-y-1.5">
        <Skeleton className="h-3 w-12" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Latest average — big percentage, grade line, position line.
export function LatestAverageSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-16" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-8" />
      </div>
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// 3. Assignments due — big count + "outstanding" label, then up to 4 rows.
export function AssignmentsDueSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-6 w-8" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// 4. Upcoming exams — up to 3 rows, no headline number.
export function UpcomingExamsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

// 6. Unread messages — up to 4 rows (subject + sender).
export function UnreadMessagesSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <ListRowSkeleton key={i} withBadge={false} />
      ))}
    </div>
  );
}

// 7. Latest announcements — up to 4 rows (title + body, no badge).
export function LatestAnnouncementsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-t pt-2 first:border-t-0 first:pt-0 space-y-1.5">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// 8. Teacher comments — up to 4 rows (comment + teacher name, no badge).
export function TeacherCommentsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-t pt-2 first:border-t-0 first:pt-0 space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// 9. Today's timetable — up to 5 rows (lesson + teacher/room, time badge).
export function TodaysTimetableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

// 10. School events — up to 4 rows (title + location, date badge).
export function SchoolEventsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

// Child Profile tab — a 7-field icon + label + value grid.
export function ChildProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={`flex items-start gap-3 ${i === 6 ? 'sm:col-span-2' : ''}`}>
          <Skeleton className="h-5 w-5 rounded shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
