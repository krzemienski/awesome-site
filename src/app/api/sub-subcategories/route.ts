import { NextRequest } from "next/server"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { createSubSubcategorySchema } from "@/features/categories/category-schemas"
import {
  getCategoryTree,
  createSubSubcategory,
} from "@/features/categories/category-service"

/**
 * GET /api/sub-subcategories
 * Public: list all sub-subcategories (via category tree).
 */
export async function GET(): Promise<Response> {
  try {
    const tree = await getCategoryTree()

    const subSubcategories = tree.flatMap((cat) =>
      cat.subcategories.flatMap((sub) =>
        sub.subSubcategories.map((subSub) => ({
          ...subSub,
          subcategoryName: sub.name,
          subcategorySlug: sub.slug,
          categoryName: cat.name,
          categorySlug: cat.slug,
        }))
      )
    )

    return apiSuccess(subSubcategories)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/sub-subcategories
 * Admin: create a new sub-subcategory under a parent subcategory.
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

      const parseResult = createSubSubcategorySchema.safeParse(body)

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

      const subSubcategory = await createSubSubcategory(parseResult.data)
      return apiSuccess(subSubcategory, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
