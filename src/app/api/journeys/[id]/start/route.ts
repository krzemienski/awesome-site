import type { NextRequest } from "next/server"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { enrollUser } from "@/features/journeys/journey-service"

/**
 * POST /api/journeys/[id]/start
 * Authenticated -- enroll the current user in this journey.
 */
export const POST = withAuth(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const journeyId = Number(id)

      if (!Number.isInteger(journeyId) || journeyId <= 0) {
        const { apiError } = await import("@/lib/api-response")
        return apiError("Invalid journey ID", 422, "VALIDATION_ERROR")
      }

      const enrollment = await enrollUser(ctx.user.id, journeyId)
      return apiSuccess(enrollment, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
