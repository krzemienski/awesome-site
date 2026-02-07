import { NextRequest } from "next/server"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { getRecommendations } from "@/features/ai/recommendation-engine"

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { searchParams } = new URL(req.url)
      const limitParam = searchParams.get("limit")
      const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10) || 10), 50) : 10

      const recommendations = await getRecommendations(ctx.user.id, limit)

      return apiSuccess(recommendations)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
