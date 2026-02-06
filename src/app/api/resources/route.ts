import { NextRequest } from "next/server"
import {
  apiSuccess,
  apiPaginated,
  handleApiError,
} from "@/lib/api-response"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import {
  createResourceSchema,
  resourceFiltersSchema,
} from "@/features/resources/resource-schemas"
import {
  listResources,
  createResource,
} from "@/features/resources/resource-service"

/**
 * GET /api/resources
 * Public: paginated resource list with filters from query params.
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const searchParams = req.nextUrl.searchParams
    const raw: Record<string, string> = {}

    searchParams.forEach((value, key) => {
      raw[key] = value
    })

    const parseResult = resourceFiltersSchema.safeParse(raw)

    if (!parseResult.success) {
      return Response.json(
        {
          success: false,
          error: "Invalid filter parameters",
          code: "VALIDATION_ERROR",
          details: parseResult.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 422 }
      )
    }

    const filters = parseResult.data
    const result = await listResources(filters)

    return apiPaginated(result.items, result.meta)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/resources
 * Authenticated: submit a new resource with status "pending".
 */
export const POST = withAuth(
  async (req: NextRequest, ctx: AuthenticatedRouteContext): Promise<Response> => {
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

      const parseResult = createResourceSchema.safeParse(body)

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

      const resource = await createResource(parseResult.data, ctx.user.id)

      return apiSuccess(resource, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
