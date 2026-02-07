import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess } from "@/lib/api-response"
import { handleApiError } from "@/lib/api-response"
import { listFavorites, getFavoritedIds } from "@/features/user/favorite-service"

/**
 * GET /api/favorites
 * List all favorites for the authenticated user.
 * Query param ?ids=true returns only resource IDs (for bulk status check).
 */
export const GET = withAuth(
  async (req: Request, ctx: AuthenticatedRouteContext) => {
    try {
      const url = new URL(req.url)
      const idsOnly = url.searchParams.get("ids") === "true"

      if (idsOnly) {
        const ids = await getFavoritedIds(ctx.user.id)
        return apiSuccess(ids)
      }

      const resources = await listFavorites(ctx.user.id)
      return apiSuccess(resources)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
