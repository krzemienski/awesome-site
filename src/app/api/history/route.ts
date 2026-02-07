import { NextRequest } from "next/server"
import { z } from "zod"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { recordView, getHistory } from "@/features/user/history-service"

const recordViewSchema = z.object({
  resourceId: z.number().int().positive(),
})

/**
 * GET /api/history -- Get view history for the authenticated user.
 * Query params: ?limit=50&offset=0
 */
export const GET = withAuth(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const url = new URL(req.url)
      const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100)
      const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0)

      const result = await getHistory(ctx.user.id, limit, offset)
      return apiSuccess(result)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * POST /api/history -- Record a view for the authenticated user.
 * Body: { resourceId: number }
 */
export const POST = withAuth(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parsed = recordViewSchema.safeParse(body)
      if (!parsed.success) {
        return apiError("Invalid resourceId", 422, "VALIDATION_ERROR")
      }

      const view = await recordView(ctx.user.id, parsed.data.resourceId)
      return apiSuccess(view, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
