"use client"

import { Skeleton } from "@/components/ui/skeleton"

export type SkeletonVariant = "card" | "list" | "compact"

export interface LoadingSkeletonProps {
  variant?: SkeletonVariant
  count?: number
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border p-6">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="size-4 shrink-0" />
      </div>
      <Skeleton className="h-5 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-10" />
        <div className="flex gap-1">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border px-6 py-3">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="size-4" />
      </div>
    </div>
  )
}

function CompactSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="size-4" />
    </div>
  )
}

const VARIANT_MAP: Record<SkeletonVariant, () => React.JSX.Element> = {
  card: CardSkeleton,
  list: ListSkeleton,
  compact: CompactSkeleton,
}

export function LoadingSkeleton({
  variant = "card",
  count = 6,
}: LoadingSkeletonProps) {
  const SkeletonComponent = VARIANT_MAP[variant]

  if (variant === "card") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonComponent key={i} />
        ))}
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className="divide-border divide-y rounded-md border">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonComponent key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  )
}
