import { prisma } from "@/lib/prisma"
import { AppError, Errors } from "@/lib/api-error"
import type { SubmitEditInput } from "@/features/edits/edit-schemas"
import { toEditSuggestion, type EditSuggestion } from "@/features/edits/edit-types"
import type { EditStatus, EditType } from "@/generated/prisma/client"

/**
 * Submit an edit suggestion for a resource.
 */
export async function submitEdit(
  resourceId: number,
  submittedById: string,
  input: SubmitEditInput
): Promise<EditSuggestion> {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
  })

  if (!resource) {
    throw Errors.NOT_FOUND("Resource")
  }

  const record = await prisma.resourceEdit.create({
    data: {
      resourceId,
      submittedById,
      editType: input.editType as EditType,
      proposedChanges: input.proposedChanges,
      justification: input.justification,
    },
  })

  return toEditSuggestion(record)
}

/**
 * Get all edit suggestions for a resource, optionally filtered by status.
 */
export async function getEdits(
  resourceId: number,
  status?: EditStatus
): Promise<EditSuggestion[]> {
  const where: { resourceId: number; status?: EditStatus } = { resourceId }

  if (status) {
    where.status = status
  }

  const records = await prisma.resourceEdit.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return records.map(toEditSuggestion)
}

/**
 * Approve an edit suggestion and optionally apply the diff to the resource.
 */
export async function approveEdit(
  editId: number,
  reviewedById: string,
  reviewFeedback?: string
): Promise<EditSuggestion> {
  const edit = await prisma.resourceEdit.findUnique({
    where: { id: editId },
  })

  if (!edit) {
    throw Errors.NOT_FOUND("Edit suggestion")
  }

  if (edit.status !== "pending") {
    throw new AppError(`Edit suggestion is already ${edit.status}`, 422, "EDIT_ALREADY_REVIEWED")
  }

  const updated = await prisma.resourceEdit.update({
    where: { id: editId },
    data: {
      status: "approved" as EditStatus,
      reviewedById,
      reviewedAt: new Date(),
      reviewFeedback: reviewFeedback ?? null,
    },
  })

  return toEditSuggestion(updated)
}

/**
 * Reject an edit suggestion with optional feedback.
 */
export async function rejectEdit(
  editId: number,
  reviewedById: string,
  reviewFeedback?: string
): Promise<EditSuggestion> {
  const edit = await prisma.resourceEdit.findUnique({
    where: { id: editId },
  })

  if (!edit) {
    throw Errors.NOT_FOUND("Edit suggestion")
  }

  if (edit.status !== "pending") {
    throw new AppError(`Edit suggestion is already ${edit.status}`, 422, "EDIT_ALREADY_REVIEWED")
  }

  const updated = await prisma.resourceEdit.update({
    where: { id: editId },
    data: {
      status: "rejected" as EditStatus,
      reviewedById,
      reviewedAt: new Date(),
      reviewFeedback: reviewFeedback ?? null,
    },
  })

  return toEditSuggestion(updated)
}

/**
 * Apply the proposed changes (diff) from an edit suggestion to the resource.
 * Only applies fields that exist on the resource model.
 */
export async function applyDiff(editId: number): Promise<void> {
  const edit = await prisma.resourceEdit.findUnique({
    where: { id: editId },
    include: { resource: true },
  })

  if (!edit) {
    throw Errors.NOT_FOUND("Edit suggestion")
  }

  const proposedChanges = edit.proposedChanges as Record<
    string,
    { oldValue: string | null; newValue: string | null }
  >

  const allowedFields = new Set(["title", "url", "description"])
  const updateData: Record<string, string | null> = {}

  for (const [field, values] of Object.entries(proposedChanges)) {
    if (allowedFields.has(field) && values.newValue !== null) {
      updateData[field] = values.newValue
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.resource.update({
      where: { id: edit.resourceId },
      data: updateData,
    })
  }
}
