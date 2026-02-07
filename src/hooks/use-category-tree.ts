"use client"

import { useQuery } from "@tanstack/react-query"

export interface SubSubcategoryNode {
  readonly id: number
  readonly name: string
  readonly slug: string
  readonly resourceCount: number
}

export interface SubcategoryNode {
  readonly id: number
  readonly name: string
  readonly slug: string
  readonly resourceCount: number
  readonly children: readonly SubSubcategoryNode[]
}

export interface CategoryTreeNode {
  readonly id: number
  readonly name: string
  readonly slug: string
  readonly resourceCount: number
  readonly children: readonly SubcategoryNode[]
}

/**
 * Fetch the full category tree for sidebar navigation.
 * Uses 5-minute stale time matching the API cache header.
 */
export function useCategoryTree() {
  return useQuery({
    queryKey: ["categories", "tree"],
    queryFn: async (): Promise<CategoryTreeNode[]> => {
      const res = await fetch("/api/categories/tree")

      if (!res.ok) {
        throw new Error("Failed to fetch category tree")
      }

      const json = await res.json()
      return json.data as CategoryTreeNode[]
    },
    staleTime: 300_000,
  })
}
