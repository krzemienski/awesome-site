"use client"

import { useMemo } from "react"
import { useSearchIndex, createFuseIndex } from "@/features/search/search-index"
import { useDebounce } from "@/hooks/use-debounce"
import type { SearchResult } from "@/features/search/search-types"

/**
 * Search hook: takes a raw query string, debounces it, and runs
 * Fuse.js search against the cached search index.
 *
 * Dialog open/close state is managed by the consumer (SearchDialog).
 */
export function useSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300)
  const { data: items, isLoading: isIndexLoading } = useSearchIndex()

  const fuseIndex = useMemo(() => {
    if (!items || items.length === 0) return null
    return createFuseIndex(items)
  }, [items])

  const results: SearchResult[] = useMemo(() => {
    if (!fuseIndex || !debouncedQuery.trim()) return []

    return fuseIndex.search(debouncedQuery, { limit: 20 }).map((r) => ({
      kind: r.item.kind,
      label: r.item.label,
      description: r.item.description,
      href: r.item.href,
    }))
  }, [fuseIndex, debouncedQuery])

  return {
    results,
    isIndexLoading,
  }
}
