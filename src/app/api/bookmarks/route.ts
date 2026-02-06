import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { listBookmarks } from "@/features/user/bookmark-service"

/**
 * GET /api/bookmarks -- List all bookmarks for the authenticated user (with notes and resource data).
 */
export const GET = withAuth(
  async (_req: Request, ctx: AuthenticatedRouteContext) => {
    try {
      const bookmarks = await listBookmarks(ctx.user.id)
      return apiSuccess(bookmarks)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
