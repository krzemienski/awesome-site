import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiPaginated } from "@/lib/api-response"
import { handleApiError } from "@/lib/api-response"
import { listUsers } from "@/features/admin/user-management-service"

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "1", 10) - 1)
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)))
    const search = url.searchParams.get("search") ?? undefined
    const role = url.searchParams.get("role") ?? undefined

    const { users, total } = await listUsers({ page, limit, search, role })

    return apiPaginated(users, {
      total,
      page: page + 1,
      limit,
      hasMore: (page + 1) * limit < total,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
