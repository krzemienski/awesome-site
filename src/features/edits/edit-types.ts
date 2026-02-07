import type {
  ResourceEdit as PrismaResourceEdit,
  EditType as PrismaEditType,
  EditStatus as PrismaEditStatus,
} from "@/generated/prisma/client"

/**
 * Re-export Prisma enums for use across the feature module.
 */
export type EditType = PrismaEditType
export type EditStatus = PrismaEditStatus

/**
 * Represents the diff for a single field in an edit suggestion.
 */
export interface EditDiff {
  field: string
  oldValue: string | null
  newValue: string | null
}

/**
 * Edit suggestion with typed fields mapped from the Prisma model.
 */
export interface EditSuggestion {
  id: number
  resourceId: number
  editType: PrismaEditType
  proposedChanges: EditDiff[]
  justification: string
  status: PrismaEditStatus
  submittedById: string
  reviewedById: string | null
  reviewedAt: Date | null
  reviewFeedback: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * AI analysis result for an edit suggestion.
 */
export interface AiEditAnalysis {
  quality: "high" | "medium" | "low"
  reasoning: string
  suggestedChanges: EditDiff[]
}

/**
 * Convert a Prisma ResourceEdit record to an EditSuggestion.
 */
export function toEditSuggestion(record: PrismaResourceEdit): EditSuggestion {
  const rawChanges = record.proposedChanges as Record<
    string,
    { oldValue: string | null; newValue: string | null }
  >

  const proposedChanges: EditDiff[] = Object.entries(rawChanges).map(
    ([field, values]) => ({
      field,
      oldValue: values.oldValue,
      newValue: values.newValue,
    })
  )

  return {
    id: record.id,
    resourceId: record.resourceId,
    editType: record.editType,
    proposedChanges,
    justification: record.justification,
    status: record.status,
    submittedById: record.submittedById,
    reviewedById: record.reviewedById,
    reviewedAt: record.reviewedAt,
    reviewFeedback: record.reviewFeedback,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}
