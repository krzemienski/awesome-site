import { prisma } from "@/lib/prisma"

/**
 * Toggle a favorite for a user on a resource.
 * If already favorited, removes it. Otherwise, creates it.
 */
export async function toggleFavorite(
  userId: string,
  resourceId: number
): Promise<{ favorited: boolean }> {
  const existing = await prisma.userFavorite.findUnique({
    where: { userId_resourceId: { userId, resourceId } },
  })

  if (existing) {
    await prisma.userFavorite.delete({ where: { id: existing.id } })
    return { favorited: false }
  }

  await prisma.userFavorite.create({ data: { userId, resourceId } })
  return { favorited: true }
}

/**
 * List all favorites for a user with full resource relations.
 */
export async function listFavorites(userId: string) {
  const favorites = await prisma.userFavorite.findMany({
    where: { userId },
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
    orderBy: { createdAt: "desc" },
  })

  return favorites.map((fav) => fav.resource)
}

/**
 * Check if a specific resource is favorited by a user.
 */
export async function isFavorited(
  userId: string,
  resourceId: number
): Promise<boolean> {
  const existing = await prisma.userFavorite.findUnique({
    where: { userId_resourceId: { userId, resourceId } },
  })

  return existing !== null
}

/**
 * Get all favorited resource IDs for a user.
 * Useful for bulk checking favorite status in list views.
 */
export async function getFavoritedIds(userId: string): Promise<number[]> {
  const favorites = await prisma.userFavorite.findMany({
    where: { userId },
    select: { resourceId: true },
  })

  return favorites.map((fav) => fav.resourceId)
}
