import { prisma } from "@/lib/prisma"

/**
 * Record a view for a user on a resource.
 * Creates a new ViewHistory entry each time (not deduplicated).
 */
export async function recordView(userId: string, resourceId: number) {
  return prisma.viewHistory.create({
    data: { userId, resourceId },
  })
}

/**
 * Get paginated view history for a user, most recent first.
 * Includes full resource relations for display.
 */
export async function getHistory(
  userId: string,
  limit = 50,
  offset = 0
) {
  const [items, total] = await Promise.all([
    prisma.viewHistory.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        resource: {
          include: {
            category: true,
            subcategory: true,
            subSubcategory: true,
            tags: { include: { tag: true } },
            _count: { select: { favorites: true } },
          },
        },
      },
    }),
    prisma.viewHistory.count({ where: { userId } }),
  ])

  return { items, total }
}
