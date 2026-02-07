import type { NextRequest } from "next/server"
import { z } from "zod"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { importFromGithub } from "@/features/github/sync-service"
import { logAdminAction } from "@/features/admin/audit-service"

const importSchema = z.object({
  listId: z.number().int().positive(),
  conflictStrategy: z.enum(["skip", "update", "create"]).default("skip"),
  autoApprove: z.boolean().default(false),
})

export const POST = withAdmin(async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
  try {
    const body = await req.json()
    const parsed = importSchema.safeParse(body)

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

    const result = await importFromGithub(parsed.data)

    logAdminAction({
      action: "github_import",
      performedById: ctx.user.id,
      newState: {
        listId: parsed.data.listId,
        conflictStrategy: parsed.data.conflictStrategy,
        autoApprove: parsed.data.autoApprove,
      },
    }).catch(() => {})

    return apiSuccess(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
})
