import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { enrichmentJobConfigSchema } from "@/features/ai/ai-schemas"
import { startJob } from "@/features/ai/enrichment-service"
import { logAdminAction } from "@/features/admin/audit-service"

export const POST = withAdmin(async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
  try {
    const body = await req.json()
    const parsed = enrichmentJobConfigSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 422 }
      )
    }

    const jobId = await startJob(parsed.data.filter)

    logAdminAction({
      action: "enrichment_start",
      performedById: ctx.user.id,
      newState: { jobId, filter: parsed.data.filter },
    }).catch(() => {})

    return apiSuccess({ jobId }, 201)
  } catch (error) {
    return handleApiError(error)
  }
})
