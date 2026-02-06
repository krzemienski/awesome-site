import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { dismissFinding } from "@/features/ai/research-service"

export const POST = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const findingId = Number(id)

      if (Number.isNaN(findingId)) {
        return apiError("Invalid finding ID", 422, "VALIDATION_ERROR")
      }

      await dismissFinding(findingId)
      return apiSuccess({ message: "Finding dismissed" })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
