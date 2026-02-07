import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { prisma } from "@/lib/prisma"
import { updateResourceSchema } from "@/features/resources/resource-schemas"
import { createAuditLog } from "@/features/admin/audit-service"

export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const resourceId = Number(id)

      if (isNaN(resourceId)) {
        return apiError("Invalid resource ID", 400, "INVALID_ID")
      }

      const existing = await prisma.resource.findUnique({
        where: { id: resourceId },
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      })

      if (!existing) {
        return apiError("Resource not found", 404, "NOT_FOUND")
      }

      const body = await req.json()
      const parsed = updateResourceSchema.safeParse(body)

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

      const { tags, ...data } = parsed.data

      const previousState = {
        title: existing.title,
        url: existing.url,
        description: existing.description,
        status: existing.status,
        categoryId: existing.categoryId,
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (tags !== undefined) {
          await tx.resourceTag.deleteMany({ where: { resourceId } })

          if (tags.length > 0) {
            for (const name of tags) {
              const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")

              const tag = await tx.tag.upsert({
                where: { slug },
                update: {},
                create: { name, slug },
              })

              await tx.resourceTag.create({
                data: { resourceId, tagId: tag.id },
              })
            }
          }
        }

        return tx.resource.update({
          where: { id: resourceId },
          data: {
            ...data,
            metadata: data.metadata
              ? JSON.parse(JSON.stringify(data.metadata))
              : undefined,
          },
          include: {
            category: true,
            subcategory: true,
            subSubcategory: true,
            tags: { include: { tag: true } },
          },
        })
      })

      await createAuditLog({
        resourceId,
        action: "update",
        performedById: ctx.user.id,
        previousState,
        newState: {
          title: updated.title,
          url: updated.url,
          description: updated.description,
          status: updated.status,
          categoryId: updated.categoryId,
        },
      })

      return apiSuccess(updated)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

export const DELETE = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const resourceId = Number(id)

      if (isNaN(resourceId)) {
        return apiError("Invalid resource ID", 400, "INVALID_ID")
      }

      const existing = await prisma.resource.findUnique({
        where: { id: resourceId },
        select: { id: true, title: true, url: true, status: true },
      })

      if (!existing) {
        return apiError("Resource not found", 404, "NOT_FOUND")
      }

      await prisma.resource.update({
        where: { id: resourceId },
        data: { status: "rejected" },
      })

      await createAuditLog({
        resourceId,
        action: "delete",
        performedById: ctx.user.id,
        previousState: {
          title: existing.title,
          url: existing.url,
          status: existing.status,
        },
        newState: { status: "rejected" },
      })

      return apiSuccess({ deleted: true })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
