import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiPaginated, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { createJourney } from "@/features/journeys/journey-service"
import { createJourneySchema } from "@/features/journeys/journey-schemas"
import { logAdminAction } from "@/features/admin/audit-service"
import { prisma } from "@/lib/prisma"

export const GET = withAdmin(
  async (req: NextRequest, _ctx: AuthenticatedRouteContext) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = Math.max(1, Number(searchParams.get("page") ?? 1))
      const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)))
      const skip = (page - 1) * limit

      const [items, total] = await Promise.all([
        prisma.learningJourney.findMany({
          include: {
            steps: { select: { id: true }, orderBy: { stepOrder: "asc" } },
            _count: { select: { steps: true, enrollments: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.learningJourney.count(),
      ])

      return apiPaginated(items, { total, page, limit, hasMore: skip + items.length < total })
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * POST /api/admin/journeys
 * Admin -- create a new journey (draft status).
 */
export const POST = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parsed = createJourneySchema.safeParse(body)
      if (!parsed.success) {
        return apiError(
          parsed.error.issues.map((i) => i.message).join(", "),
          422,
          "VALIDATION_ERROR"
        )
      }

      const journey = await createJourney(parsed.data, ctx.user.id)

      logAdminAction({
        action: "journey_create",
        performedById: ctx.user.id,
        newState: { journeyId: journey.id, title: journey.title },
      }).catch(() => {})

      return apiSuccess(journey, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
