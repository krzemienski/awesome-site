import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiPaginated, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { listAuditLogs } from "@/features/admin/audit-service"

export const GET = withAdmin(
  async (req: NextRequest, _ctx: AuthenticatedRouteContext) => {
    try {
      const url = new URL(req.url)
      const action = url.searchParams.get("action") ?? undefined
      const resourceId = url.searchParams.get("resourceId")
        ? Number(url.searchParams.get("resourceId"))
        : undefined
      const performedById =
        url.searchParams.get("performedById") ?? undefined
      const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"))
      const limit = Math.min(
        Math.max(1, Number(url.searchParams.get("limit") ?? "20")),
        100
      )

      const result = await listAuditLogs({
        action,
        resourceId,
        performedById,
        page,
        limit,
      })

      return apiPaginated(result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore,
      })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
