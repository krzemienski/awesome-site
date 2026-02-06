import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { updateSubSubcategorySchema } from "@/features/categories/category-schemas"
import {
  updateSubSubcategory,
  deleteSubSubcategory,
} from "@/features/categories/category-service"
import { logAdminAction } from "@/features/admin/audit-service"

export const PATCH = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const numericId = parseInt(id, 10)

      if (isNaN(numericId)) {
        return apiError("Invalid sub-subcategory ID", 400, "INVALID_ID")
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return Response.json(
          { success: false, error: "Invalid JSON body", code: "VALIDATION_ERROR" },
          { status: 422 }
        )
      }

      const parseResult = updateSubSubcategorySchema.safeParse(body)

      if (!parseResult.success) {
        return Response.json(
          {
            success: false,
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: parseResult.error.issues.map((i) => ({
              field: i.path.join("."),
              message: i.message,
            })),
          },
          { status: 422 }
        )
      }

      const subSubcategory = await updateSubSubcategory(numericId, parseResult.data)

      await logAdminAction({
        action: "sub_subcategory_update",
        performedById: ctx.user.id,
        previousState: { id: numericId },
        newState: { id: subSubcategory.id, name: subSubcategory.name, slug: subSubcategory.slug },
      })

      return apiSuccess(subSubcategory)
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
        return apiError("Invalid sub-subcategory ID", 400, "INVALID_ID")
      }

      await deleteSubSubcategory(numericId)

      await logAdminAction({
        action: "sub_subcategory_delete",
        performedById: ctx.user.id,
        previousState: { id: numericId },
      })

      return apiSuccess({ deleted: true })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
