import type { NextRequest } from "next/server"
import { withAuth } from "@/features/auth/auth-middleware"
import { apiPaginated, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { prisma } from "@/lib/prisma"
import { PAGINATION } from "@/lib/constants"

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const url = new URL(req.url)
      const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"))
      const limit = Math.min(
        Number(url.searchParams.get("limit") ?? String(PAGINATION.defaultLimit)),
        PAGINATION.maxLimit
      )
      const skip = (page - 1) * limit

      const where = { submittedById: ctx.user.id }

      const [items, total] = await Promise.all([
        prisma.resource.findMany({
          where,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            category: { select: { name: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.resource.count({ where }),
      ])

      return apiPaginated(items, {
        total,
        page,
        limit,
        hasMore: skip + items.length < total,
      })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
