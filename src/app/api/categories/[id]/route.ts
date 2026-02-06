import { NextRequest } from "next/server"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { updateCategorySchema } from "@/features/categories/category-schemas"
import {
  getCategory,
  updateCategory,
  deleteCategory,
} from "@/features/categories/category-service"

/**
 * Parse and validate the category ID from route params.
 */
async function parseCategoryId(
  params: Promise<{ id: string }>
): Promise<number | null> {
  const { id } = await params
  const parsed = parseInt(id, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/**
 * GET /api/categories/[id]
 * Public: get category detail with children and resource counts.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const categoryId = await parseCategoryId(params)

    if (!categoryId) {
      return apiError("Invalid ID", 400, "VALIDATION_ERROR")
    }

    const category = await getCategory(categoryId)
    return apiSuccess(category)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/categories/[id]
 * Admin: update a category.
 */
export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext): Promise<Response> => {
    try {
      const categoryId = await parseCategoryId(ctx.params as Promise<{ id: string }>)

      if (!categoryId) {
        return apiError("Invalid ID", 400, "VALIDATION_ERROR")
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parseResult = updateCategorySchema.safeParse(body)

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

      const category = await updateCategory(categoryId, parseResult.data)
      return apiSuccess(category)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * DELETE /api/categories/[id]
 * Admin: delete a category (protected if has resources or subcategories).
 */
export const DELETE = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext): Promise<Response> => {
    try {
      const categoryId = await parseCategoryId(ctx.params as Promise<{ id: string }>)

      if (!categoryId) {
        return apiError("Invalid ID", 400, "VALIDATION_ERROR")
      }

      await deleteCategory(categoryId)
      return apiSuccess({ deleted: true })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
