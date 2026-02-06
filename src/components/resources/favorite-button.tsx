"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFavoriteToggle } from "@/hooks/use-favorites"

export interface FavoriteButtonProps {
  readonly resourceId: number
  readonly isFavorited: boolean
  readonly size?: "default" | "sm" | "icon"
}

export function FavoriteButton({
  resourceId,
  isFavorited,
  size = "icon",
}: FavoriteButtonProps) {
  const { toggle, isPending } = useFavoriteToggle(resourceId)

  return (
    <Button
      variant="ghost"
      size={size}
      className="size-8"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(isFavorited)
      }}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={`size-4 transition-colors ${
          isFavorited ? "fill-current text-red-500" : "text-muted-foreground"
        }`}
      />
    </Button>
  )
}
