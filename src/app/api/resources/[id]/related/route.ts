import { NextRequest } from "next/server"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { auth } from "@/lib/auth"
import { getRelatedResources } from "@/features/resources/related-resources"

/**
 * GET /api/resources/[id]/related
 * Public: get related resources for a given resource.
 * Optionally personalized when user is authenticated.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await ctx.params
    const resourceId = Number(id)

    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      return apiError("Invalid resource ID", 422, "VALIDATION_ERROR")
    }

    // Optional auth -- don't fail if unauthenticated
    let userId: string | undefined
    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      })
      userId = session?.user?.id
    } catch {
      // Unauthenticated is fine for this endpoint
    }

    const results = await getRelatedResources(resourceId, userId)

    return apiSuccess(results)
  } catch (error) {
    return handleApiError(error)
  }
}
