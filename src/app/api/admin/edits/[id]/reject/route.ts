import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { rejectEdit } from "@/features/edits/edit-service"
import { createAuditLog } from "@/features/admin/audit-service"

export const PUT = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const editId = Number(id)

      if (Number.isNaN(editId)) {
        return apiError("Invalid edit ID", 422, "VALIDATION_ERROR")
      }

      let feedback: string | undefined
      try {
        const body = await req.json()
        feedback = typeof body.feedback === "string" ? body.feedback : undefined
      } catch {
        // No body is acceptable — feedback is optional
      }

      const edit = await rejectEdit(editId, ctx.user.id, feedback)

      await createAuditLog({
        resourceId: edit.resourceId,
        action: "edit_rejected",
        performedById: ctx.user.id,
        previousState: { editId: edit.id, editType: edit.editType },
        newState: {
          editId: edit.id,
          status: "rejected",
          reviewFeedback: feedback ?? null,
        },
      })

      return apiSuccess(edit)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
