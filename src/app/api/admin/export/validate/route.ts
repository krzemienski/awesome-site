import type { NextRequest } from "next/server"
import { z } from "zod"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { validateAwesomeLint } from "@/features/admin/export-service"

const validateSchema = z.object({
  markdown: z.string().min(1),
})

/**
 * POST /api/admin/export/validate -- Validate markdown against awesome-lint rules
 * Body: { markdown: string }
 */
export const POST = withAdmin(async (req: NextRequest) => {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
    }

    const parsed = validateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(
        "Missing required field: markdown (string)",
        422,
        "VALIDATION_ERROR"
      )
    }

    const result = validateAwesomeLint(parsed.data.markdown)

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
})
