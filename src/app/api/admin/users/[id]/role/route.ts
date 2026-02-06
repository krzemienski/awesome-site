import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { changeRole } from "@/features/admin/user-management-service"

const VALID_ROLES = ["user", "admin"] as const

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

      const { role } = body as { role?: string }

      if (!role || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
        return apiError(
          `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
          400,
          "INVALID_ROLE"
        )
      }

      const user = await changeRole(id, role)
      return apiSuccess(user)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
