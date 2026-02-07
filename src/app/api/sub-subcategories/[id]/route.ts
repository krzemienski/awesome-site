import { NextRequest } from "next/server"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { updateSubSubcategorySchema } from "@/features/categories/category-schemas"
import {
  getSubSubcategory,
  updateSubSubcategory,
  deleteSubSubcategory,
} from "@/features/categories/category-service"

/**
 * Parse and validate the sub-subcategory ID from route params.
 */
async function parseSubSubcategoryId(
  params: Promise<{ id: string }>
): Promise<number | null> {
  const { id } = await params
  const parsed = parseInt(id, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/**
 * GET /api/sub-subcategories/[id]
 * Public: get sub-subcategory detail with resource count.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const subSubcategoryId = await parseSubSubcategoryId(params)

    if (!subSubcategoryId) {
      return apiError("Invalid ID", 400, "VALIDATION_ERROR")
    }

    const subSubcategory = await getSubSubcategory(subSubcategoryId)
    return apiSuccess(subSubcategory)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/sub-subcategories/[id]
 * Admin: update a sub-subcategory.
 */
export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext): Promise<Response> => {
    try {
      const subSubcategoryId = await parseSubSubcategoryId(
        ctx.params as Promise<{ id: string }>
      )

      if (!subSubcategoryId) {
        return apiError("Invalid ID", 400, "VALIDATION_ERROR")
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
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

      const subSubcategory = await updateSubSubcategory(
        subSubcategoryId,
        parseResult.data
      )
      return apiSuccess(subSubcategory)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * DELETE /api/sub-subcategories/[id]
 * Admin: delete a sub-subcategory (protected if has resources).
 */
export const DELETE = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext): Promise<Response> => {
    try {
      const subSubcategoryId = await parseSubSubcategoryId(
        ctx.params as Promise<{ id: string }>
      )

      if (!subSubcategoryId) {
        return apiError("Invalid ID", 400, "VALIDATION_ERROR")
      }

      await deleteSubSubcategory(subSubcategoryId)
      return apiSuccess({ deleted: true })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
