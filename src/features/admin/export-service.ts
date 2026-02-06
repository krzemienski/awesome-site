import { prisma } from "@/lib/prisma"
import {
  formatAwesomeListMarkdown,
  type ExportMarkdownResult,
} from "@/features/github/markdown-formatter"
import { lintAwesomeList, type LintResult } from "@/features/github/awesome-lint"

/**
 * Export the awesome list as formatted markdown.
 * Delegates to the existing markdown formatter.
 */
export async function exportMarkdown(
  title?: string,
  description?: string
): Promise<ExportMarkdownResult> {
  // Find the first awesome list (or create a virtual one with id 0)
  const list = await prisma.awesomeList.findFirst({
    orderBy: { id: "asc" },
  })

  return formatAwesomeListMarkdown({
    listId: list?.id ?? 0,
    title: title ?? "Awesome Resources",
    description: description ?? "A curated list of resources",
  })
}

/**
 * Full JSON backup of all approved resources and categories.
 */
export async function exportJson(): Promise<{
  exportedAt: string
  resources: Array<Record<string, unknown>>
  categories: Array<Record<string, unknown>>
  stats: { totalResources: number; totalCategories: number }
}> {
  const [resources, categories] = await Promise.all([
    prisma.resource.findMany({
      where: { status: "approved" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        subSubcategory: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
      orderBy: { title: "asc" },
    }),
    prisma.category.findMany({
      include: {
        subcategories: {
          include: {
            subSubcategories: true,
          },
          orderBy: { displayOrder: "asc" },
        },
      },
      orderBy: { displayOrder: "asc" },
    }),
  ])

  const formattedResources = resources.map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    description: r.description,
    status: r.status,
    category: r.category,
    subcategory: r.subcategory,
    subSubcategory: r.subSubcategory,
    tags: r.tags.map((rt) => rt.tag),
    metadata: r.metadata,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  const formattedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    displayOrder: c.displayOrder,
    subcategories: c.subcategories.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      displayOrder: s.displayOrder,
      subSubcategories: s.subSubcategories.map((ss) => ({
        id: ss.id,
        name: ss.name,
        slug: ss.slug,
        description: ss.description,
        displayOrder: ss.displayOrder,
      })),
    })),
  }))

  return {
    exportedAt: new Date().toISOString(),
    resources: formattedResources,
    categories: formattedCategories,
    stats: {
      totalResources: resources.length,
      totalCategories: categories.length,
    },
  }
}

/**
 * Export selected resources as CSV.
 */
export async function exportCsv(filters?: {
  categoryId?: number
  status?: string
}): Promise<string> {
  const where: Record<string, unknown> = {}

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId
  }

  if (filters?.status) {
    where.status = filters.status
  } else {
    where.status = "approved"
  }

  const resources = await prisma.resource.findMany({
    where,
    include: {
      category: { select: { name: true } },
      subcategory: { select: { name: true } },
    },
    orderBy: { title: "asc" },
  })

  const headers = [
    "id",
    "title",
    "url",
    "description",
    "category",
    "subcategory",
    "status",
    "createdAt",
  ]

  const escapeCsvField = (field: string): string => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  const rows = resources.map((r) =>
    [
      String(r.id),
      escapeCsvField(r.title),
      escapeCsvField(r.url),
      escapeCsvField(r.description),
      escapeCsvField(r.category.name),
      escapeCsvField(r.subcategory?.name ?? ""),
      r.status,
      r.createdAt.toISOString(),
    ].join(",")
  )

  return [headers.join(","), ...rows].join("\n")
}

/**
 * Validate markdown against awesome-lint rules.
 */
export function validateAwesomeLint(markdown: string): LintResult {
  return lintAwesomeList(markdown)
}
