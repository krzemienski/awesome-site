"use client"

import { ExternalLink, Heart, Bookmark } from "lucide-react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ResourceWithRelations } from "@/features/resources/resource-types"

export interface ResourceCardProps {
  resource: ResourceWithRelations
  isFavorited?: boolean
  isBookmarked?: boolean
  onFavorite?: (resourceId: number) => void
  onBookmark?: (resourceId: number) => void
}

export function ResourceCard({
  resource,
  isFavorited = false,
  isBookmarked = false,
  onFavorite,
  onBookmark,
}: ResourceCardProps) {
  const tags = resource.tags.slice(0, 3)

  return (
    <Card className="group flex flex-col justify-between">
      <CardHeader className="gap-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-base">
            {resource.title}
          </CardTitle>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary shrink-0 transition-colors"
            aria-label={`Visit ${resource.title}`}
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
        <Badge variant="secondary" className="w-fit text-xs">
          {resource.category.name}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {resource.description}
        </p>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.map(({ tag }) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Heart className="size-3" />
          {resource._count.favorites}
        </span>
        <div className="flex items-center gap-1">
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
        </div>
      </CardFooter>
    </Card>
  )
}
