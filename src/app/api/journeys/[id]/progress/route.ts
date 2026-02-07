import type { NextRequest } from "next/server"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import {
  getUserProgress,
  completeStep,
} from "@/features/journeys/journey-service"
import { completeStepSchema } from "@/features/journeys/journey-schemas"

/**
 * GET /api/journeys/[id]/progress
 * Authenticated -- get the current user's progress for this journey.
 */
export const GET = withAuth(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const journeyId = Number(id)

      if (!Number.isInteger(journeyId) || journeyId <= 0) {
        return apiError("Invalid journey ID", 422, "VALIDATION_ERROR")
      }

      const progress = await getUserProgress(ctx.user.id, journeyId)
      return apiSuccess(progress)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * PUT /api/journeys/[id]/progress
 * Authenticated -- complete a step in this journey.
 * Body: { stepId: number, rating?: number, timeSpent?: number, notes?: string }
 */
export const PUT = withAuth(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const journeyId = Number(id)

      if (!Number.isInteger(journeyId) || journeyId <= 0) {
        return apiError("Invalid journey ID", 422, "VALIDATION_ERROR")
      }

      const body = await req.json()
      const parsed = completeStepSchema.safeParse(body)

      if (!parsed.success) {
        return apiError(
          parsed.error.issues.map((i) => i.message).join(", "),
          422,
          "VALIDATION_ERROR"
        )
      }

      const { stepId, ...rest } = parsed.data
      const completion = await completeStep(ctx.user.id, stepId, rest)
      return apiSuccess(completion)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
