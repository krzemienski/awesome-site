import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { dismissFinding } from "@/features/ai/research-service"
import { logAdminAction } from "@/features/admin/audit-service"

export const POST = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const findingId = Number(id)

      if (Number.isNaN(findingId)) {
        return apiError("Invalid finding ID", 422, "VALIDATION_ERROR")
      }

      await dismissFinding(findingId)

      logAdminAction({
        action: "research_finding_dismiss",
        performedById: ctx.user.id,
        newState: { findingId },
      }).catch(() => {})

      return apiSuccess({ message: "Finding dismissed" })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
