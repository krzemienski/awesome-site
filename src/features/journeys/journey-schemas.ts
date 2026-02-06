import { z } from "zod"

/**
 * Schema for creating a new learning journey.
 */
export const createJourneySchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2000 characters or less"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  category: z
    .string()
    .min(1, "Category is required")
    .max(100, "Category must be 100 characters or less"),
  estimatedDuration: z
    .string()
    .max(100, "Estimated duration must be 100 characters or less")
    .optional(),
})

export type CreateJourneyInput = z.infer<typeof createJourneySchema>

/**
 * Schema for updating an existing journey (all fields optional).
 */
export const updateJourneySchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2000 characters or less")
    .optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  category: z
    .string()
    .min(1, "Category is required")
    .max(100, "Category must be 100 characters or less")
    .optional(),
  estimatedDuration: z
    .string()
    .max(100, "Estimated duration must be 100 characters or less")
    .nullable()
    .optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  featured: z.boolean().optional(),
})

export type UpdateJourneyInput = z.infer<typeof updateJourneySchema>

/**
 * Schema for adding a step to a journey.
 */
export const addStepSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional(),
  resourceId: z.coerce.number().int().positive().optional(),
  isOptional: z.boolean().default(false),
})

export type AddStepInput = z.infer<typeof addStepSchema>

/**
 * Schema for completing a step (rating, time, notes).
 */
export const completeStepSchema = z.object({
  stepId: z.coerce.number().int().positive("Step ID is required"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  timeSpent: z.coerce.number().int().positive().optional(),
  notes: z
    .string()
    .max(2000, "Notes must be 2000 characters or less")
    .optional(),
})

export type CompleteStepInput = z.infer<typeof completeStepSchema>

/**
 * Schema for reordering steps within a journey.
 */
export const reorderStepsSchema = z.object({
  stepIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "At least one step ID is required"),
})

export type ReorderStepsInput = z.infer<typeof reorderStepsSchema>
