import { NextRequest } from "next/server"
import { z } from "zod"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import {
  getAllSettings,
  setSetting,
} from "@/features/admin/settings-service"
import { logAdminAction } from "@/features/admin/audit-service"
import type { Prisma } from "@/generated/prisma/client"

const settingsSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
})

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
    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
    }

    const parsed = settingsSchema.safeParse(raw)
    if (!parsed.success) {
      return apiSuccess({ updated: 0 })
    }

    const entries = parsed.data.settings

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
