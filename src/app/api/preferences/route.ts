import { NextRequest } from "next/server"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import {
  getPreferences,
  updatePreferences,
} from "@/features/user/preference-service"
import { updatePreferencesSchema } from "@/features/user/user-schemas"

/**
 * GET /api/preferences
 * Get the authenticated user's preferences.
 */
export const GET = withAuth(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const prefs = await getPreferences(ctx.user.id)
      return apiSuccess(prefs)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * PUT /api/preferences
 * Update the authenticated user's preferences.
 */
export const PUT = withAuth(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const body: unknown = await req.json()
      const result = updatePreferencesSchema.safeParse(body)

      if (!result.success) {
        return Response.json(
          {
            success: false,
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: result.error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          },
          { status: 422 }
        )
      }

      const prefs = await updatePreferences(ctx.user.id, result.data)
      return apiSuccess(prefs)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
