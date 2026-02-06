import type { NextRequest } from "next/server"
import { z } from "zod"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { logAdminAction } from "@/features/admin/audit-service"

const configUpdateSchema = z.object({
  repoOwner: z.string().min(1),
  repoName: z.string().min(1),
  branch: z.string().min(1).default("main"),
  filePath: z.string().min(1).default("README.md"),
  token: z.string().optional(),
  syncEnabled: z.boolean().default(false),
})

export const GET = withAdmin(async () => {
  try {
    const list = await prisma.awesomeList.findFirst({
      orderBy: { createdAt: "desc" },
    })

    if (!list) {
      return apiSuccess({
        id: null,
        repoOwner: "",
        repoName: "",
        branch: "main",
        filePath: "README.md",
        token: "",
        syncEnabled: false,
        lastSyncAt: null,
      })
    }

    const config = (list.config ?? {}) as Record<string, unknown>

    return apiSuccess({
      id: list.id,
      repoOwner: list.repoOwner,
      repoName: list.repoName,
      branch: list.branch,
      filePath: list.filePath,
      token: (config.token as string) ?? "",
      syncEnabled: list.syncEnabled,
      lastSyncAt: list.lastSyncAt,
    })
  } catch (error) {
    return handleApiError(error)
  }
})

export const PUT = withAdmin(async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
  try {
    const body = await req.json()
    const parsed = configUpdateSchema.safeParse(body)

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

    const { repoOwner, repoName, branch, filePath, token, syncEnabled } =
      parsed.data

    const configJson = token
      ? ({ token } as unknown as Prisma.InputJsonValue)
      : ({} as unknown as Prisma.InputJsonValue)

    const list = await prisma.awesomeList.upsert({
      where: {
        repoOwner_repoName: { repoOwner, repoName },
      },
      update: {
        name: `${repoOwner}/${repoName}`,
        branch,
        filePath,
        syncEnabled,
        config: configJson,
      },
      create: {
        name: `${repoOwner}/${repoName}`,
        repoOwner,
        repoName,
        branch,
        filePath,
        syncEnabled,
        config: configJson,
      },
    })

    logAdminAction({
      action: "github_config_update",
      performedById: ctx.user.id,
      newState: {
        repoOwner,
        repoName,
        branch,
        filePath,
        syncEnabled,
      },
    }).catch(() => {})

    return apiSuccess({
      id: list.id,
      repoOwner: list.repoOwner,
      repoName: list.repoName,
      branch: list.branch,
      filePath: list.filePath,
      syncEnabled: list.syncEnabled,
      lastSyncAt: list.lastSyncAt,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
