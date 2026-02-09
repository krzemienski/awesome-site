import { prisma } from "@/lib/prisma"
import { getRecommendations } from "@/features/ai/recommendation-engine"

export interface RelatedResource {
  id: number
  title: string
  url: string
  description: string
  category: { name: string; slug: string }
  favoriteCount: number
}

/**
 * Get related resources for a given resource.
 * If userId is provided, attempts personalized recommendations filtered
 * to the same category. Falls back to same-category popular resources
 * when no userId, insufficient interactions, or no matching recommendations.
 */
export async function getRelatedResources(
  resourceId: number,
  userId?: string,
  limit = 10
): Promise<readonly RelatedResource[]> {
  const safeLimit = Math.min(Math.max(1, limit), 50)

  const sourceResource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { categoryId: true, category: { select: { name: true } } },
  })

  if (!sourceResource) {
    return []
  }

  if (userId) {
    try {
      const recommendations = await getRecommendations(userId, safeLimit * 2)
      const sameCategoryRecs = recommendations.filter(
        (rec) =>
          rec.category === sourceResource.category.name &&
          rec.resourceId !== resourceId
      )

      if (sameCategoryRecs.length >= 3) {
        const recResourceIds = sameCategoryRecs
          .slice(0, safeLimit)
          .map((r) => r.resourceId)

        const resources = await prisma.resource.findMany({
          where: { id: { in: recResourceIds } },
          select: {
            id: true,
            title: true,
            url: true,
            description: true,
            category: { select: { name: true, slug: true } },
            _count: { select: { favorites: true } },
          },
        })

        const orderMap = new Map(recResourceIds.map((id, i) => [id, i]))
        const sorted = [...resources].sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
        )

        return sorted.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          description: r.description,
          category: r.category,
          favoriteCount: r._count.favorites,
        }))
      }
    } catch {
      // Fall through to category-based fallback
    }
  }

  const fallbackResources = await prisma.resource.findMany({
    where: {
      categoryId: sourceResource.categoryId,
      id: { not: resourceId },
      status: "approved",
    },
    select: {
      id: true,
      title: true,
      url: true,
      description: true,
      category: { select: { name: true, slug: true } },
      _count: { select: { favorites: true } },
    },
    orderBy: { favorites: { _count: "desc" } },
    take: safeLimit,
  })

  return fallbackResources.map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    description: r.description,
    category: r.category,
    favoriteCount: r._count.favorites,
  }))
}
