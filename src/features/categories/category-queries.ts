import type { Prisma } from "@/generated/prisma/client"

/**
 * Build Prisma include clause for a full 3-level category tree.
 * Includes resource counts at every level and orders by displayOrder.
 */
export function buildCategoryTreeInclude(): Prisma.CategoryInclude {
  return {
    _count: {
      select: { resources: true },
    },
    subcategories: {
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { resources: true },
        },
        subSubcategories: {
          orderBy: { displayOrder: "asc" },
          include: {
            _count: {
              select: { resources: true },
            },
          },
        },
      },
    },
  }
}

/**
 * Build Prisma include clause for a single category with children.
 */
export function buildCategoryDetailInclude(): Prisma.CategoryInclude {
  return buildCategoryTreeInclude()
}

/**
 * Build Prisma include clause for a subcategory with children.
 */
export function buildSubcategoryDetailInclude(): Prisma.SubcategoryInclude {
  return {
    category: true,
    _count: {
      select: { resources: true },
    },
    subSubcategories: {
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { resources: true },
        },
      },
    },
  }
}

/**
 * Build Prisma include clause for a sub-subcategory with parent chain.
 */
export function buildSubSubcategoryDetailInclude(): Prisma.SubSubcategoryInclude {
  return {
    subcategory: {
      include: {
        category: true,
      },
    },
    _count: {
      select: { resources: true },
    },
  }
}

/**
 * Build orderBy clause for category listings.
 */
export function buildCategoryOrderBy(): Prisma.CategoryOrderByWithRelationInput {
  return { displayOrder: "asc" }
}
