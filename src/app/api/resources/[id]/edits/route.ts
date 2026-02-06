import { NextRequest } from "next/server"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { withAuth } from "@/features/auth/auth-middleware"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { submitEditSchema } from "@/features/edits/edit-schemas"
import { submitEdit, getEdits } from "@/features/edits/edit-service"

/**
 * GET /api/resources/[id]/edits
 * Public: list edit suggestions for a resource.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params
    const resourceId = Number(id)

    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      return apiError("Invalid resource ID", 422, "VALIDATION_ERROR")
    }

    const url = new URL(req.url)
    const status = url.searchParams.get("status") as
      | "pending"
      | "approved"
      | "rejected"
      | undefined

    const edits = await getEdits(resourceId, status || undefined)

    return apiSuccess(edits)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/resources/[id]/edits
 * Authenticated: submit an edit suggestion for a resource.
 */
export const POST = withAuth(
  async (
    req: NextRequest,
    ctx: AuthenticatedRouteContext
  ): Promise<Response> => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const resourceId = Number(id)

      if (!Number.isInteger(resourceId) || resourceId <= 0) {
        return apiError("Invalid resource ID", 422, "VALIDATION_ERROR")
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const parseResult = submitEditSchema.safeParse(body)

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

      const edit = await submitEdit(
        resourceId,
        ctx.user.id,
        parseResult.data
      )

      return apiSuccess(edit, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
