"use client"

import { Heart } from "lucide-react"
import { useFavorites, useFavoriteIds } from "@/hooks/use-favorites"
import { ResourceGrid } from "@/components/resources/resource-grid"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import type { ResourceWithRelations } from "@/features/resources/resource-types"

export default function FavoritesPage() {
  const { data: resources, isPending, error } = useFavorites()
  const { data: favoriteIds = [] } = useFavoriteIds()

  const favoritedSet = new Set(favoriteIds)

  if (isPending) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">My Favorites</h1>
        <LoadingSkeleton variant="card" count={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">My Favorites</h1>
        <p className="text-destructive">
          Failed to load favorites. Please try again later.
        </p>
      </div>
    )
  }

  const typedResources = (resources ?? []) as unknown as ResourceWithRelations[]

  if (typedResources.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">My Favorites</h1>
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Start favoriting resources to build your personal collection."
          actionLabel="Browse Resources"
          onAction={() => {
            window.location.href = "/resources"
          }}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Favorites</h1>
        <span className="text-muted-foreground text-sm">
          {typedResources.length} resource
          {typedResources.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ResourceGrid
        resources={typedResources}
        viewMode="grid"
        favoritedIds={favoritedSet}
      />
    </div>
  )
}
