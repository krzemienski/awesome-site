import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalResources,
    pendingResources,
    totalUsers,
    activeUsers,
    pendingEdits,
    enrichedResources,
    totalCategories,
    totalSubcategories,
    totalSubSubcategories,
    totalTags,
    totalJourneys,
  ] = await Promise.all([
    prisma.resource.count(),
    prisma.resource.count({ where: { status: "pending" } }),
    prisma.user.count(),
    prisma.user.count({ where: { updatedAt: { gte: thirtyDaysAgo } } }),
    prisma.resourceEdit.count({ where: { status: "pending" } }),
    prisma.resource.count({
      where: { metadata: { not: { equals: {} } } },
    }),
    prisma.category.count(),
    prisma.subcategory.count(),
    prisma.subSubcategory.count(),
    prisma.tag.count(),
    prisma.learningJourney.count(),
  ])

  return {
    totalResources,
    pendingResources,
    totalUsers,
    activeUsers,
    pendingEdits,
    enrichedResources,
    totalCategories,
    totalSubcategories,
    totalSubSubcategories,
    totalTags,
    totalJourneys,
  }
}

export async function getRecentActivity(limit = 20) {
  return prisma.resourceAuditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { resource: { select: { title: true } } },
  })
}
