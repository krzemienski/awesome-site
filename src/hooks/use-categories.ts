"use client"

import { useQuery } from "@tanstack/react-query"
import type { CategoryWithChildren } from "@/features/categories/category-types"

/**
 * Fetch full category tree with resource counts.
 * Uses 30-minute stale time since categories change infrequently.
 */
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<CategoryWithChildren[]> => {
      const res = await fetch("/api/categories")

      if (!res.ok) {
        throw new Error("Failed to fetch categories")
      }

      const json = await res.json()
      return json.data as CategoryWithChildren[]
    },
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * Fetch a single category by slug.
 * Derives from the full category tree to avoid extra API call.
 */
export function useCategory(slug: string) {
  const { data: categories, ...rest } = useCategories()

  const category = categories?.find((c) => c.slug === slug) ?? null

  return {
    ...rest,
    data: category,
  }
}
