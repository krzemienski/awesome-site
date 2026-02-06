import type { Prisma, ResourceStatus } from "@/generated/prisma/client"
import type { ResourceFilters } from "./resource-types"

/**
 * Build Prisma `where` clause from resource filters.
 * Supports category hierarchy, tags, status, search, and enrichment filters.
 */
export function buildResourceWhere(
  filters: ResourceFilters
): Prisma.ResourceWhereInput {
  const conditions: Prisma.ResourceWhereInput[] = []

  if (filters.categoryId !== undefined) {
    conditions.push({ categoryId: filters.categoryId })
  }

  if (filters.subcategoryId !== undefined) {
    conditions.push({ subcategoryId: filters.subcategoryId })
  }

  if (filters.subSubcategoryId !== undefined) {
    conditions.push({ subSubcategoryId: filters.subSubcategoryId })
  }

  if (filters.status !== undefined) {
    conditions.push({ status: filters.status as ResourceStatus })
  }

  if (filters.search) {
    const searchTerm = filters.search
    conditions.push({
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { url: { contains: searchTerm, mode: "insensitive" } },
      ],
    })
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push({
      tags: {
        some: {
          tag: {
            slug: { in: filters.tags },
          },
        },
      },
    })
  }

  if (filters.enriched !== undefined) {
    if (filters.enriched) {
      conditions.push({
        NOT: { metadata: { equals: "{}" } },
      })
    } else {
      conditions.push({ metadata: { equals: "{}" } })
    }
  }

  if (conditions.length === 0) {
    return {}
  }

  return { AND: conditions }
}

/**
 * Build Prisma `orderBy` clause from sort/order filters.
 * Defaults to createdAt desc if not specified.
 */
export function buildResourceOrderBy(
  filters: ResourceFilters
): Prisma.ResourceOrderByWithRelationInput {
  const order = filters.order ?? "desc"

  switch (filters.sort) {
    case "title":
      return { title: order }
    case "updatedAt":
      return { updatedAt: order }
    case "popularity":
      return { favorites: { _count: order } }
    case "createdAt":
    default:
      return { createdAt: order }
  }
}

/**
 * Build Prisma `include` clause for resource relations.
 * Always includes category, subcategory, sub-subcategory, tags, and favorite count.
 */
export function buildResourceInclude(): Prisma.ResourceInclude {
  return {
    category: true,
    subcategory: true,
    subSubcategory: true,
    tags: {
      include: {
        tag: true,
      },
    },
    _count: {
      select: {
        favorites: true,
      },
    },
  }
}
