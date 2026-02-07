import { Skeleton } from "@/components/ui/skeleton"

export default function ResourceDetailLoading() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Title + URL + badge */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Metadata row: date + favorites */}
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Separator */}
      <Skeleton className="h-px w-full" />

      {/* Description block */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Tags section */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-16" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>

      {/* Category section */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Related resources card */}
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-md border p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
