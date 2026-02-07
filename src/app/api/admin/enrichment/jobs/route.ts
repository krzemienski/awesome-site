import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { listJobs } from "@/features/ai/enrichment-service"

export const GET = withAdmin(async () => {
  try {
    const jobs = await listJobs()
    return apiSuccess(jobs)
  } catch (error) {
    return handleApiError(error)
  }
})
