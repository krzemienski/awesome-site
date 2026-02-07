"use client"

import { useQuery } from "@tanstack/react-query"
import type {
  ResourceFilters,
  PaginatedResponse,
  ResourceWithRelations,
} from "@/features/resources/resource-types"

/**
 * Build URLSearchParams from ResourceFilters, omitting undefined values.
 */
function buildResourceParams(filters: ResourceFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.categoryId != null) params.set("categoryId", String(filters.categoryId))
  if (filters.subcategoryId != null) params.set("subcategoryId", String(filters.subcategoryId))
  if (filters.subSubcategoryId != null) params.set("subSubcategoryId", String(filters.subSubcategoryId))
  if (filters.status) params.set("status", filters.status)
  if (filters.search) params.set("search", filters.search)
  if (filters.tags && filters.tags.length > 0) {
    for (const tag of filters.tags) {
      params.append("tags", tag)
    }
  }
  if (filters.enriched != null) params.set("enriched", String(filters.enriched))
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.order) params.set("order", filters.order)
  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.limit != null) params.set("limit", String(filters.limit))

  return params
}

/**
 * Fetch paginated resources with filters.
 */
export function useResources(filters: ResourceFilters) {
  return useQuery({
    queryKey: ["resources", filters],
    queryFn: async (): Promise<PaginatedResponse<ResourceWithRelations>> => {
      const params = buildResourceParams(filters)
      const res = await fetch(`/api/resources?${params.toString()}`)

      if (!res.ok) {
        throw new Error("Failed to fetch resources")
      }

      const json = await res.json()
      return {
        items: json.data as ResourceWithRelations[],
        meta: json.meta,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch a single resource by ID.
 */
export function useResource(id: number) {
  return useQuery({
    queryKey: ["resource", id],
    queryFn: async (): Promise<ResourceWithRelations> => {
      const res = await fetch(`/api/resources/${id}`)

      if (!res.ok) {
        throw new Error("Resource not found")
      }

      const json = await res.json()
      return json.data as ResourceWithRelations
    },
    enabled: id > 0,
    staleTime: 5 * 60 * 1000,
  })
}
