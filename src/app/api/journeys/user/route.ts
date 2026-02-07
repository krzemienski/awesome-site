import type { NextRequest } from "next/server"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { getUserJourneys } from "@/features/journeys/journey-service"

/**
 * GET /api/journeys/user
 * Authenticated -- list the current user's enrolled journeys with progress.
 */
export const GET = withAuth(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const journeys = await getUserJourneys(ctx.user.id)
      return apiSuccess(journeys)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
