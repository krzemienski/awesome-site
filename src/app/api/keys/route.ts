import type { NextRequest } from "next/server"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { createApiKeySchema } from "@/features/api-keys/api-key-schemas"
import { createKey, listKeys } from "@/features/api-keys/api-key-service"

export const GET = withAuth(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { keys } = await listKeys({ userId: ctx.user.id })

      const safeKeys = keys.map(({ user: _user, ...key }) => key)

      return apiSuccess(safeKeys)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

export const POST = withAuth(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const body = await req.json()
      const parsed = createApiKeySchema.safeParse(body)

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

      const result = await createKey({
        userId: ctx.user.id,
        name: parsed.data.name,
        tier: parsed.data.tier as "free" | "standard" | "premium" | undefined,
        expiresAt: parsed.data.expiresAt,
        scopes: parsed.data.scopes,
      })

      return apiSuccess(result, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
