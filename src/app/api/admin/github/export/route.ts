import type { NextRequest } from "next/server"
import { z } from "zod"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { exportToGithub } from "@/features/github/sync-service"
import { logAdminAction } from "@/features/admin/audit-service"

const exportSchema = z.object({
  listId: z.number().int().positive(),
})

export const POST = withAdmin(async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
  try {
    const body = await req.json()
    const parsed = exportSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 422 }
      )
    }

    const result = await exportToGithub(parsed.data)

    logAdminAction({
      action: "github_export",
      performedById: ctx.user.id,
      newState: { listId: parsed.data.listId },
    }).catch(() => {})

    return apiSuccess(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
})
