import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { banUser, unbanUser } from "@/features/admin/user-management-service"

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

      const { action, reason, expires } = body as {
        action?: "ban" | "unban"
        reason?: string
        expires?: string
      }

      if (!action || (action !== "ban" && action !== "unban")) {
        return apiError(
          'Invalid action. Must be "ban" or "unban"',
          400,
          "INVALID_ACTION"
        )
      }

      if (action === "ban") {
        const expiresDate = expires ? new Date(expires) : undefined
        const user = await banUser(id, reason, expiresDate)
        return apiSuccess(user)
      }

      const user = await unbanUser(id)
      return apiSuccess(user)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
