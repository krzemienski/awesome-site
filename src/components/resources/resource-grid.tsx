"use client"

import { ResourceCard } from "./resource-card"
import { ResourceListItem } from "./resource-list-item"
import { ResourceCompactItem } from "./resource-compact-item"
import type { ResourceWithRelations } from "@/features/resources/resource-types"

export type ViewMode = "grid" | "list" | "compact"

export interface ResourceGridProps {
  resources: ResourceWithRelations[]
  viewMode: ViewMode
  favoritedIds?: Set<number>
  bookmarkedIds?: Set<number>
  onFavorite?: (resourceId: number) => void
  onBookmark?: (resourceId: number) => void
}

export function ResourceGrid({
  resources,
  viewMode,
  favoritedIds = new Set(),
  bookmarkedIds = new Set(),
  onFavorite,
  onBookmark,
}: ResourceGridProps) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            isFavorited={favoritedIds.has(resource.id)}
            isBookmarked={bookmarkedIds.has(resource.id)}
            onFavorite={onFavorite}
            onBookmark={onBookmark}
          />
        ))}
      </div>
    )
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {resources.map((resource) => (
          <ResourceListItem
            key={resource.id}
            resource={resource}
            isFavorited={favoritedIds.has(resource.id)}
            isBookmarked={bookmarkedIds.has(resource.id)}
            onFavorite={onFavorite}
            onBookmark={onBookmark}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="divide-border divide-y rounded-md border">
      {resources.map((resource) => (
        <ResourceCompactItem key={resource.id} resource={resource} />
      ))}
    </div>
  )
}
