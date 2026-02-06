import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiPaginated, handleApiError } from "@/lib/api-response"
import { listKeys } from "@/features/api-keys/api-key-service"

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const page = Math.max(
      0,
      parseInt(url.searchParams.get("page") ?? "1", 10) - 1
    )
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10))
    )
    const tier = url.searchParams.get("tier") ?? undefined
    const status = url.searchParams.get("status") ?? undefined

    const { keys, total } = await listKeys({ page, limit, tier, status })

    return apiPaginated(keys, {
      total,
      page: page + 1,
      limit,
      hasMore: (page + 1) * limit < total,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
