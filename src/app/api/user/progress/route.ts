import type { NextRequest } from "next/server"
import { withAuth } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { getUserJourneys } from "@/features/journeys/journey-service"

export const GET = withAuth(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const userJourneys = await getUserJourneys(ctx.user.id)

      const totalJourneys = userJourneys.length
      const completedCount = userJourneys.filter(
        (uj) => uj.progress.completedAt != null
      ).length
      const overallPercentage =
        totalJourneys > 0
          ? Math.round(
              userJourneys.reduce((sum, uj) => sum + uj.percentage, 0) /
                totalJourneys
            )
          : 0

      const journeys = userJourneys.map((uj) => ({
        journeyId: uj.journey.id,
        title: uj.journey.title,
        percentage: uj.percentage,
        lastActivity: uj.progress.updatedAt,
      }))

      return apiSuccess({
        totalJourneys,
        completedCount,
        overallPercentage,
        journeys,
      })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
