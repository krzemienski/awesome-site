import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { searchAwesomeLists } from "@/features/github/github-client"

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") ?? ""

    if (query.length < 2) {
      return apiSuccess([])
    }

    const results = await searchAwesomeLists(query)
    return apiSuccess(results)
  } catch (error) {
    return handleApiError(error)
  }
})
