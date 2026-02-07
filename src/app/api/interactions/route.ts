import { NextRequest } from "next/server"
import { z } from "zod"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { trackInteraction } from "@/features/user/interaction-service"
import type { InteractionType } from "@/generated/prisma/client"

const interactionSchema = z.object({
  resourceId: z.number().int().positive(),
  type: z.enum(["view", "click", "bookmark", "rate", "complete"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * POST /api/interactions -- Track a user interaction event.
 * Body: { resourceId: number, type: InteractionType, metadata?: Record<string, unknown> }
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

      const parsed = interactionSchema.safeParse(body)
      if (!parsed.success) {
        return apiError(
          "Invalid request body. Required: resourceId (positive int), type (view|click|bookmark|rate|complete)",
          422,
          "VALIDATION_ERROR"
        )
      }

      const { resourceId, type, metadata } = parsed.data

      const interaction = await trackInteraction(
        ctx.user.id,
        resourceId,
        type as InteractionType,
        metadata
      )
      return apiSuccess(interaction, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
