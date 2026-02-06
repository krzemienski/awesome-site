import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { prisma } from "@/lib/prisma"
import { logAdminAction } from "@/features/admin/audit-service"

export const GET = withAdmin(
  async (_req: NextRequest, _ctx: AuthenticatedRouteContext) => {
    try {
      const tags = await prisma.tag.findMany({
        include: { _count: { select: { resources: true } } },
        orderBy: { name: "asc" },
      })

      return apiSuccess(tags)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

export const POST = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const { name, description } = body as { name?: string; description?: string | null }

      if (!name || name.trim().length === 0) {
        return apiError("Tag name is required", 422, "VALIDATION_ERROR")
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

      const existing = await prisma.tag.findUnique({ where: { slug } })
      if (existing) {
        return apiError(`Tag with slug "${slug}" already exists`, 409, "DUPLICATE_SLUG")
      }

      const tag = await prisma.tag.create({
        data: { name: name.trim(), slug, description: description ?? null },
        include: { _count: { select: { resources: true } } },
      })

      logAdminAction({
        action: "tag_create",
        performedById: ctx.user.id,
        newState: { id: tag.id, name: tag.name, slug: tag.slug },
      }).catch(() => {})

      return apiSuccess(tag, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
