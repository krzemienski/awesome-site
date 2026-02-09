import { NextRequest } from "next/server"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { createSubcategorySchema } from "@/features/categories/category-schemas"
import {
  getCategoryTree,
  createSubcategory,
} from "@/features/categories/category-service"

/**
 * GET /api/subcategories
 * Public: list all subcategories (via category tree).
 */
export async function GET(): Promise<Response> {
  try {
    const tree = await getCategoryTree()

    const subcategories = tree.flatMap((cat) =>
      cat.subcategories.map((sub) => ({
        ...sub,
        categoryName: cat.name,
        categorySlug: cat.slug,
      }))
    )

    return apiSuccess(subcategories)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/subcategories
 * Admin: create a new subcategory under a parent category.
 */
export const POST = withAdmin(
  async (req: NextRequest, _ctx: AuthenticatedRouteContext): Promise<Response> => {
    try {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return Response.json(
          { success: false, error: "Invalid JSON body", code: "VALIDATION_ERROR" },
          { status: 422 }
        )
      }

      const parseResult = createSubcategorySchema.safeParse(body)

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

      const subcategory = await createSubcategory(parseResult.data)
      return apiSuccess(subcategory, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
