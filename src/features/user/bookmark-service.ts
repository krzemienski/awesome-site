import { prisma } from "@/lib/prisma"

/**
 * Toggle a bookmark for a user on a resource.
 * If already bookmarked, removes it. Otherwise, creates it.
 */
export async function toggleBookmark(
  userId: string,
  resourceId: number
): Promise<{ bookmarked: boolean }> {
  const existing = await prisma.userBookmark.findUnique({
    where: { userId_resourceId: { userId, resourceId } },
  })

  if (existing) {
    await prisma.userBookmark.delete({ where: { id: existing.id } })
    return { bookmarked: false }
  }

  await prisma.userBookmark.create({ data: { userId, resourceId } })
  return { bookmarked: true }
}

/**
 * Update notes on an existing bookmark.
 * Throws if bookmark does not exist.
 */
export async function updateBookmarkNotes(
  userId: string,
  resourceId: number,
  notes: string
): Promise<void> {
  await prisma.userBookmark.update({
    where: { userId_resourceId: { userId, resourceId } },
    data: { notes },
  })
}

/**
 * List all bookmarks for a user with full resource relations and notes.
 */
export async function listBookmarks(userId: string) {
  const bookmarks = await prisma.userBookmark.findMany({
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

  return bookmarks.map((bm) => ({
    resourceId: bm.resourceId,
    notes: bm.notes,
    createdAt: bm.createdAt,
    resource: bm.resource,
  }))
}

/**
 * Get all bookmarked resource IDs for a user.
 * Useful for bulk checking bookmark status in list views.
 */
export async function getBookmarkedIds(userId: string): Promise<number[]> {
  const bookmarks = await prisma.userBookmark.findMany({
    where: { userId },
    select: { resourceId: true },
  })

  return bookmarks.map((bm) => bm.resourceId)
}
