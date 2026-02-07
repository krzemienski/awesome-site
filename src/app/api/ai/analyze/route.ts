import { NextRequest } from "next/server"
import { withAuth } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { analyzeUrlSchema } from "@/features/ai/ai-schemas"
import { analyzeUrl } from "@/features/ai/claude-service"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"

export const POST = withAuth(
  async (req: NextRequest, _ctx: AuthenticatedRouteContext) => {
    try {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return Response.json(
          {
            success: false,
            error: "Invalid JSON body",
            code: "VALIDATION_ERROR",
          },
          { status: 422 }
        )
      }

      const parsed = analyzeUrlSchema.safeParse(body)
      if (!parsed.success) {
        return Response.json(
          {
            success: false,
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: parsed.error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          },
          { status: 422 }
        )
      }

      const result = await analyzeUrl(parsed.data.url)
      return apiSuccess(result)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
