import type { NextRequest } from "next/server"
import { z } from "zod"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { changeRole } from "@/features/admin/user-management-service"
import { logAdminAction } from "@/features/admin/audit-service"

const roleSchema = z.object({
  role: z.enum(["user", "admin"]),
})

export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }

      if (ctx.user.id === id) {
        return apiError("Cannot change your own role", 400, "SELF_ROLE_CHANGE")
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parsed = roleSchema.safeParse(body)
      if (!parsed.success) {
        return apiError(
          "Invalid role. Must be one of: user, admin",
          400,
          "INVALID_ROLE"
        )
      }

      const { role } = parsed.data

      const user = await changeRole(id, role)

      await logAdminAction({
        action: "user_role_change",
        performedById: ctx.user.id,
        previousState: { userId: id },
        newState: { userId: id, role },
      })

      return apiSuccess(user)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
