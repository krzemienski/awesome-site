import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { updateApiKeyTierSchema } from "@/features/api-keys/api-key-schemas"
import {
  updateKeyTier,
  revokeKey,
} from "@/features/api-keys/api-key-service"
import { logAdminAction } from "@/features/admin/audit-service"

export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const body = await req.json()
      const parsed = updateApiKeyTierSchema.safeParse(body)

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

      const updated = await updateKeyTier(id, parsed.data.tier)

      logAdminAction({
        action: "api_key_tier_change",
        performedById: ctx.user.id,
        newState: { keyId: updated.id, tier: updated.tier },
      }).catch(() => {})

      return apiSuccess({
        id: updated.id,
        keyPrefix: updated.keyPrefix,
        name: updated.name,
        tier: updated.tier,
      })
    } catch (error) {
      return handleApiError(error)
    }
  }
)

export const DELETE = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }

      await revokeKey(id)

      logAdminAction({
        action: "api_key_revoke",
        performedById: ctx.user.id,
        newState: { keyId: id },
      }).catch(() => {})

      return apiSuccess({ message: "API key revoked" })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
