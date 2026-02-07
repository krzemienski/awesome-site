"use client"

import { ExternalLink, Heart, Bookmark } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ResourceWithRelations } from "@/features/resources/resource-types"

export interface ResourceListItemProps {
  resource: ResourceWithRelations
  isFavorited?: boolean
  isBookmarked?: boolean
  onFavorite?: (resourceId: number) => void
  onBookmark?: (resourceId: number) => void
}

export function ResourceListItem({
  resource,
  isFavorited = false,
  isBookmarked = false,
  onFavorite,
  onBookmark,
}: ResourceListItemProps) {
  const tags = resource.tags.slice(0, 3)

  return (
    <Card className="py-3">
      <CardContent className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">
              {resource.title}
            </h3>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {resource.category.name}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
            {resource.description}
          </p>
          {tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tags.map(({ tag }) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Heart className="size-3" />
            {resource._count.favorites}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onFavorite?.(resource.id)}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`size-4 ${isFavorited ? "fill-current text-red-500" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onBookmark?.(resource.id)}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark
              className={`size-4 ${isBookmarked ? "fill-current text-yellow-500" : ""}`}
            />
          </Button>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label={`Visit ${resource.title}`}
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
