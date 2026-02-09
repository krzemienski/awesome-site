import type { NextRequest } from "next/server"
import { z } from "zod"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { banUser, unbanUser } from "@/features/admin/user-management-service"
import { logAdminAction } from "@/features/admin/audit-service"

const banSchema = z.object({
  action: z.enum(["ban", "unban"]),
  reason: z.string().optional(),
  expires: z.string().optional(),
})

export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }

      if (ctx.user.id === id) {
        return apiError("Cannot ban/unban yourself", 400, "SELF_BAN")
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parsed = banSchema.safeParse(body)
      if (!parsed.success) {
        return apiError(
          'Invalid action. Must be "ban" or "unban"',
          400,
          "INVALID_ACTION"
        )
      }

      const { action, reason, expires } = parsed.data

      if (action === "ban") {
        const expiresDate = expires ? new Date(expires) : undefined
        const user = await banUser(id, reason, expiresDate)

        await logAdminAction({
          action: "user_ban",
          performedById: ctx.user.id,
          newState: { userId: id, reason, expires },
        })

        return apiSuccess(user)
      }

      const user = await unbanUser(id)

      await logAdminAction({
        action: "user_unban",
        performedById: ctx.user.id,
        newState: { userId: id },
      })

      return apiSuccess(user)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
