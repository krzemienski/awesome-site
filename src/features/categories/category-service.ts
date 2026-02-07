import { prisma } from "@/lib/prisma"
import { AppError, Errors } from "@/lib/api-error"
import type {
  CategoryTree,
  CategoryWithChildren,
  SubcategoryWithChildren,
  SubSubcategoryWithCount,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateSubcategoryInput,
  UpdateSubcategoryInput,
  CreateSubSubcategoryInput,
  UpdateSubSubcategoryInput,
} from "./category-types"
import {
  buildCategoryTreeInclude,
  buildCategoryDetailInclude,
  buildCategoryOrderBy,
  buildSubcategoryDetailInclude,
  buildSubSubcategoryDetailInclude,
} from "./category-queries"

// ---------------------------------------------------------------------------
// Category Tree
// ---------------------------------------------------------------------------

/**
 * Fetch the full 3-level category tree with resource counts at every level.
 */
export async function getCategoryTree(): Promise<CategoryTree> {
  const categories = await prisma.category.findMany({
    orderBy: buildCategoryOrderBy(),
    include: buildCategoryTreeInclude(),
  })

  return categories as unknown as CategoryTree
}

// ---------------------------------------------------------------------------
// Category CRUD
// ---------------------------------------------------------------------------

/**
 * Get a single category by ID with children and resource counts.
 */
export async function getCategory(id: number): Promise<CategoryWithChildren> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: buildCategoryDetailInclude(),
  })

  if (!category) {
    throw Errors.NOT_FOUND("Category")
  }

  return category as unknown as CategoryWithChildren
}

/**
 * Get a single category by slug with children and resource counts.
 */
export async function getCategoryBySlug(
  slug: string
): Promise<CategoryWithChildren> {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: buildCategoryDetailInclude(),
  })

  if (!category) {
    throw Errors.NOT_FOUND("Category")
  }

  return category as unknown as CategoryWithChildren
}

/**
 * Create a new top-level category.
 */
export async function createCategory(
  input: CreateCategoryInput
): Promise<CategoryWithChildren> {
  const existing = await prisma.category.findUnique({
    where: { slug: input.slug! },
    select: { id: true },
  })

  if (existing) {
    throw Errors.DUPLICATE("slug")
  }

  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug: input.slug!,
      description: input.description ?? null,
      icon: input.icon ?? null,
      displayOrder: input.displayOrder ?? 0,
    },
    include: buildCategoryDetailInclude(),
  })

  return category as unknown as CategoryWithChildren
}

/**
 * Update an existing category by ID.
 */
export async function updateCategory(
  id: number,
  input: UpdateCategoryInput
): Promise<CategoryWithChildren> {
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    throw Errors.NOT_FOUND("Category")
  }

  if (input.slug) {
    const duplicate = await prisma.category.findFirst({
      where: { slug: input.slug, NOT: { id } },
      select: { id: true },
    })
    if (duplicate) {
      throw Errors.DUPLICATE("slug")
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
    },
    include: buildCategoryDetailInclude(),
  })

  return category as unknown as CategoryWithChildren
}

/**
 * Delete a category by ID. Throws if the category still has resources.
 */
export async function deleteCategory(id: number): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { resources: true, subcategories: true } },
    },
  })

  if (!category) {
    throw Errors.NOT_FOUND("Category")
  }

  if (category._count.resources > 0) {
    throw new AppError(
      `Cannot delete category with ${category._count.resources} resource(s). Move or remove them first.`,
      422,
      "DELETE_PROTECTED"
    )
  }

  if (category._count.subcategories > 0) {
    throw new AppError(
      `Cannot delete category with ${category._count.subcategories} subcategory(ies). Remove them first.`,
      422,
      "DELETE_PROTECTED"
    )
  }

  await prisma.category.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// Subcategory CRUD
// ---------------------------------------------------------------------------

/**
 * Get a single subcategory by ID with children and resource count.
 */
export async function getSubcategory(
  id: number
): Promise<SubcategoryWithChildren> {
  const sub = await prisma.subcategory.findUnique({
    where: { id },
    include: buildSubcategoryDetailInclude(),
  })

  if (!sub) {
    throw Errors.NOT_FOUND("Subcategory")
  }

  return sub as unknown as SubcategoryWithChildren
}

/**
 * Create a new subcategory under a parent category.
 */
export async function createSubcategory(
  input: CreateSubcategoryInput
): Promise<SubcategoryWithChildren> {
  const parent = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  })

  if (!parent) {
    throw Errors.NOT_FOUND("Parent category")
  }

  const existing = await prisma.subcategory.findUnique({
    where: {
      categoryId_slug: {
        categoryId: input.categoryId,
        slug: input.slug!,
      },
    },
    select: { id: true },
  })

  if (existing) {
    throw Errors.DUPLICATE("slug")
  }

  const sub = await prisma.subcategory.create({
    data: {
      name: input.name,
      slug: input.slug!,
      description: input.description ?? null,
      displayOrder: input.displayOrder ?? 0,
      categoryId: input.categoryId,
    },
    include: buildSubcategoryDetailInclude(),
  })

  return sub as unknown as SubcategoryWithChildren
}

/**
 * Update an existing subcategory by ID.
 */
export async function updateSubcategory(
  id: number,
  input: UpdateSubcategoryInput
): Promise<SubcategoryWithChildren> {
  const existing = await prisma.subcategory.findUnique({
    where: { id },
    select: { id: true, categoryId: true },
  })

  if (!existing) {
    throw Errors.NOT_FOUND("Subcategory")
  }

  const targetCategoryId = input.categoryId ?? existing.categoryId

  if (input.slug) {
    const duplicate = await prisma.subcategory.findFirst({
      where: {
        categoryId: targetCategoryId,
        slug: input.slug,
        NOT: { id },
      },
      select: { id: true },
    })
    if (duplicate) {
      throw Errors.DUPLICATE("slug")
    }
  }

  const sub = await prisma.subcategory.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    },
    include: buildSubcategoryDetailInclude(),
  })

  return sub as unknown as SubcategoryWithChildren
}

/**
 * Delete a subcategory by ID. Throws if it still has resources or children.
 */
export async function deleteSubcategory(id: number): Promise<void> {
  const sub = await prisma.subcategory.findUnique({
    where: { id },
    include: {
      _count: { select: { resources: true, subSubcategories: true } },
    },
  })

  if (!sub) {
    throw Errors.NOT_FOUND("Subcategory")
  }

  if (sub._count.resources > 0) {
    throw new AppError(
      `Cannot delete subcategory with ${sub._count.resources} resource(s). Move or remove them first.`,
      422,
      "DELETE_PROTECTED"
    )
  }

  if (sub._count.subSubcategories > 0) {
    throw new AppError(
      `Cannot delete subcategory with ${sub._count.subSubcategories} sub-subcategory(ies). Remove them first.`,
      422,
      "DELETE_PROTECTED"
    )
  }

  await prisma.subcategory.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// Sub-subcategory CRUD
// ---------------------------------------------------------------------------

/**
 * Get a single sub-subcategory by ID with resource count.
 */
export async function getSubSubcategory(
  id: number
): Promise<SubSubcategoryWithCount> {
  const subSub = await prisma.subSubcategory.findUnique({
    where: { id },
    include: buildSubSubcategoryDetailInclude(),
  })

  if (!subSub) {
    throw Errors.NOT_FOUND("Sub-subcategory")
  }

  return subSub as unknown as SubSubcategoryWithCount
}

/**
 * Create a new sub-subcategory under a parent subcategory.
 */
export async function createSubSubcategory(
  input: CreateSubSubcategoryInput
): Promise<SubSubcategoryWithCount> {
  const parent = await prisma.subcategory.findUnique({
    where: { id: input.subcategoryId },
    select: { id: true },
  })

  if (!parent) {
    throw Errors.NOT_FOUND("Parent subcategory")
  }

  const existing = await prisma.subSubcategory.findUnique({
    where: {
      subcategoryId_slug: {
        subcategoryId: input.subcategoryId,
        slug: input.slug!,
      },
    },
    select: { id: true },
  })

  if (existing) {
    throw Errors.DUPLICATE("slug")
  }

  const subSub = await prisma.subSubcategory.create({
    data: {
      name: input.name,
      slug: input.slug!,
      description: input.description ?? null,
      displayOrder: input.displayOrder ?? 0,
      subcategoryId: input.subcategoryId,
    },
    include: buildSubSubcategoryDetailInclude(),
  })

  return subSub as unknown as SubSubcategoryWithCount
}

/**
 * Update an existing sub-subcategory by ID.
 */
export async function updateSubSubcategory(
  id: number,
  input: UpdateSubSubcategoryInput
): Promise<SubSubcategoryWithCount> {
  const existing = await prisma.subSubcategory.findUnique({
    where: { id },
    select: { id: true, subcategoryId: true },
  })

  if (!existing) {
    throw Errors.NOT_FOUND("Sub-subcategory")
  }

  const targetSubcategoryId = input.subcategoryId ?? existing.subcategoryId

  if (input.slug) {
    const duplicate = await prisma.subSubcategory.findFirst({
      where: {
        subcategoryId: targetSubcategoryId,
        slug: input.slug,
        NOT: { id },
      },
      select: { id: true },
    })
    if (duplicate) {
      throw Errors.DUPLICATE("slug")
    }
  }

  const subSub = await prisma.subSubcategory.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      ...(input.subcategoryId !== undefined && { subcategoryId: input.subcategoryId }),
    },
    include: buildSubSubcategoryDetailInclude(),
  })

  return subSub as unknown as SubSubcategoryWithCount
}

/**
 * Delete a sub-subcategory by ID. Throws if it still has resources.
 */
export async function deleteSubSubcategory(id: number): Promise<void> {
  const subSub = await prisma.subSubcategory.findUnique({
    where: { id },
    include: {
      _count: { select: { resources: true } },
    },
  })

  if (!subSub) {
    throw Errors.NOT_FOUND("Sub-subcategory")
  }

  if (subSub._count.resources > 0) {
    throw new AppError(
      `Cannot delete sub-subcategory with ${subSub._count.resources} resource(s). Move or remove them first.`,
      422,
      "DELETE_PROTECTED"
    )
  }

  await prisma.subSubcategory.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// Display Order Management
// ---------------------------------------------------------------------------

/**
 * Swap display order between two categories.
 */
export async function swapCategoryOrder(
  idA: number,
  idB: number
): Promise<void> {
  const [catA, catB] = await Promise.all([
    prisma.category.findUnique({ where: { id: idA }, select: { id: true, displayOrder: true } }),
    prisma.category.findUnique({ where: { id: idB }, select: { id: true, displayOrder: true } }),
  ])

  if (!catA) throw Errors.NOT_FOUND("Category A")
  if (!catB) throw Errors.NOT_FOUND("Category B")

  await prisma.$transaction([
    prisma.category.update({ where: { id: idA }, data: { displayOrder: catB.displayOrder } }),
    prisma.category.update({ where: { id: idB }, data: { displayOrder: catA.displayOrder } }),
  ])
}

/**
 * Swap display order between two subcategories.
 */
export async function swapSubcategoryOrder(
  idA: number,
  idB: number
): Promise<void> {
  const [subA, subB] = await Promise.all([
    prisma.subcategory.findUnique({ where: { id: idA }, select: { id: true, displayOrder: true } }),
    prisma.subcategory.findUnique({ where: { id: idB }, select: { id: true, displayOrder: true } }),
  ])

  if (!subA) throw Errors.NOT_FOUND("Subcategory A")
  if (!subB) throw Errors.NOT_FOUND("Subcategory B")

  await prisma.$transaction([
    prisma.subcategory.update({ where: { id: idA }, data: { displayOrder: subB.displayOrder } }),
    prisma.subcategory.update({ where: { id: idB }, data: { displayOrder: subA.displayOrder } }),
  ])
}

/**
 * Swap display order between two sub-subcategories.
 */
export async function swapSubSubcategoryOrder(
  idA: number,
  idB: number
): Promise<void> {
  const [subSubA, subSubB] = await Promise.all([
    prisma.subSubcategory.findUnique({ where: { id: idA }, select: { id: true, displayOrder: true } }),
    prisma.subSubcategory.findUnique({ where: { id: idB }, select: { id: true, displayOrder: true } }),
  ])

  if (!subSubA) throw Errors.NOT_FOUND("Sub-subcategory A")
  if (!subSubB) throw Errors.NOT_FOUND("Sub-subcategory B")

  await prisma.$transaction([
    prisma.subSubcategory.update({ where: { id: idA }, data: { displayOrder: subSubB.displayOrder } }),
    prisma.subSubcategory.update({ where: { id: idB }, data: { displayOrder: subSubA.displayOrder } }),
  ])
}
