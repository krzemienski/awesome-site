import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { prisma } from "@/lib/prisma"
import { createCategorySchema } from "@/features/categories/category-schemas"
import { createCategory } from "@/features/categories/category-service"
import { logAdminAction } from "@/features/admin/audit-service"

export const GET = withAdmin(
  async (_req: NextRequest, _ctx: AuthenticatedRouteContext) => {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: { select: { resources: true, subcategories: true } },
        },
        orderBy: { displayOrder: "asc" },
      })

      return apiSuccess(categories)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

export const POST = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
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

      await logAdminAction({
        action: "category_create",
        performedById: ctx.user.id,
        newState: { id: category.id, name: category.name, slug: category.slug },
      })

      return apiSuccess(category, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
