"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { ResourceWithRelations } from "@/features/resources/resource-types"

export interface BookmarkEntry {
  resourceId: number
  notes: string | null
  createdAt: string
  resource: ResourceWithRelations
}

/**
 * Fetch all bookmarks for the current user.
 */
export function useBookmarks() {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: async (): Promise<BookmarkEntry[]> => {
      const res = await fetch("/api/bookmarks")

      if (!res.ok) {
        if (res.status === 401) return []
        throw new Error("Failed to fetch bookmarks")
      }

      const json = await res.json()
      return (json.data ?? []) as BookmarkEntry[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Get a Set of bookmarked resource IDs from the bookmarks list.
 */
export function useBookmarkedIds(): Set<number> {
  const { data } = useBookmarks()

  if (!data) return new Set()
  return new Set(data.map((b) => b.resourceId))
}

/**
 * Get the notes for a specific bookmarked resource.
 */
export function useBookmarkNotes(resourceId: number): string {
  const { data } = useBookmarks()

  if (!data) return ""
  const entry = data.find((b) => b.resourceId === resourceId)
  return entry?.notes ?? ""
}

/**
 * Toggle bookmark mutation with optimistic update.
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resourceId: number) => {
      const res = await fetch(`/api/bookmarks/${resourceId}`, {
        method: "POST",
      })

      if (!res.ok) {
        throw new Error("Failed to toggle bookmark")
      }

      const json = await res.json()
      return json.data as { bookmarked: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] })
    },
  })
}

/**
 * Update bookmark notes mutation.
 */
export function useUpdateBookmarkNotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      resourceId,
      notes,
    }: {
      resourceId: number
      notes: string
    }) => {
      const res = await fetch(`/api/bookmarks/${resourceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })

      if (!res.ok) {
        throw new Error("Failed to update bookmark notes")
      }

      const json = await res.json()
      return json.data as { updated: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] })
    },
  })
}
