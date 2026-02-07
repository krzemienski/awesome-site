import type { NextRequest } from "next/server"
import { z } from "zod"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { prisma } from "@/lib/prisma"
import { logAdminAction } from "@/features/admin/audit-service"

const mergeTagsSchema = z.object({
  sourceTagIds: z.array(z.number().int().positive()).min(1),
  targetTagId: z.number().int().positive(),
})

export const POST = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parsed = mergeTagsSchema.safeParse(body)
      if (!parsed.success) {
        return apiError(
          "sourceTagIds (non-empty array) and targetTagId (number) are required",
          422,
          "VALIDATION_ERROR"
        )
      }

      const { sourceTagIds, targetTagId } = parsed.data

      if (sourceTagIds.includes(targetTagId)) {
        return apiError("Target tag cannot be in source tags", 422, "VALIDATION_ERROR")
      }

      const targetTag = await prisma.tag.findUnique({ where: { id: targetTagId } })
      if (!targetTag) {
        return apiError("Target tag not found", 404, "NOT_FOUND")
      }

      await prisma.$transaction(async (tx) => {
        // Find all resource IDs already linked to the target tag
        const existingTargetLinks = await tx.resourceTag.findMany({
          where: { tagId: targetTagId },
          select: { resourceId: true },
        })
        const alreadyLinkedIds = new Set(existingTargetLinks.map((l) => l.resourceId))

        // Find all resource-tag rows for source tags
        const sourceResourceTags = await tx.resourceTag.findMany({
          where: { tagId: { in: sourceTagIds } },
        })

        // Partition into rows to re-point vs rows to delete (duplicates)
        const toRepoint = sourceResourceTags.filter((rt) => !alreadyLinkedIds.has(rt.resourceId))
        const toDelete = sourceResourceTags.filter((rt) => alreadyLinkedIds.has(rt.resourceId))

        // Batch re-point: update rows that don't conflict with target
        if (toRepoint.length > 0) {
          await tx.resourceTag.updateMany({
            where: { id: { in: toRepoint.map((rt) => rt.id) } },
            data: { tagId: targetTagId },
          })
        }

        // Batch delete: remove duplicate rows
        if (toDelete.length > 0) {
          await tx.resourceTag.deleteMany({
            where: { id: { in: toDelete.map((rt) => rt.id) } },
          })
        }

        // Delete source tags
        await tx.tag.deleteMany({
          where: { id: { in: sourceTagIds } },
        })
      })

      const updatedTag = await prisma.tag.findUnique({
        where: { id: targetTagId },
        include: { _count: { select: { resources: true } } },
      })

      await logAdminAction({
        action: "tag_merge",
        performedById: ctx.user.id,
        previousState: { sourceTagIds },
        newState: { targetTagId, targetTagName: targetTag.name },
      })

      return apiSuccess(updatedTag)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
