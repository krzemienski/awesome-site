import { z } from "zod"

/**
 * Generate a URL-safe slug from a name string.
 */
function autoSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/**
 * Schema for creating a top-level category.
 */
export const createCategorySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less"),
    slug: z
      .string()
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    description: z.string().max(500).nullable().optional(),
    icon: z.string().max(50).nullable().optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
  })
  .transform((data) => ({
    ...data,
    slug: data.slug ?? autoSlug(data.name),
  }))

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

/**
 * Schema for updating a top-level category.
 */
export const updateCategorySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .optional(),
    slug: z
      .string()
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    description: z.string().max(500).nullable().optional(),
    icon: z.string().max(50).nullable().optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
  })
  .transform((data) => {
    if (data.name && !data.slug) {
      return { ...data, slug: autoSlug(data.name) }
    }
    return data
  })

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

/**
 * Schema for creating a subcategory.
 */
export const createSubcategorySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less"),
    slug: z
      .string()
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    description: z.string().max(500).nullable().optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    categoryId: z.coerce.number().int().positive("Parent category is required"),
  })
  .transform((data) => ({
    ...data,
    slug: data.slug ?? autoSlug(data.name),
  }))

export type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>

/**
 * Schema for updating a subcategory.
 */
export const updateSubcategorySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .optional(),
    slug: z
      .string()
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    description: z.string().max(500).nullable().optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
  })
  .transform((data) => {
    if (data.name && !data.slug) {
      return { ...data, slug: autoSlug(data.name) }
    }
    return data
  })

export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>

/**
 * Schema for creating a sub-subcategory.
 */
export const createSubSubcategorySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less"),
    slug: z
      .string()
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    description: z.string().max(500).nullable().optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    subcategoryId: z.coerce.number().int().positive("Parent subcategory is required"),
  })
  .transform((data) => ({
    ...data,
    slug: data.slug ?? autoSlug(data.name),
  }))

export type CreateSubSubcategoryInput = z.infer<typeof createSubSubcategorySchema>

/**
 * Schema for updating a sub-subcategory.
 */
export const updateSubSubcategorySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .optional(),
    slug: z
      .string()
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    description: z.string().max(500).nullable().optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    subcategoryId: z.coerce.number().int().positive().optional(),
  })
  .transform((data) => {
    if (data.name && !data.slug) {
      return { ...data, slug: autoSlug(data.name) }
    }
    return data
  })

export type UpdateSubSubcategoryInput = z.infer<typeof updateSubSubcategorySchema>
