import { NextRequest } from "next/server"
import { z } from "zod"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

const feedbackSchema = z.object({
  resourceId: z.number().int().positive(),
  feedback: z.enum(["up", "down"]),
})

/**
 * POST /api/recommendations/feedback -- Store recommendation feedback.
 * Body: { resourceId: number, feedback: "up" | "down" }
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

      const result = feedbackSchema.safeParse(body)
      if (!result.success) {
        return apiError("Validation failed", 422, "VALIDATION_ERROR")
      }

      const { resourceId, feedback } = result.data

      await prisma.userInteraction.create({
        data: {
          userId: ctx.user.id,
          resourceId,
          type: "rate",
          metadata: { feedback },
        },
      })

      return apiSuccess({ stored: true })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
