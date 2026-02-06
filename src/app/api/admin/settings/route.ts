import { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import {
  getAllSettings,
  setSetting,
} from "@/features/admin/settings-service"
import { logAdminAction } from "@/features/admin/audit-service"
import type { Prisma } from "@/generated/prisma/client"

export const GET = withAdmin(async () => {
  try {
    const settings = await getAllSettings()
    return apiSuccess(settings)
  } catch (error) {
    return handleApiError(error)
  }
})

export const PUT = withAdmin(async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
  try {
    const body = await req.json()
    const entries = body.settings as Record<string, unknown> | undefined

    if (!entries || typeof entries !== "object") {
      return apiSuccess({ updated: 0 })
    }

    const keys = Object.keys(entries)
    for (const key of keys) {
      await setSetting(key, entries[key] as Prisma.InputJsonValue)
    }

    await logAdminAction({
      action: "settings_update",
      performedById: ctx.user.id,
      newState: { updatedKeys: keys },
    })

    return apiSuccess({ updated: keys.length })
  } catch (error) {
    return handleApiError(error)
  }
})
