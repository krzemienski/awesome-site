import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  buildCategoryTreeInclude,
  buildCategoryOrderBy,
} from "@/features/categories/category-queries"
import { handleApiError } from "@/lib/api-response"

interface CategoryTreeNode {
  readonly id: number
  readonly name: string
  readonly slug: string
  readonly resourceCount: number
  readonly children: SubcategoryTreeNode[]
}

interface SubcategoryTreeNode {
  readonly id: number
  readonly name: string
  readonly slug: string
  readonly resourceCount: number
  readonly children: SubSubcategoryTreeNode[]
}

interface SubSubcategoryTreeNode {
  readonly id: number
  readonly name: string
  readonly slug: string
  readonly resourceCount: number
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: buildCategoryTreeInclude(),
      orderBy: buildCategoryOrderBy(),
    })

    const tree: CategoryTreeNode[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      resourceCount: (category as unknown as { _count: { resources: number } })._count.resources,
      children: ((category as unknown as { subcategories: Array<{
        id: number
        name: string
        slug: string
        _count: { resources: number }
        subSubcategories: Array<{
          id: number
          name: string
          slug: string
          _count: { resources: number }
        }>
      }> }).subcategories ?? []).map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        resourceCount: sub._count.resources,
        children: (sub.subSubcategories ?? []).map((subSub) => ({
          id: subSub.id,
          name: subSub.name,
          slug: subSub.slug,
          resourceCount: subSub._count.resources,
        })),
      })),
    }))

    return NextResponse.json(
      { success: true, data: tree },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
