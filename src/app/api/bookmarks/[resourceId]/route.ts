import { z } from "zod"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import {
  toggleBookmark,
  updateBookmarkNotes,
} from "@/features/user/bookmark-service"
import { prisma } from "@/lib/prisma"

const updateNotesSchema = z.object({
  notes: z.string(),
})

/**
 * POST /api/bookmarks/[resourceId] -- Add bookmark for a resource.
 */
export const POST = withAuth(
  async (_req: Request, ctx: AuthenticatedRouteContext) => {
    try {
      const { resourceId: rawId } = (await ctx.params) as {
        resourceId: string
      }
      const resourceId = parseInt(rawId, 10)

      if (isNaN(resourceId)) {
        return apiError("Invalid resource ID", 422, "VALIDATION_ERROR")
      }

      const result = await toggleBookmark(ctx.user.id, resourceId)
      return apiSuccess(result, result.bookmarked ? 201 : 200)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * PUT /api/bookmarks/[resourceId] -- Update notes on a bookmark.
 */
export const PUT = withAuth(
  async (req: Request, ctx: AuthenticatedRouteContext) => {
    try {
      const { resourceId: rawId } = (await ctx.params) as {
        resourceId: string
      }
      const resourceId = parseInt(rawId, 10)

      if (isNaN(resourceId)) {
        return apiError("Invalid resource ID", 422, "VALIDATION_ERROR")
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parsed = updateNotesSchema.safeParse(body)
      if (!parsed.success) {
        return apiError(
          "notes field is required and must be a string",
          422,
          "VALIDATION_ERROR"
        )
      }

      await updateBookmarkNotes(ctx.user.id, resourceId, parsed.data.notes)
      return apiSuccess({ updated: true })
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * DELETE /api/bookmarks/[resourceId] -- Remove bookmark for a resource.
 */
export const DELETE = withAuth(
  async (_req: Request, ctx: AuthenticatedRouteContext) => {
    try {
      const { resourceId: rawId } = (await ctx.params) as {
        resourceId: string
      }
      const resourceId = parseInt(rawId, 10)

      if (isNaN(resourceId)) {
        return apiError("Invalid resource ID", 422, "VALIDATION_ERROR")
      }

      const existing = await prisma.userBookmark.findUnique({
        where: {
          userId_resourceId: { userId: ctx.user.id, resourceId },
        },
      })

      if (!existing) {
        return apiError("Bookmark not found", 404, "NOT_FOUND")
      }

      await prisma.userBookmark.delete({ where: { id: existing.id } })
      return apiSuccess({ bookmarked: false })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
