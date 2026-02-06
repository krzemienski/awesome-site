import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import {
  updateJourney,
  deleteJourney,
} from "@/features/journeys/journey-service"
import { updateJourneySchema } from "@/features/journeys/journey-schemas"

/**
 * PUT /api/admin/journeys/[id]
 * Admin -- update journey fields.
 */
export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const numericId = parseInt(id, 10)

      if (isNaN(numericId)) {
        return apiError("Invalid journey ID", 400, "INVALID_ID")
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parsed = updateJourneySchema.safeParse(body)
      if (!parsed.success) {
        return apiError(
          parsed.error.issues.map((i) => i.message).join(", "),
          422,
          "VALIDATION_ERROR"
        )
      }

      const journey = await updateJourney(numericId, parsed.data)
      return apiSuccess(journey)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * DELETE /api/admin/journeys/[id]
 * Admin -- delete a journey (cascades to steps).
 */
export const DELETE = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const numericId = parseInt(id, 10)

      if (isNaN(numericId)) {
        return apiError("Invalid journey ID", 400, "INVALID_ID")
      }

      await deleteJourney(numericId)
      return apiSuccess({ deleted: true })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
