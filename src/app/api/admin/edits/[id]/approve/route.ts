import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { approveEdit, applyDiff } from "@/features/edits/edit-service"
import { createAuditLog } from "@/features/admin/audit-service"

export const PUT = withAdmin(
  async (_req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const { id } = (await ctx.params) as { id: string }
      const editId = Number(id)

      if (Number.isNaN(editId)) {
        return Response.json(
          { success: false, error: "Invalid edit ID", code: "VALIDATION_ERROR" },
          { status: 422 }
        )
      }

      const edit = await approveEdit(editId, ctx.user.id)

      await applyDiff(editId)

      await createAuditLog({
        resourceId: edit.resourceId,
        action: "edit_approved",
        performedById: ctx.user.id,
        previousState: { editId: edit.id, editType: edit.editType },
        newState: {
          editId: edit.id,
          status: "approved",
          proposedChanges: edit.proposedChanges,
        },
      })

      return apiSuccess(edit)
    } catch (error) {
      return handleApiError(error)
    }
  }
)
