import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import {
  listJobs,
  startResearchJob,
} from "@/features/ai/research-service"
import type { ResearchJobType } from "@/generated/prisma/client"
import { logAdminAction } from "@/features/admin/audit-service"

const VALID_TYPES: ResearchJobType[] = [
  "validation",
  "enrichment",
  "discovery",
  "trend_analysis",
  "comprehensive",
]

export const GET = withAdmin(async () => {
  try {
    const jobs = await listJobs()
    return apiSuccess(jobs)
  } catch (error) {
    return handleApiError(error)
  }
})

export const POST = withAdmin(async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
  try {
    const body = await req.json()
    const type = body.type as string

    if (!type || !VALID_TYPES.includes(type as ResearchJobType)) {
      return Response.json(
        {
          success: false,
          error: "Invalid research job type",
          code: "VALIDATION_ERROR",
        },
        { status: 422 }
      )
    }

    const config = body.config as Record<string, unknown> | undefined
    const jobId = await startResearchJob(type as ResearchJobType, config)

    logAdminAction({
      action: "research_start",
      performedById: ctx.user.id,
      newState: { jobId, type, config },
    }).catch(() => {})

    return apiSuccess({ jobId }, 201)
  } catch (error) {
    return handleApiError(error)
  }
})
