import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { getJobReport } from "@/features/ai/research-service"

export const GET = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const jobId = Number(id)

      if (Number.isNaN(jobId)) {
        return apiError("Invalid job ID", 422, "VALIDATION_ERROR")
      }

      const report = await getJobReport(jobId)
      return apiSuccess(report)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
