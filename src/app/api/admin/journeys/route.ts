import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { createJourney } from "@/features/journeys/journey-service"
import { createJourneySchema } from "@/features/journeys/journey-schemas"

/**
 * POST /api/admin/journeys
 * Admin -- create a new journey (draft status).
 */
export const POST = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parsed = createJourneySchema.safeParse(body)
      if (!parsed.success) {
        return apiError(
          parsed.error.issues.map((i) => i.message).join(", "),
          422,
          "VALIDATION_ERROR"
        )
      }

      const journey = await createJourney(parsed.data, ctx.user.id)
      return apiSuccess(journey, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
