import { NextRequest } from "next/server"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { rejectResource } from "@/features/resources/resource-service"

/**
 * PUT /api/resources/[id]/reject
 * Admin: reject a pending resource.
 * Accepts optional { reason } in body for audit context.
 */
export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext): Promise<Response> => {
    try {
      const { id } = await ctx.params
      const resourceId = Number(id)

      if (!Number.isInteger(resourceId) || resourceId <= 0) {
        return apiError("Invalid resource ID", 422, "VALIDATION_ERROR")
      }

      const resource = await rejectResource(resourceId, ctx.user.id)

      return apiSuccess(resource)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
