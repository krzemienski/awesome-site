import type { NextRequest } from "next/server"
import { z } from "zod"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { prisma } from "@/lib/prisma"
import { logAdminAction } from "@/features/admin/audit-service"

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
}).refine(
  (data) => data.name !== undefined || data.slug !== undefined || data.description !== undefined,
  { message: "At least one field (name, slug, description) is required" }
)

export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const numericId = parseInt(id, 10)

      if (isNaN(numericId)) {
        return apiError("Invalid tag ID", 400, "INVALID_ID")
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parsed = updateTagSchema.safeParse(body)
      if (!parsed.success) {
        return apiError("At least one field (name, slug, description) is required", 422, "VALIDATION_ERROR")
      }

      const { name, slug, description } = parsed.data

      const existing = await prisma.tag.findUnique({ where: { id: numericId } })
      if (!existing) {
        return apiError("Tag not found", 404, "NOT_FOUND")
      }

      const resolvedSlug = slug
        ? slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        : name
          ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
          : undefined

      if (resolvedSlug) {
        const duplicate = await prisma.tag.findUnique({ where: { slug: resolvedSlug } })
        if (duplicate && duplicate.id !== numericId) {
          return apiError(`Tag with slug "${resolvedSlug}" already exists`, 409, "DUPLICATE_SLUG")
        }
      }

      const tag = await prisma.tag.update({
        where: { id: numericId },
        data: {
          ...(name !== undefined && { name }),
          ...(resolvedSlug !== undefined && { slug: resolvedSlug }),
          ...(description !== undefined && { description }),
        },
        include: { _count: { select: { resources: true } } },
      })

      await logAdminAction({
        action: "tag_update",
        performedById: ctx.user.id,
        previousState: { id: existing.id, name: existing.name, slug: existing.slug },
        newState: { id: tag.id, name: tag.name, slug: tag.slug },
      })

      return apiSuccess(tag)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

export const DELETE = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const numericId = parseInt(id, 10)

      if (isNaN(numericId)) {
        return apiError("Invalid tag ID", 400, "INVALID_ID")
      }

      const existing = await prisma.tag.findUnique({ where: { id: numericId } })
      if (!existing) {
        return apiError("Tag not found", 404, "NOT_FOUND")
      }

      const usageCount = await prisma.resourceTag.count({ where: { tagId: numericId } })
      if (usageCount > 0) {
        return apiError(
          "Cannot delete tag with associated resources. Merge instead.",
          409,
          "DELETE_PROTECTED"
        )
      }

      await prisma.tag.delete({ where: { id: numericId } })

      await logAdminAction({
        action: "tag_delete",
        performedById: ctx.user.id,
        previousState: { id: existing.id, name: existing.name, slug: existing.slug },
      })

      return apiSuccess({ deleted: true })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
