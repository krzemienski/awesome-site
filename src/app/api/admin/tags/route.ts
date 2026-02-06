import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { prisma } from "@/lib/prisma"

export const GET = withAdmin(
  async (_req: NextRequest, _ctx: AuthenticatedRouteContext) => {
    try {
      const tags = await prisma.tag.findMany({
        include: { _count: { select: { resources: true } } },
        orderBy: { name: "asc" },
      })

      return apiSuccess(tags)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
