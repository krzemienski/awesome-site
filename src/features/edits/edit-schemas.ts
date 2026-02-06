import { z } from "zod"

/**
 * Schema for submitting an edit suggestion.
 * proposedChanges is a record of field names to old/new value pairs.
 */
export const submitEditSchema = z.object({
  editType: z.enum(["correction", "enhancement", "report"]),
  proposedChanges: z.record(
    z.string(),
    z.object({
      oldValue: z.string().nullable(),
      newValue: z.string().nullable(),
    })
  ),
  justification: z
    .string()
    .min(1, "Justification is required")
    .max(500, "Justification must be 500 characters or less"),
})

export type SubmitEditInput = z.infer<typeof submitEditSchema>
