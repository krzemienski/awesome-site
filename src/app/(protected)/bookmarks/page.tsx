"use client"

import { useState, useMemo } from "react"
import { BookmarkX, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { BookmarkButton } from "@/components/resources/bookmark-button"
import {
  useBookmarks,
  useToggleBookmark,
  useUpdateBookmarkNotes,
} from "@/hooks/use-bookmarks"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Heart } from "lucide-react"

export default function BookmarksPage() {
  const { data: bookmarks, isPending, error } = useBookmarks()
  const toggleBookmark = useToggleBookmark()
  const updateNotes = useUpdateBookmarkNotes()
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = useMemo(() => {
    if (!bookmarks) return []
    if (!searchQuery.trim()) return bookmarks

    const query = searchQuery.toLowerCase()
    return bookmarks.filter((entry) => {
      const titleMatch = entry.resource.title.toLowerCase().includes(query)
      const descMatch = entry.resource.description
        ?.toLowerCase()
        .includes(query)
      const notesMatch = entry.notes?.toLowerCase().includes(query)
      return titleMatch || descMatch || notesMatch
    })
  }, [bookmarks, searchQuery])

  function handleToggle(resourceId: number) {
    toggleBookmark.mutate(resourceId)
  }

  function handleSaveNotes(resourceId: number, notes: string) {
    updateNotes.mutate({ resourceId, notes })
  }

  if (isPending) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">My Bookmarks</h1>
        <LoadingSkeleton variant="card" count={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">My Bookmarks</h1>
        <EmptyState
          title="Failed to load bookmarks"
          description="An error occurred while loading your bookmarks. Please try again."
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Bookmarks</h1>
          <p className="text-muted-foreground text-sm">
            {bookmarks?.length ?? 0} bookmarked resource
            {bookmarks?.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookmarkX}
          title={searchQuery ? "No matching bookmarks" : "No bookmarks yet"}
          description={
            searchQuery
              ? "Try a different search term to find your bookmarks."
              : "Bookmark resources to save them here with personal notes."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <Card key={entry.resourceId} className="group flex flex-col">
              <CardHeader className="gap-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1 text-base">
                    {entry.resource.title}
                  </CardTitle>
                  <a
                    href={entry.resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary shrink-0 transition-colors"
                    aria-label={`Visit ${entry.resource.title}`}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>
                <Badge variant="secondary" className="w-fit text-xs">
                  {entry.resource.category.name}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {entry.resource.description}
                </p>
                {entry.notes && (
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs font-medium">Notes</p>
                    <p className="text-muted-foreground mt-0.5 line-clamp-3 text-xs">
                      {entry.notes}
                    </p>
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Heart className="size-3" />
                    {entry.resource._count.favorites}
                  </span>
                  <BookmarkButton
                    resourceId={entry.resourceId}
                    isBookmarked={true}
                    notes={entry.notes ?? ""}
                    onToggle={handleToggle}
                    onSaveNotes={handleSaveNotes}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
