import { Skeleton } from "@/components/ui/skeleton";

interface GlobalSkeletonLoaderProps {
  fading?: boolean;
}

export default function GlobalSkeletonLoader({ fading = false }: GlobalSkeletonLoaderProps) {
  return (
    <div
      className="min-h-screen bg-background flex relative transition-opacity duration-1000"
      style={{ opacity: fading ? 0 : 1 }}
    >
      {/* Top animated loading bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-50 bg-primary/20 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{
            width: "45%",
            animation: "skeletonProgressBar 1.4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Visible loading badge */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-full shadow-2xl text-sm font-semibold tracking-wide select-none">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        Loading your workspace…
      </div>

      {/* Sidebar skeleton */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border p-4 gap-4 shrink-0">
        {/* Logo area */}
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>

        {/* Bottom user area */}
        <div className="mt-auto flex items-center gap-3 px-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border px-6 flex items-center justify-between shrink-0">
          <Skeleton className="h-6 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Page title */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-72" />
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          {/* Content area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Wide card */}
            <div className="lg:col-span-2 rounded-xl border border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Narrow card */}
            <div className="rounded-xl border border-border p-4 space-y-4">
              <Skeleton className="h-5 w-28" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
