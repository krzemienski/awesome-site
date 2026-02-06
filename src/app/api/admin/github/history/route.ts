import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const listId = searchParams.get("listId")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))
    const skip = (page - 1) * limit

    const where = listId ? { listId: parseInt(listId, 10) } : {}

    const [items, total] = await Promise.all([
      prisma.githubSyncHistory.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          list: {
            select: { repoOwner: true, repoName: true },
          },
        },
      }),
      prisma.githubSyncHistory.count({ where }),
    ])

    return apiSuccess({
      items,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
