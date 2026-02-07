import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { toggleFavorite, isFavorited } from "@/features/user/favorite-service"

/**
 * POST /api/favorites/[resourceId]
 * Add a resource to favorites.
 */
export const POST = withAuth(
  async (req: Request, ctx: AuthenticatedRouteContext) => {
    try {
      const { resourceId: resourceIdStr } = (await ctx.params) as {
        resourceId: string
      }
      const resourceId = parseInt(resourceIdStr, 10)

      if (isNaN(resourceId) || resourceId <= 0) {
        return apiError("Invalid resource ID", 400, "INVALID_ID")
      }

      const alreadyFavorited = await isFavorited(ctx.user.id, resourceId)

      if (alreadyFavorited) {
        return apiSuccess({ favorited: true })
      }

      const result = await toggleFavorite(ctx.user.id, resourceId)
      return apiSuccess({ favorited: result.favorited }, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * DELETE /api/favorites/[resourceId]
 * Remove a resource from favorites.
 */
export const DELETE = withAuth(
  async (req: Request, ctx: AuthenticatedRouteContext) => {
    try {
      const { resourceId: resourceIdStr } = (await ctx.params) as {
        resourceId: string
      }
      const resourceId = parseInt(resourceIdStr, 10)

      if (isNaN(resourceId) || resourceId <= 0) {
        return apiError("Invalid resource ID", 400, "INVALID_ID")
      }

      const favorited = await isFavorited(ctx.user.id, resourceId)

      if (!favorited) {
        return apiSuccess({ favorited: false })
      }

      const result = await toggleFavorite(ctx.user.id, resourceId)
      return apiSuccess({ favorited: result.favorited })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
