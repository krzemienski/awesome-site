"use client"

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

const FAVORITES_KEY = ["favorites"]
const FAVORITE_IDS_KEY = ["favorite-ids"]

/**
 * Fetch all favorited resource IDs for the authenticated user.
 * Used for bulk favorite status checking in list views.
 */
export function useFavoriteIds() {
  return useQuery({
    queryKey: FAVORITE_IDS_KEY,
    queryFn: async (): Promise<number[]> => {
      const res = await fetch("/api/favorites?ids=true")

      if (!res.ok) {
        if (res.status === 401) return []
        throw new Error("Failed to fetch favorite IDs")
      }

      const json = await res.json()
      return json.data as number[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Fetch full favorites list with resource details.
 */
export function useFavorites() {
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: async () => {
      const res = await fetch("/api/favorites")

      if (!res.ok) {
        throw new Error("Failed to fetch favorites")
      }

      const json = await res.json()
      return json.data as Array<Record<string, unknown>>
    },
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Toggle favorite mutation with optimistic update.
 * Optimistically updates the favorite IDs cache for instant UI feedback.
 */
export function useFavoriteToggle(resourceId: number) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (currentlyFavorited: boolean) => {
      const method = currentlyFavorited ? "DELETE" : "POST"
      const res = await fetch(`/api/favorites/${resourceId}`, { method })

      if (!res.ok) {
        throw new Error("Failed to toggle favorite")
      }

      const json = await res.json()
      return json.data as { favorited: boolean }
    },
    onMutate: async (currentlyFavorited: boolean) => {
      await queryClient.cancelQueries({ queryKey: FAVORITE_IDS_KEY })

      const previousIds = queryClient.getQueryData<number[]>(FAVORITE_IDS_KEY)

      queryClient.setQueryData<number[]>(FAVORITE_IDS_KEY, (old = []) => {
        if (currentlyFavorited) {
          return old.filter((id) => id !== resourceId)
        }
        return [...old, resourceId]
      })

      return { previousIds }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(FAVORITE_IDS_KEY, context.previousIds)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITE_IDS_KEY })
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEY })
      queryClient.invalidateQueries({ queryKey: ["resources"] })
    },
  })

  return {
    toggle: (currentlyFavorited: boolean) =>
      mutation.mutate(currentlyFavorited),
    isPending: mutation.isPending,
  }
}
