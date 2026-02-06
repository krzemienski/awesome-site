import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { updateSubcategorySchema } from "@/features/categories/category-schemas"
import {
  updateSubcategory,
  deleteSubcategory,
} from "@/features/categories/category-service"
import { logAdminAction } from "@/features/admin/audit-service"

export const PATCH = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const numericId = parseInt(id, 10)

      if (isNaN(numericId)) {
        return apiError("Invalid subcategory ID", 400, "INVALID_ID")
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

      const parseResult = updateSubcategorySchema.safeParse(body)

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

      const subcategory = await updateSubcategory(numericId, parseResult.data)

      await logAdminAction({
        action: "subcategory_update",
        performedById: ctx.user.id,
        previousState: { id: numericId },
        newState: { id: subcategory.id, name: subcategory.name, slug: subcategory.slug },
      })

      return apiSuccess(subcategory)
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
        return apiError("Invalid subcategory ID", 400, "INVALID_ID")
      }

      await deleteSubcategory(numericId)

      await logAdminAction({
        action: "subcategory_delete",
        performedById: ctx.user.id,
        previousState: { id: numericId },
      })

      return apiSuccess({ deleted: true })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
