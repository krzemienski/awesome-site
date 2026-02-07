import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { prisma } from "@/lib/prisma"
import { createSubcategorySchema } from "@/features/categories/category-schemas"
import { createSubcategory } from "@/features/categories/category-service"
import { logAdminAction } from "@/features/admin/audit-service"

export const GET = withAdmin(
  async (_req: NextRequest, _ctx: AuthenticatedRouteContext) => {
    try {
      const subcategories = await prisma.subcategory.findMany({
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { resources: true, subSubcategories: true } },
        },
        orderBy: { displayOrder: "asc" },
      })

      return apiSuccess(subcategories)
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

      await logAdminAction({
        action: "subcategory_create",
        performedById: ctx.user.id,
        newState: { id: subcategory.id, name: subcategory.name, slug: subcategory.slug },
      })

      return apiSuccess(subcategory, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
