import type { NextRequest } from "next/server"
import { z } from "zod"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import {
  listJobs,
  startResearchJob,
} from "@/features/ai/research-service"
import type { ResearchJobType } from "@/generated/prisma/client"
import { logAdminAction } from "@/features/admin/audit-service"

const researchJobSchema = z.object({
  type: z.enum(["validation", "enrichment", "discovery", "trend_analysis", "comprehensive"]),
  config: z.record(z.string(), z.unknown()).optional(),
})

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
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
    }

    const parsed = researchJobSchema.safeParse(body)
    if (!parsed.success) {
      return apiError("Invalid research job type", 422, "VALIDATION_ERROR")
    }

    const { type, config } = parsed.data
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
