import { prisma } from "@/lib/prisma"

/**
 * Result of formatting the awesome list markdown.
 */
export interface ExportMarkdownResult {
  markdown: string
  resourceCount: number
  categoryCount: number
}

/**
 * Internal type for a resource row fetched from the database.
 */
interface ResourceRow {
  title: string
  url: string
  description: string
  category: { name: string }
  subcategory: { name: string } | null
  subSubcategory: { name: string } | null
}

/**
 * A section node used to build the hierarchical markdown.
 */
interface SectionNode {
  name: string
  resources: Array<{ title: string; url: string; description: string }>
  children: Map<string, SectionNode>
}

/**
 * Generate a kebab-case anchor from a heading name.
 */
function toAnchor(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Build a section tree from flat resource rows.
 * Returns a Map of top-level category name -> SectionNode.
 */
function buildSectionTree(resources: ResourceRow[]): Map<string, SectionNode> {
  const tree = new Map<string, SectionNode>()

  for (const r of resources) {
    const categoryName = r.category.name

    if (!tree.has(categoryName)) {
      tree.set(categoryName, {
        name: categoryName,
        resources: [],
        children: new Map(),
      })
    }

    const catNode = tree.get(categoryName)!

    if (r.subcategory) {
      const subName = r.subcategory.name

      if (!catNode.children.has(subName)) {
        catNode.children.set(subName, {
          name: subName,
          resources: [],
          children: new Map(),
        })
      }

      const subNode = catNode.children.get(subName)!

      if (r.subSubcategory) {
        const subSubName = r.subSubcategory.name

        if (!subNode.children.has(subSubName)) {
          subNode.children.set(subSubName, {
            name: subSubName,
            resources: [],
            children: new Map(),
          })
        }

        subNode.children.get(subSubName)!.resources.push({
          title: r.title,
          url: r.url,
          description: r.description,
        })
      } else {
        subNode.resources.push({
          title: r.title,
          url: r.url,
          description: r.description,
        })
      }
    } else {
      catNode.resources.push({
        title: r.title,
        url: r.url,
        description: r.description,
      })
    }
  }

  return tree
}

/**
 * Sort resources alphabetically by title (case-insensitive).
 */
function sortResources(
  resources: Array<{ title: string; url: string; description: string }>
): Array<{ title: string; url: string; description: string }> {
  return [...resources].sort((a, b) =>
    a.title.toLowerCase().localeCompare(b.title.toLowerCase())
  )
}

/**
 * Render resources as markdown list items.
 */
function renderResources(
  resources: Array<{ title: string; url: string; description: string }>
): string[] {
  const sorted = sortResources(resources)
  return sorted.map((r) => {
    if (r.description) {
      return `- [${r.title}](${r.url}) - ${r.description}`
    }
    return `- [${r.title}](${r.url})`
  })
}

/**
 * Render a section and its children as markdown.
 */
function renderSection(
  node: SectionNode,
  level: number
): string[] {
  const lines: string[] = []
  const heading = "#".repeat(level)

  lines.push(`${heading} ${node.name}`)
  lines.push("")

  // Render direct resources
  if (node.resources.length > 0) {
    lines.push(...renderResources(node.resources))
    lines.push("")
  }

  // Render children sorted alphabetically by name
  const sortedChildren = [...node.children.values()].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )

  for (const child of sortedChildren) {
    lines.push(...renderSection(child, level + 1))
  }

  return lines
}

/**
 * Generate a Table of Contents from the section tree.
 */
function renderTOC(tree: Map<string, SectionNode>): string[] {
  const lines: string[] = []
  lines.push("## Contents")
  lines.push("")

  const sortedCategories = [...tree.values()].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )

  for (const cat of sortedCategories) {
    lines.push(`- [${cat.name}](#${toAnchor(cat.name)})`)
  }

  lines.push("")
  return lines
}

/**
 * Query the database for all approved resources and generate
 * awesome-lint compliant markdown.
 */
export async function formatAwesomeListMarkdown(config: {
  listId: number
  title?: string
  description?: string
}): Promise<ExportMarkdownResult> {
  const list = await prisma.awesomeList.findUnique({
    where: { id: config.listId },
  })

  const listName = config.title ?? list?.name ?? "Awesome List"
  const listDescription =
    config.description ?? "A curated list of awesome resources."

  // Fetch all approved resources with their category hierarchy
  const resources = await prisma.resource.findMany({
    where: {
      status: "approved",
      url: { not: "" },
    },
    select: {
      title: true,
      url: true,
      description: true,
      category: { select: { name: true } },
      subcategory: { select: { name: true } },
      subSubcategory: { select: { name: true } },
    },
    orderBy: { title: "asc" },
  })

  // Build section tree
  const tree = buildSectionTree(resources)

  // Generate markdown
  const lines: string[] = []

  // Title
  lines.push(`# ${listName}`)
  lines.push("")

  // Description blockquote
  lines.push(`> ${listDescription}`)
  lines.push("")

  // TOC
  lines.push(...renderTOC(tree))

  // Sections sorted alphabetically
  const sortedCategories = [...tree.values()].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )

  for (const cat of sortedCategories) {
    lines.push(...renderSection(cat, 2))
  }

  const markdown = lines.join("\n")

  return {
    markdown,
    resourceCount: resources.length,
    categoryCount: tree.size,
  }
}
