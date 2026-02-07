import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

const VALID_DAYS = new Set([7, 30, 90])

function groupByDate(
  records: readonly { readonly createdAt: Date }[]
): readonly { readonly date: string; readonly count: number }[] {
  const buckets = new Map<string, number>()
  for (const record of records) {
    const dateKey = record.createdAt.toISOString().slice(0, 10)
    buckets.set(dateKey, (buckets.get(dateKey) ?? 0) + 1)
  }
  return Array.from(buckets.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export const GET = withAdmin(async (req) => {
  try {
    const url = new URL(req.url)
    const daysParam = Number(url.searchParams.get("days") ?? "30")
    const days = VALID_DAYS.has(daysParam) ? daysParam : 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      topViewedRaw,
      mostFavoritedRaw,
      userGrowthRaw,
      submissionTrendsRaw,
      categoryDistribution,
      apiUsageRaw,
    ] = await Promise.all([
      // Top viewed resources
      prisma.viewHistory.groupBy({
        by: ["resourceId"],
        where: { viewedAt: { gte: startDate } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // Most favorited resources
      prisma.userFavorite.groupBy({
        by: ["resourceId"],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // User growth (raw records for date grouping)
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // Submission trends (raw records for date grouping)
      prisma.resource.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // Category distribution
      prisma.category.findMany({
        select: {
          name: true,
          _count: { select: { resources: true } },
        },
        orderBy: { name: "asc" },
      }),
      // API usage by endpoint
      prisma.apiUsageLog.groupBy({
        by: ["endpoint", "method"],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
        _avg: { responseTime: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
    ])

    // Resolve resource titles for top viewed
    const viewedResourceIds = topViewedRaw.map((r) => r.resourceId)
    const favoritedResourceIds = mostFavoritedRaw.map((r) => r.resourceId)
    const allResourceIds = [...new Set([...viewedResourceIds, ...favoritedResourceIds])]

    const resourcesMap = new Map<number, string>()
    if (allResourceIds.length > 0) {
      const resources = await prisma.resource.findMany({
        where: { id: { in: allResourceIds } },
        select: { id: true, title: true },
      })
      for (const r of resources) {
        resourcesMap.set(r.id, r.title)
      }
    }

    const topViewed = topViewedRaw.map((r) => ({
      id: r.resourceId,
      title: resourcesMap.get(r.resourceId) ?? `Resource #${r.resourceId}`,
      views: r._count.id,
    }))

    const mostFavorited = mostFavoritedRaw.map((r) => ({
      id: r.resourceId,
      title: resourcesMap.get(r.resourceId) ?? `Resource #${r.resourceId}`,
      favorites: r._count.id,
    }))

    const userGrowth = groupByDate(userGrowthRaw)
    const submissionTrends = groupByDate(submissionTrendsRaw)

    const categoryDist = categoryDistribution
      .map((c) => ({
        name: c.name,
        count: c._count.resources,
      }))
      .sort((a, b) => b.count - a.count)

    const apiUsage = apiUsageRaw.map((r) => ({
      endpoint: r.endpoint,
      method: r.method,
      requests: r._count.id,
      avgResponseTime: Math.round(r._avg.responseTime ?? 0),
    }))

    return apiSuccess({
      topViewed,
      mostFavorited,
      userGrowth,
      submissionTrends,
      categoryDistribution: categoryDist,
      apiUsage,
      days,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
