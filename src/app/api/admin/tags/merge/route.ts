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
        for (const sourceId of sourceTagIds) {
          const resourceTags = await tx.resourceTag.findMany({
            where: { tagId: sourceId },
          })

          for (const rt of resourceTags) {
            const exists = await tx.resourceTag.findUnique({
              where: {
                resourceId_tagId: {
                  resourceId: rt.resourceId,
                  tagId: targetTagId,
                },
              },
            })

            if (!exists) {
              await tx.resourceTag.update({
                where: { id: rt.id },
                data: { tagId: targetTagId },
              })
            } else {
              await tx.resourceTag.delete({ where: { id: rt.id } })
            }
          }

          await tx.tag.delete({ where: { id: sourceId } })
        }
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
