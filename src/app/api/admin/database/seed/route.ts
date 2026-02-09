import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { parseAwesomeListMarkdown } from "@/features/github/markdown-parser"
import { logger } from "@/lib/logger"

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/krzemienski/awesome-video/master/README.md"

/**
 * Generate a URL-friendly slug from a name.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Find or create a category by name, returning its ID.
 */
async function ensureCategory(
  name: string,
  orderCounter: { value: number }
): Promise<number> {
  const slug = generateSlug(name)

  const existing = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  orderCounter.value += 1
  const created = await prisma.category.create({
    data: {
      name,
      slug,
      displayOrder: orderCounter.value,
    },
  })

  return created.id
}

/**
 * Find or create a subcategory by name under a given category, returning its ID.
 */
async function ensureSubcategory(
  name: string,
  categoryId: number,
  orderCounter: { value: number }
): Promise<number> {
  const slug = generateSlug(name)

  const existing = await prisma.subcategory.findFirst({
    where: { categoryId, slug },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  orderCounter.value += 1
  const created = await prisma.subcategory.create({
    data: {
      name,
      slug,
      categoryId,
      displayOrder: orderCounter.value,
    },
  })

  return created.id
}

/**
 * Find or create a sub-subcategory by name under a given subcategory, returning its ID.
 */
async function ensureSubSubcategory(
  name: string,
  subcategoryId: number,
  orderCounter: { value: number }
): Promise<number> {
  const slug = generateSlug(name)

  const existing = await prisma.subSubcategory.findFirst({
    where: { subcategoryId, slug },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  orderCounter.value += 1
  const created = await prisma.subSubcategory.create({
    data: {
      name,
      slug,
      subcategoryId,
      displayOrder: orderCounter.value,
    },
  })

  return created.id
}

/**
 * Resolve a parsed resource's category path to database IDs.
 */
async function resolveCategoryPath(
  categoryPath: readonly string[],
  counters: {
    category: { value: number }
    subcategory: { value: number }
    subSubcategory: { value: number }
  }
): Promise<{
  categoryId: number
  subcategoryId: number | null
  subSubcategoryId: number | null
}> {
  const first = categoryPath[0]
  if (!first) {
    throw new Error("Resource has no category path")
  }

  const categoryId = await ensureCategory(first, counters.category)
  let subcategoryId: number | null = null
  let subSubcategoryId: number | null = null

  const second = categoryPath[1]
  if (second) {
    subcategoryId = await ensureSubcategory(
      second,
      categoryId,
      counters.subcategory
    )
  }

  const third = categoryPath[2]
  if (third && subcategoryId !== null) {
    subSubcategoryId = await ensureSubSubcategory(
      third,
      subcategoryId,
      counters.subSubcategory
    )
  }

  return { categoryId, subcategoryId, subSubcategoryId }
}

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >
    const clearExisting = body.clearExisting === true

    // Clear existing data in dependency order if requested
    if (clearExisting) {
      await prisma.$transaction([
        prisma.resourceTag.deleteMany(),
        prisma.resource.deleteMany(),
        prisma.subSubcategory.deleteMany(),
        prisma.subcategory.deleteMany(),
        prisma.category.deleteMany(),
        prisma.tag.deleteMany(),
      ])
    }

    // Fetch awesome-list markdown from GitHub
    const response = await fetch(GITHUB_RAW_URL)
    if (!response.ok) {
      throw new Error(
        `Failed to fetch awesome-list: ${response.status} ${response.statusText}`
      )
    }
    const markdown = await response.text()

    // Parse the markdown
    const parsed = parseAwesomeListMarkdown(markdown)

    // Track counts
    const counts = {
      categories: 0,
      subcategories: 0,
      subSubcategories: 0,
      resources: 0,
      skipped: 0,
    }

    // Track created slugs to count unique creations
    const createdCategorySlugs = new Set<string>()
    const createdSubcategorySlugs = new Set<string>()
    const createdSubSubcategorySlugs = new Set<string>()

    // Order counters for display ordering
    const orderCounters = {
      category: { value: 0 },
      subcategory: { value: 0 },
      subSubcategory: { value: 0 },
    }

    // Insert parsed resources
    for (const resource of parsed.resources) {
      try {
        const { categoryId, subcategoryId, subSubcategoryId } =
          await resolveCategoryPath(resource.categoryPath, orderCounters)

        // Track which categories were created
        if (resource.categoryPath[0]) {
          createdCategorySlugs.add(generateSlug(resource.categoryPath[0]))
        }
        if (resource.categoryPath[1]) {
          createdSubcategorySlugs.add(
            `${resource.categoryPath[0]}/${resource.categoryPath[1]}`
          )
        }
        if (resource.categoryPath[2]) {
          createdSubSubcategorySlugs.add(
            `${resource.categoryPath[0]}/${resource.categoryPath[1]}/${resource.categoryPath[2]}`
          )
        }

        // Skip if resource URL already exists
        const existing = await prisma.resource.findUnique({
          where: { url: resource.url },
          select: { id: true },
        })

        if (existing) {
          counts.skipped += 1
          continue
        }

        await prisma.resource.create({
          data: {
            title: resource.title,
            url: resource.url,
            description: resource.description || "",
            categoryId,
            subcategoryId,
            subSubcategoryId,
            status: "approved",
          },
        })

        counts.resources += 1
      } catch (err) {
        // Skip individual resource errors and continue
        const message = err instanceof Error ? err.message : "Unknown error"
        logger.error({ url: resource.url, err: message }, "Seed: failed to import resource")
        counts.skipped += 1
      }
    }

    counts.categories = createdCategorySlugs.size
    counts.subcategories = createdSubcategorySlugs.size
    counts.subSubcategories = createdSubSubcategorySlugs.size

    return apiSuccess({
      message: `Seed complete: ${counts.resources} resources, ${counts.categories} categories, ${counts.subcategories} subcategories imported`,
      counts: {
        categories: counts.categories,
        subcategories: counts.subcategories,
        subSubcategories: counts.subSubcategories,
        resources: counts.resources,
        skipped: counts.skipped,
      },
      source: "krzemienski/awesome-video",
      clearExisting,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
