"use client"

import Link from "next/link"
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

function getInitials(title: string): string {
  return title
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export function ResourceCard({
  resource,
  isFavorited = false,
  isBookmarked = false,
  onFavorite,
  onBookmark,
}: ResourceCardProps) {
  const tags = resource.tags.slice(0, 3)
  const initials = getInitials(resource.title)

  return (
    <Card className="group flex flex-col justify-between border-border transition-all hover:border-primary/60 hover:shadow-[0_0_12px_rgba(224,80,176,0.15)]">
      <CardHeader className="gap-2">
        <div className="flex items-start gap-3">
          {/* Two-letter abbreviation badge */}
          <div className="flex size-10 shrink-0 items-center justify-center border border-accent/50 bg-accent/10 font-heading text-sm font-bold text-accent">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/resources/${resource.id}`}>
                <CardTitle className="line-clamp-1 text-sm font-bold font-heading group-hover:text-primary transition-colors">
                  {resource.title}
                </CardTitle>
              </Link>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary shrink-0 transition-colors"
                aria-label={`Visit ${resource.title}`}
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground font-heading truncate mt-0.5">
              {resource.url.replace(/^https?:\/\//, "").split("/")[0]}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-2 text-xs font-heading">
          {resource.description}
        </p>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.map(({ tag }) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-[10px] font-heading uppercase tracking-wider text-primary border-primary/30"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-2">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-[10px] font-heading uppercase tracking-wider">
            {resource.category.name}
          </Badge>
          <span className="text-muted-foreground flex items-center gap-1 text-xs font-heading">
            <Heart className="size-3" />
            {resource._count.favorites}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onFavorite?.(resource.id)}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`size-3.5 ${isFavorited ? "fill-current text-primary" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onBookmark?.(resource.id)}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark
              className={`size-3.5 ${isBookmarked ? "fill-current text-accent" : ""}`}
            />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
