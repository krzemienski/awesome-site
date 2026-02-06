import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import {
  getJobStatus,
  cancelJob,
} from "@/features/ai/enrichment-service"

export const GET = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const jobId = Number(id)

      if (Number.isNaN(jobId)) {
        return apiError("Invalid job ID", 422, "VALIDATION_ERROR")
      }

      const job = await getJobStatus(jobId)

      if (!job) {
        return apiError("Enrichment job not found", 404, "NOT_FOUND")
      }

      return apiSuccess(job)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

export const DELETE = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const jobId = Number(id)

      if (Number.isNaN(jobId)) {
        return apiError("Invalid job ID", 422, "VALIDATION_ERROR")
      }

      await cancelJob(jobId)
      return apiSuccess({ message: "Job cancelled" })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
