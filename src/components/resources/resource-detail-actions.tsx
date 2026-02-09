"use client"

import Link from "next/link"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/resources/favorite-button"
import { BookmarkButton } from "@/components/resources/bookmark-button"
import { useFavoriteIds } from "@/hooks/use-favorites"
import {
  useBookmarkedIds,
  useBookmarkNotes,
  useToggleBookmark,
  useUpdateBookmarkNotes,
} from "@/hooks/use-bookmarks"

interface ResourceDetailActionsProps {
  readonly resourceId: number
}

export function ResourceDetailActions({
  resourceId,
}: ResourceDetailActionsProps) {
  const { data: favoriteIds } = useFavoriteIds()
  const isFavorited = favoriteIds?.includes(resourceId) ?? false

  const bookmarkedIds = useBookmarkedIds()
  const isBookmarked = bookmarkedIds.has(resourceId)

  const notes = useBookmarkNotes(resourceId)
  const toggleBookmark = useToggleBookmark()
  const updateNotes = useUpdateBookmarkNotes()

  return (
    <div className="flex flex-wrap gap-2">
      <FavoriteButton
        resourceId={resourceId}
        isFavorited={isFavorited}
        size="sm"
      />
      <BookmarkButton
        resourceId={resourceId}
        isBookmarked={isBookmarked}
        notes={notes}
        onToggle={(id) => toggleBookmark.mutate(id)}
        onSaveNotes={(id, n) => updateNotes.mutate({ resourceId: id, notes: n })}
      />
      <Button variant="outline" size="sm" asChild>
        <Link href={`/resources/${resourceId}/suggest-edit`}>
          <Pencil className="mr-1.5 size-4" />
          Suggest Edit
        </Link>
      </Button>
    </div>
  )
}
