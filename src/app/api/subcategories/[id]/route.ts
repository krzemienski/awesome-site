import { NextRequest } from "next/server"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { updateSubcategorySchema } from "@/features/categories/category-schemas"
import {
  getSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "@/features/categories/category-service"

/**
 * Parse and validate the subcategory ID from route params.
 */
async function parseSubcategoryId(
  params: Promise<{ id: string }>
): Promise<number | null> {
  const { id } = await params
  const parsed = parseInt(id, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/**
 * GET /api/subcategories/[id]
 * Public: get subcategory detail with children and resource count.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const subcategoryId = await parseSubcategoryId(params)

    if (!subcategoryId) {
      return apiError("Invalid ID", 400, "VALIDATION_ERROR")
    }

    const subcategory = await getSubcategory(subcategoryId)
    return apiSuccess(subcategory)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/subcategories/[id]
 * Admin: update a subcategory.
 */
export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext): Promise<Response> => {
    try {
      const subcategoryId = await parseSubcategoryId(
        ctx.params as Promise<{ id: string }>
      )

      if (!subcategoryId) {
        return apiError("Invalid ID", 400, "VALIDATION_ERROR")
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
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

      const subcategory = await updateSubcategory(
        subcategoryId,
        parseResult.data
      )
      return apiSuccess(subcategory)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * DELETE /api/subcategories/[id]
 * Admin: delete a subcategory (protected if has resources or sub-subcategories).
 */
export const DELETE = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext): Promise<Response> => {
    try {
      const subcategoryId = await parseSubcategoryId(
        ctx.params as Promise<{ id: string }>
      )

      if (!subcategoryId) {
        return apiError("Invalid ID", 400, "VALIDATION_ERROR")
      }

      await deleteSubcategory(subcategoryId)
      return apiSuccess({ deleted: true })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
