import { Skeleton } from "@/components/ui/skeleton"

export default function ResourcesLoading() {
  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
      {/* Title bar + view toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Result count + sort */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* 6-card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
