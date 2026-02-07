import { z } from "zod"

/**
 * Schema for creating a new resource submission.
 */
export const createResourceSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  url: z.string().url("Must be a valid URL"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must be 2000 characters or less"),
  categoryId: z.coerce.number().int().positive("Category is required"),
  subcategoryId: z.coerce.number().int().positive().nullable().optional(),
  subSubcategoryId: z.coerce.number().int().positive().nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
})

export type CreateResourceInput = z.infer<typeof createResourceSchema>

/**
 * Schema for updating an existing resource (all fields optional).
 */
export const updateResourceSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  url: z.string().url("Must be a valid URL").optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must be 2000 characters or less")
    .optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  subcategoryId: z.coerce.number().int().positive().nullable().optional(),
  subSubcategoryId: z.coerce.number().int().positive().nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  status: z.enum(["pending", "approved", "rejected", "archived"]).optional(),
  ogImage: z.string().url().nullable().optional(),
  blurhash: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type UpdateResourceInput = z.infer<typeof updateResourceSchema>

/**
 * Schema for resource list filters from query parameters.
 * Uses z.coerce for numbers since query params arrive as strings.
 */
export const resourceFiltersSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  subSubcategoryId: z.coerce.number().int().positive().optional(),
  status: z.enum(["pending", "approved", "rejected", "archived"]).optional(),
  search: z.string().max(200).optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  enriched: z
    .union([z.boolean(), z.string()])
    .transform((val) => (typeof val === "string" ? val === "true" : val))
    .optional(),
  sort: z.enum(["title", "createdAt", "updatedAt", "popularity"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
})

export type ResourceFiltersInput = z.infer<typeof resourceFiltersSchema>

/**
 * Schema for the multi-step resource submission form.
 * Validates data collected across all 4 steps before final submission.
 */
export const submitResourceSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  categoryId: z.coerce.number().int().positive("Category is required"),
  subcategoryId: z.coerce.number().int().positive().nullable().optional(),
  subSubcategoryId: z.coerce.number().int().positive().nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must be 2000 characters or less"),
})

export type SubmitResourceInput = z.infer<typeof submitResourceSchema>
