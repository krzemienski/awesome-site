import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { validateAwesomeLint } from "@/features/admin/export-service"

/**
 * POST /api/admin/export/validate -- Validate markdown against awesome-lint rules
 * Body: { markdown: string }
 */
export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()

    if (!body.markdown || typeof body.markdown !== "string") {
      return apiError(
        "Missing required field: markdown (string)",
        422,
        "VALIDATION_ERROR"
      )
    }

    const result = validateAwesomeLint(body.markdown)

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
})
