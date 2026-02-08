import { Prisma } from "@/generated/prisma/client"
import type { ResourceStatus } from "@/generated/prisma/client"
import type { ResourceFilters } from "./resource-types"
import { prisma } from "@/lib/prisma"

/**
 * Sanitize a search term for use with PostgreSQL to_tsquery.
 * Splits on whitespace, filters empty tokens, joins with ' & ' for AND semantics.
 */
function sanitizeTsQuery(search: string): string {
  return search
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => token.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((token) => token.length > 0)
    .join(" & ")
}

/**
 * Build Prisma `where` clause from resource filters.
 * Supports category hierarchy, tags, status, search, and enrichment filters.
 *
 * When `filters.search` is present, uses full-text search via tsvector `@@`
 * operator for title/description, with LIKE fallback for URL matching.
 * FTS results are fetched via `$queryRaw` and merged with URL LIKE results.
 */
export async function buildResourceWhere(
  filters: ResourceFilters
): Promise<Prisma.ResourceWhereInput> {
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
    const tsQuery = sanitizeTsQuery(filters.search)

    if (tsQuery.length > 0) {
      // Use full-text search with tsvector @@ operator for title/description.
      // Fetch matching IDs via $queryRaw, then combine with URL LIKE fallback.
      const ftsResults = await prisma.$queryRaw<Array<{ id: number }>>(
        Prisma.sql`SELECT id FROM "Resource" WHERE "search_vector" @@ to_tsquery('english', ${tsQuery})`
      )
      const ftsIds = ftsResults.map((r) => r.id)

      // Combine: FTS matches (title/description) OR URL LIKE match
      conditions.push({
        OR: [
          ...(ftsIds.length > 0 ? [{ id: { in: ftsIds } }] : []),
          { url: { contains: filters.search, mode: "insensitive" as const } },
        ],
      })
    } else {
      // Invalid tsquery (e.g., only special characters) -- fall back to URL LIKE only
      conditions.push({
        url: { contains: filters.search, mode: "insensitive" },
      })
    }
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
