import { NextRequest } from "next/server"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { withAdmin } from "@/features/auth/auth-middleware"
import type {
  RouteContext,
  AuthenticatedRouteContext,
} from "@/features/auth/auth-types"
import { updateResourceSchema } from "@/features/resources/resource-schemas"
import {
  getResource,
  updateResource,
  deleteResource,
} from "@/features/resources/resource-service"

/**
 * Parse and validate the resource ID from route params.
 */
async function parseResourceId(
  ctx: RouteContext
): Promise<number | null> {
  const { id } = await ctx.params
  const parsed = Number(id)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/**
 * GET /api/resources/[id]
 * Public: get resource detail with tags and category.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await ctx.params
    const resourceId = Number(id)

    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      return apiError("Invalid resource ID", 422, "VALIDATION_ERROR")
    }

    const resource = await getResource(resourceId)

    return apiSuccess(resource)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/resources/[id]
 * Admin: update a resource.
 */
export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext): Promise<Response> => {
    try {
      const resourceId = await parseResourceId(ctx)

      if (!resourceId) {
        return apiError("Invalid resource ID", 422, "VALIDATION_ERROR")
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parseResult = updateResourceSchema.safeParse(body)

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

      const resource = await updateResource(resourceId, parseResult.data)

      return apiSuccess(resource)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

/**
 * DELETE /api/resources/[id]
 * Admin: soft delete (sets status to archived).
 */
export const DELETE = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext): Promise<Response> => {
    try {
      const resourceId = await parseResourceId(ctx)

      if (!resourceId) {
        return apiError("Invalid resource ID", 422, "VALIDATION_ERROR")
      }

      await deleteResource(resourceId)

      return apiSuccess({ deleted: true })
    } catch (error) {
      return handleApiError(error)
    }
  }
)
