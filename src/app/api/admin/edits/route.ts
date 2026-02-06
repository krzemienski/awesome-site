import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiPaginated, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { prisma } from "@/lib/prisma"
import { PAGINATION } from "@/lib/constants"

export const GET = withAdmin(
  async (req: NextRequest, _ctx: AuthenticatedRouteContext) => {
    try {
      const url = new URL(req.url)
      const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"))
      const limit = Math.min(
        Number(url.searchParams.get("limit") ?? String(PAGINATION.defaultLimit)),
        PAGINATION.maxLimit
      )
      const skip = (page - 1) * limit

      const status = url.searchParams.get("status") ?? undefined

      const where: Record<string, unknown> = {}

      if (status && status !== "all") {
        where.status = status
      }

      const [items, total] = await Promise.all([
        prisma.resourceEdit.findMany({
          where,
          include: {
            resource: {
              select: { id: true, title: true, url: true },
            },
            submittedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.resourceEdit.count({ where }),
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
