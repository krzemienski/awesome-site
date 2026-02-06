"use client"

import { useQuery } from "@tanstack/react-query"

interface AdminStats {
  readonly totalResources: number
  readonly pendingResources: number
  readonly totalUsers: number
  readonly activeUsers: number
  readonly pendingEdits: number
  readonly enrichedCount: number
}

interface AdminResourceParams {
  readonly page?: number
  readonly limit?: number
  readonly status?: string
  readonly search?: string
  readonly categoryId?: number
}

interface AdminUserParams {
  readonly page?: number
  readonly limit?: number
  readonly search?: string
  readonly role?: string
}

interface PaginatedMeta {
  readonly total: number
  readonly page: number
  readonly limit: number
}

interface PaginatedResult<T> {
  readonly items: T[]
  readonly meta: PaginatedMeta
}

const ADMIN_STALE_TIME = 60_000

/**
 * Fetch admin dashboard stats.
 */
export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats")
      if (!res.ok) {
        throw new Error("Failed to fetch admin stats")
      }
      const json = await res.json()
      return json.data as AdminStats
    },
    staleTime: ADMIN_STALE_TIME,
  })
}

/**
 * Fetch admin resources with pagination and filters.
 */
export function useAdminResources(params: AdminResourceParams = {}) {
  return useQuery<PaginatedResult<Record<string, unknown>>>({
    queryKey: ["admin", "resources", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.page != null) searchParams.set("page", String(params.page))
      if (params.limit != null) searchParams.set("limit", String(params.limit))
      if (params.status) searchParams.set("status", params.status)
      if (params.search) searchParams.set("search", params.search)
      if (params.categoryId != null)
        searchParams.set("categoryId", String(params.categoryId))

      const res = await fetch(
        `/api/admin/resources?${searchParams.toString()}`
      )
      if (!res.ok) {
        throw new Error("Failed to fetch admin resources")
      }
      const json = await res.json()
      return {
        items: json.data as Record<string, unknown>[],
        meta: json.meta as PaginatedMeta,
      }
    },
    staleTime: ADMIN_STALE_TIME,
  })
}

/**
 * Fetch admin users with pagination and filters.
 */
export function useAdminUsers(params: AdminUserParams = {}) {
  return useQuery<PaginatedResult<Record<string, unknown>>>({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.page != null) searchParams.set("page", String(params.page))
      if (params.limit != null) searchParams.set("limit", String(params.limit))
      if (params.search) searchParams.set("search", params.search)
      if (params.role) searchParams.set("role", params.role)

      const res = await fetch(`/api/admin/users?${searchParams.toString()}`)
      if (!res.ok) {
        throw new Error("Failed to fetch admin users")
      }
      const json = await res.json()
      return {
        items: json.data as Record<string, unknown>[],
        meta: json.meta as PaginatedMeta,
      }
    },
    staleTime: ADMIN_STALE_TIME,
  })
}

export type {
  AdminStats,
  AdminResourceParams,
  AdminUserParams,
  PaginatedMeta,
  PaginatedResult,
}
