"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { ResourceGrid } from "@/components/resources/resource-grid"
import {
  ResourceFilters,
  type ResourceFiltersValue,
} from "@/components/resources/resource-filters"
import { ResourceSort, type SortValue } from "@/components/resources/resource-sort"
import { ViewModeToggle } from "@/components/resources/view-mode-toggle"
import { PaginationControls } from "@/components/shared/pagination-controls"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { useResources } from "@/hooks/use-resources"
import { useCategories } from "@/hooks/use-categories"
import { useDebounce } from "@/hooks/use-debounce"
import { useViewMode } from "@/hooks/use-view-mode"
import type { ResourceFilters as ResourceFiltersType } from "@/features/resources/resource-types"

function parseIntParam(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : undefined
}

function buildSearchUrl(filters: ResourceFiltersType): string {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.categoryId) params.set("categoryId", String(filters.categoryId))
  if (filters.subcategoryId) params.set("subcategoryId", String(filters.subcategoryId))
  if (filters.tags) {
    for (const tag of filters.tags) params.append("tags", tag)
  }
  if (filters.sort && filters.sort !== "createdAt") params.set("sort", filters.sort)
  if (filters.order && filters.order !== "desc") params.set("order", filters.order)
  if (filters.page && filters.page > 1) params.set("page", String(filters.page))
  if (filters.limit && filters.limit !== 20) params.set("limit", String(filters.limit))
  const qs = params.toString()
  return qs ? `/search?${qs}` : "/search"
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [viewMode, setViewMode] = useViewMode()

  const sp = searchParams ?? new URLSearchParams()

  const [filtersValue, setFiltersValue] = useState<ResourceFiltersValue>(() => ({
    search: sp.get("search") ?? undefined,
    categoryId: parseIntParam(sp.get("categoryId")),
    status: undefined,
    tags: sp.getAll("tags").length > 0 ? sp.getAll("tags") : undefined,
  }))

  const [sort, setSort] = useState<SortValue>(() => ({
    field: (sp.get("sort") as SortValue["field"]) ?? "createdAt",
    order: (sp.get("order") as SortValue["order"]) ?? "desc",
  }))

  const [page, setPage] = useState(() => parseIntParam(sp.get("page")) ?? 1)
  const [limit, setLimit] = useState(() => parseIntParam(sp.get("limit")) ?? 20)

  const debouncedSearch = useDebounce(filtersValue.search ?? "", 500)

  const filters = useMemo<ResourceFiltersType>(
    () => ({
      search: debouncedSearch || undefined,
      categoryId: filtersValue.categoryId,
      tags: filtersValue.tags,
      status: "approved",
      sort: sort.field,
      order: sort.order,
      page,
      limit,
    }),
    [debouncedSearch, filtersValue.categoryId, filtersValue.tags, sort, page, limit]
  )

  const { data, isLoading, isError } = useResources(filters)
  const { data: categories } = useCategories()

  const categoryOptions = useMemo(
    () => (categories ?? []).map((c) => ({ id: c.id, name: c.name })),
    [categories]
  )

  const updateUrl = useCallback(
    (newFilters: ResourceFiltersType) => {
      router.replace(buildSearchUrl(newFilters), { scroll: false })
    },
    [router]
  )

  const handleFiltersChange = useCallback(
    (newValue: ResourceFiltersValue) => {
      setFiltersValue(newValue)
      setPage(1)
      updateUrl({
        ...filters,
        search: newValue.search,
        categoryId: newValue.categoryId,
        tags: newValue.tags,
        page: 1,
      })
    },
    [filters, updateUrl]
  )

  const handleSortChange = useCallback(
    (newSort: SortValue) => {
      setSort(newSort)
      setPage(1)
      updateUrl({ ...filters, sort: newSort.field, order: newSort.order, page: 1 })
    },
    [filters, updateUrl]
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage)
      updateUrl({ ...filters, page: newPage })
    },
    [filters, updateUrl]
  )

  const handleLimitChange = useCallback(
    (newLimit: number) => {
      setLimit(newLimit)
      setPage(1)
      updateUrl({ ...filters, limit: newLimit, page: 1 })
    },
    [filters, updateUrl]
  )

  const skeletonVariant = viewMode === "grid" ? "card" : viewMode === "list" ? "list" : "compact"

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Search className="text-muted-foreground size-7" />
          <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
        </div>
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      <ResourceFilters
        value={filtersValue}
        onChange={handleFiltersChange}
        categories={categoryOptions}
      />

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {data
            ? `${data.meta.total} resource${data.meta.total === 1 ? "" : "s"} found`
            : "Loading..."}
        </p>
        <ResourceSort value={sort} onChange={handleSortChange} />
      </div>

      {isLoading && <LoadingSkeleton variant={skeletonVariant} count={6} />}

      {isError && (
        <EmptyState
          title="Failed to load resources"
          description="Something went wrong. Please try again later."
        />
      )}

      {data && data.items.length === 0 && (
        <EmptyState
          title="No resources found"
          description="Try adjusting your search or filters."
          actionLabel="Clear filters"
          onAction={() =>
            handleFiltersChange({
              search: undefined,
              categoryId: undefined,
              tags: undefined,
            })
          }
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <ResourceGrid resources={data.items} viewMode={viewMode} />
          <PaginationControls
            page={page}
            limit={limit}
            total={data.meta.total}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="card" count={6} />}>
      <SearchContent />
    </Suspense>
  )
}
