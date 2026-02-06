import { NextRequest } from "next/server"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { withAdmin } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import {
  createCategorySchema,
} from "@/features/categories/category-schemas"
import {
  getCategoryTree,
  createCategory,
} from "@/features/categories/category-service"

/**
 * GET /api/categories
 * Public: hierarchical category tree with resource counts at every level.
 */
export async function GET(): Promise<Response> {
  try {
    const tree = await getCategoryTree()
    return apiSuccess(tree)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/categories
 * Admin: create a new top-level category.
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

      const parseResult = createCategorySchema.safeParse(body)

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

      const category = await createCategory(parseResult.data)
      return apiSuccess(category, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
