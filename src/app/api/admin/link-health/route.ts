import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import {
  checkLinks,
  getResults,
  type LinkHealthFilter,
} from "@/features/admin/link-health-service"

export const POST = withAdmin(async (_req: NextRequest) => {
  try {
    const report = await checkLinks()
    return apiSuccess(report, 201)
  } catch (error) {
    return handleApiError(error)
  }
})

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const filter = (searchParams.get("filter") ?? "all") as LinkHealthFilter

    const validFilters: LinkHealthFilter[] = ["broken", "healthy", "all"]
    const safeFilter = validFilters.includes(filter) ? filter : "all"

    const results = await getResults(safeFilter)

    if (!results) {
      return apiSuccess({
        totalChecked: 0,
        healthy: 0,
        broken: 0,
        timeout: 0,
        results: [],
        startedAt: null,
        completedAt: null,
      })
    }

    return apiSuccess(results)
  } catch (error) {
    return handleApiError(error)
  }
})
