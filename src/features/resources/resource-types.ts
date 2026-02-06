import type {
  Resource as PrismaResource,
  ResourceStatus as PrismaResourceStatus,
  Category,
  Subcategory,
  SubSubcategory,
  Tag,
} from "@/generated/prisma/client"

/**
 * Re-export Prisma ResourceStatus enum for use across the feature module.
 */
export type ResourceStatus = PrismaResourceStatus

/**
 * Base resource type matching the Prisma model.
 */
export type Resource = PrismaResource

/**
 * Resource with eagerly loaded relations for list/detail views.
 */
export interface ResourceWithRelations extends Resource {
  category: Category
  subcategory: Subcategory | null
  subSubcategory: SubSubcategory | null
  tags: Array<{ tag: Tag }>
  _count: {
    favorites: number
  }
}

/**
 * Filters for querying resources with pagination.
 */
export interface ResourceFilters {
  categoryId?: number
  subcategoryId?: number
  subSubcategoryId?: number
  status?: PrismaResourceStatus
  search?: string
  tags?: string[]
  enriched?: boolean
  sort?: "title" | "createdAt" | "updatedAt" | "popularity"
  order?: "asc" | "desc"
  page?: number
  limit?: number
}

/**
 * Generic paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  items: T[]
  meta: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

/**
 * Input for creating a new resource.
 */
export interface CreateResourceInput {
  title: string
  url: string
  description: string
  categoryId: number
  subcategoryId?: number | null
  subSubcategoryId?: number | null
  tags?: string[]
}

/**
 * Input for updating an existing resource.
 */
export interface UpdateResourceInput {
  title?: string
  url?: string
  description?: string
  categoryId?: number
  subcategoryId?: number | null
  subSubcategoryId?: number | null
  tags?: string[]
  status?: PrismaResourceStatus
  ogImage?: string | null
  blurhash?: string | null
  metadata?: Record<string, unknown>
}
