import type {
  Category as PrismaCategory,
  Subcategory as PrismaSubcategory,
  SubSubcategory as PrismaSubSubcategory,
} from "@/generated/prisma/client"

/**
 * Base category type matching the Prisma model.
 */
export type Category = PrismaCategory

/**
 * Base subcategory type matching the Prisma model.
 */
export type Subcategory = PrismaSubcategory

/**
 * Base sub-subcategory type matching the Prisma model.
 */
export type SubSubcategory = PrismaSubSubcategory

/**
 * Sub-subcategory with resource count for tree building.
 */
export interface SubSubcategoryWithCount extends SubSubcategory {
  _count: { resources: number }
}

/**
 * Subcategory with children and resource count for tree building.
 */
export interface SubcategoryWithChildren extends Subcategory {
  subSubcategories: SubSubcategoryWithCount[]
  _count: { resources: number }
}

/**
 * Category with full children hierarchy and resource count.
 */
export interface CategoryWithChildren extends Category {
  subcategories: SubcategoryWithChildren[]
  _count: { resources: number }
}

/**
 * Full 3-level category tree.
 */
export type CategoryTree = CategoryWithChildren[]

/**
 * Input for creating a category.
 */
export interface CreateCategoryInput {
  name: string
  slug?: string
  description?: string | null
  icon?: string | null
  displayOrder?: number
}

/**
 * Input for updating a category.
 */
export interface UpdateCategoryInput {
  name?: string
  slug?: string
  description?: string | null
  icon?: string | null
  displayOrder?: number
}

/**
 * Input for creating a subcategory.
 */
export interface CreateSubcategoryInput {
  name: string
  slug?: string
  description?: string | null
  displayOrder?: number
  categoryId: number
}

/**
 * Input for updating a subcategory.
 */
export interface UpdateSubcategoryInput {
  name?: string
  slug?: string
  description?: string | null
  displayOrder?: number
  categoryId?: number
}

/**
 * Input for creating a sub-subcategory.
 */
export interface CreateSubSubcategoryInput {
  name: string
  slug?: string
  description?: string | null
  displayOrder?: number
  subcategoryId: number
}

/**
 * Input for updating a sub-subcategory.
 */
export interface UpdateSubSubcategoryInput {
  name?: string
  slug?: string
  description?: string | null
  displayOrder?: number
  subcategoryId?: number
}
