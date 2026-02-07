import { NextRequest } from "next/server"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { approveResource } from "@/features/resources/resource-service"

/**
 * PUT /api/resources/[id]/approve
 * Admin: approve a pending resource.
 */
export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext): Promise<Response> => {
    try {
      const { id } = await ctx.params
      const resourceId = Number(id)

      if (!Number.isInteger(resourceId) || resourceId <= 0) {
        return apiError("Invalid resource ID", 422, "VALIDATION_ERROR")
      }

      const resource = await approveResource(resourceId, ctx.user.id)

      return apiSuccess(resource)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
