import { NextRequest } from "next/server"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { trackInteraction } from "@/features/user/interaction-service"
import type { InteractionType } from "@/generated/prisma/client"

const VALID_TYPES: InteractionType[] = [
  "view",
  "click",
  "bookmark",
  "rate",
  "complete",
]

/**
 * POST /api/interactions -- Track a user interaction event.
 * Body: { resourceId: number, type: InteractionType, metadata?: Record<string, unknown> }
 */
export const POST = withAuth(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const body = await req.json()
      const resourceId = Number(body.resourceId)
      const type = body.type as InteractionType
      const metadata = body.metadata as Record<string, unknown> | undefined

      if (!Number.isInteger(resourceId) || resourceId <= 0) {
        return apiError("Invalid resourceId", 422, "VALIDATION_ERROR")
      }

      if (!VALID_TYPES.includes(type)) {
        return apiError(
          `Invalid interaction type. Must be one of: ${VALID_TYPES.join(", ")}`,
          422,
          "VALIDATION_ERROR"
        )
      }

      const interaction = await trackInteraction(
        ctx.user.id,
        resourceId,
        type,
        metadata
      )
      return apiSuccess(interaction, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
