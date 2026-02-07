"use client"

import Fuse, { type IFuseOptions } from "fuse.js"
import { useQuery } from "@tanstack/react-query"
import type { SearchableItem } from "@/features/search/search-types"
import type { ResourceWithRelations } from "@/features/resources/resource-types"
import type { CategoryWithChildren } from "@/features/categories/category-types"

/**
 * Fuse.js options for fuzzy search across searchable items.
 */
const FUSE_OPTIONS: IFuseOptions<SearchableItem> = {
  keys: ["label", "description"],
  threshold: 0.3,
}

/**
 * Fetch resources and categories from API, flatten into searchable items.
 */
async function fetchSearchableItems(): Promise<SearchableItem[]> {
  const [resourcesRes, categoriesRes] = await Promise.all([
    fetch("/api/resources?limit=500&status=approved"),
    fetch("/api/categories"),
  ])

  const items: SearchableItem[] = []
  const seenTags = new Set<string>()

  if (resourcesRes.ok) {
    const resourcesJson = await resourcesRes.json()
    const resources = (resourcesJson.data ?? []) as ResourceWithRelations[]

    for (const r of resources) {
      items.push({
        kind: "resource",
        label: r.title,
        description: r.description ?? undefined,
        href: `/resources/${String(r.id)}`,
      })

      for (const rt of r.tags ?? []) {
        const tag = rt.tag
        if (tag && !seenTags.has(tag.slug)) {
          seenTags.add(tag.slug)
          items.push({
            kind: "tag",
            label: tag.name,
            description: `Tag: ${tag.name}`,
            href: `/resources?tags=${tag.slug}`,
          })
        }
      }
    }
  }

  if (categoriesRes.ok) {
    const categoriesJson = await categoriesRes.json()
    const categories = (categoriesJson.data ?? []) as CategoryWithChildren[]

    for (const cat of categories) {
      items.push({
        kind: "category",
        label: cat.name,
        description: cat.description ?? undefined,
        href: `/categories/${cat.slug}`,
      })

      for (const sub of cat.subcategories ?? []) {
        items.push({
          kind: "category",
          label: sub.name,
          description: sub.description ?? undefined,
          href: `/categories/${cat.slug}/${sub.slug}`,
        })
      }
    }
  }

  return items
}

/**
 * TanStack Query hook that fetches all searchable items and caches for 10 minutes.
 * Returns the raw items array.
 */
export function useSearchIndex() {
  return useQuery({
    queryKey: ["search-index"],
    queryFn: fetchSearchableItems,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

/**
 * Create a Fuse instance from a list of searchable items.
 */
export function createFuseIndex(items: SearchableItem[]): Fuse<SearchableItem> {
  return new Fuse(items, FUSE_OPTIONS)
}
