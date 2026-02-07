import type { NextRequest } from "next/server"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { revokeKey } from "@/features/api-keys/api-key-service"

export const DELETE = withAuth(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }

      await revokeKey(id, ctx.user.id)

      return apiSuccess({ message: "API key revoked" })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
