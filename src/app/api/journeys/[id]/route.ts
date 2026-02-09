import type { NextRequest } from "next/server"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { getJourney } from "@/features/journeys/journey-service"

/**
 * GET /api/journeys/[id]
 * Public journey detail with steps.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const journeyId = Number(id)

    if (!Number.isInteger(journeyId) || journeyId <= 0) {
      const { apiError } = await import("@/lib/api-response")
      return apiError("Invalid journey ID", 422, "VALIDATION_ERROR")
    }

    const journey = await getJourney(journeyId)
    return apiSuccess(journey)
  } catch (error) {
    return handleApiError(error)
  }
}
