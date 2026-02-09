import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { AppError, Errors } from "@/lib/api-error"
import { getReadme, getRepoContent, createCommit } from "./github-client"
import { parseAwesomeListMarkdown } from "./markdown-parser"
import { formatAwesomeListMarkdown } from "./markdown-formatter"
import { lintAwesomeList } from "./awesome-lint"
import type { ParsedResource } from "./markdown-parser"
import type { ConflictStrategy, ImportResult, ExportResult } from "./github-types"

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
async function ensureCategory(name: string): Promise<number> {
  const slug = generateSlug(name)

  const existing = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  const maxOrder = await prisma.category.aggregate({
    _max: { displayOrder: true },
  })

  const created = await prisma.category.create({
    data: {
      name,
      slug,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  })

  return created.id
}

/**
 * Find or create a subcategory by name under a given category, returning its ID.
 */
async function ensureSubcategory(
  name: string,
  categoryId: number
): Promise<number> {
  const slug = generateSlug(name)

  const existing = await prisma.subcategory.findFirst({
    where: { categoryId, slug },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  const maxOrder = await prisma.subcategory.aggregate({
    where: { categoryId },
    _max: { displayOrder: true },
  })

  const created = await prisma.subcategory.create({
    data: {
      name,
      slug,
      categoryId,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  })

  return created.id
}

/**
 * Find or create a sub-subcategory by name under a given subcategory, returning its ID.
 */
async function ensureSubSubcategory(
  name: string,
  subcategoryId: number
): Promise<number> {
  const slug = generateSlug(name)

  const existing = await prisma.subSubcategory.findFirst({
    where: { subcategoryId, slug },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  const maxOrder = await prisma.subSubcategory.aggregate({
    where: { subcategoryId },
    _max: { displayOrder: true },
  })

  const created = await prisma.subSubcategory.create({
    data: {
      name,
      slug,
      subcategoryId,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  })

  return created.id
}

/**
 * Resolve a parsed resource's category path to database IDs.
 * Auto-creates missing categories at any level.
 */
async function resolveCategoryPath(
  categoryPath: string[]
): Promise<{
  categoryId: number
  subcategoryId: number | null
  subSubcategoryId: number | null
}> {
  const first = categoryPath[0]
  if (!first) {
    throw new AppError("Resource has no category path", 422, "MISSING_CATEGORY")
  }

  const categoryId = await ensureCategory(first)
  let subcategoryId: number | null = null
  let subSubcategoryId: number | null = null

  const second = categoryPath[1]
  if (second) {
    subcategoryId = await ensureSubcategory(second, categoryId)
  }

  const third = categoryPath[2]
  if (third && subcategoryId !== null) {
    subSubcategoryId = await ensureSubSubcategory(
      third,
      subcategoryId
    )
  }

  return { categoryId, subcategoryId, subSubcategoryId }
}

/**
 * Process a single parsed resource during import.
 * Handles conflict strategy and returns the action taken.
 */
async function processResource(
  parsed: ParsedResource,
  listId: number,
  conflictStrategy: ConflictStrategy,
  autoApprove: boolean
): Promise<"added" | "updated" | "skipped" | "conflict"> {
  const existing = await prisma.resource.findUnique({
    where: { url: parsed.url },
    select: { id: true, title: true, description: true },
  })

  const { categoryId, subcategoryId, subSubcategoryId } =
    await resolveCategoryPath(parsed.categoryPath)

  if (existing) {
    switch (conflictStrategy) {
      case "skip":
        // Ensure mapping exists even when skipping
        await prisma.githubResourceMapping.upsert({
          where: {
            resourceId_listId: {
              resourceId: existing.id,
              listId,
            },
          },
          update: {
            lineNumber: parsed.lineNumber,
            sectionPath: parsed.categoryPath.join(" > "),
            lastSyncAt: new Date(),
          },
          create: {
            resourceId: existing.id,
            listId,
            lineNumber: parsed.lineNumber,
            sectionPath: parsed.categoryPath.join(" > "),
            lastSyncAt: new Date(),
          },
        })
        return "skipped"

      case "update":
        await prisma.resource.update({
          where: { id: existing.id },
          data: {
            title: parsed.title,
            description: parsed.description || existing.description,
            categoryId,
            subcategoryId,
            subSubcategoryId,
            githubSynced: true,
            lastSyncedAt: new Date(),
          },
        })
        await prisma.githubResourceMapping.upsert({
          where: {
            resourceId_listId: {
              resourceId: existing.id,
              listId,
            },
          },
          update: {
            lineNumber: parsed.lineNumber,
            sectionPath: parsed.categoryPath.join(" > "),
            lastSyncAt: new Date(),
          },
          create: {
            resourceId: existing.id,
            listId,
            lineNumber: parsed.lineNumber,
            sectionPath: parsed.categoryPath.join(" > "),
            lastSyncAt: new Date(),
          },
        })
        return "updated"

      case "create":
        return "conflict"
    }
  }

  // Resource doesn't exist -- create it
  const resource = await prisma.resource.create({
    data: {
      title: parsed.title,
      url: parsed.url,
      description: parsed.description || "",
      categoryId,
      subcategoryId,
      subSubcategoryId,
      status: autoApprove ? "approved" : "pending",
      githubSynced: true,
      lastSyncedAt: new Date(),
    },
  })

  await prisma.githubResourceMapping.create({
    data: {
      resourceId: resource.id,
      listId,
      lineNumber: parsed.lineNumber,
      sectionPath: parsed.categoryPath.join(" > "),
      lastSyncAt: new Date(),
    },
  })

  return "added"
}

/**
 * Import resources from a GitHub awesome-list repository.
 *
 * 1. Fetch the AwesomeList record from DB
 * 2. Fetch README via github-client
 * 3. Parse markdown via markdown-parser
 * 4. For each parsed resource, apply conflict strategy
 * 5. Auto-create missing categories/subcategories/sub-subcategories
 * 6. Create GithubResourceMapping for each imported resource
 * 7. Create GithubSyncHistory record with stats
 * 8. Update AwesomeList.lastSyncAt
 * 9. Return ImportResult
 */
export async function importFromGithub(config: {
  listId: number
  conflictStrategy: ConflictStrategy
  autoApprove: boolean
}): Promise<ImportResult> {
  const list = await prisma.awesomeList.findUnique({
    where: { id: config.listId },
  })

  if (!list) {
    throw Errors.NOT_FOUND("AwesomeList")
  }

  // Create queue entry for tracking
  const queueEntry = await prisma.githubSyncQueue.create({
    data: {
      listId: list.id,
      action: "import",
      status: "processing",
      payload: {
        conflictStrategy: config.conflictStrategy,
        autoApprove: config.autoApprove,
      } as unknown as Prisma.InputJsonValue,
    },
  })

  const stats = {
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
    conflicts: 0,
  }
  const errors: Array<{ url: string; error: string }> = []

  try {
    // Fetch README content
    const listConfig = (list.config ?? {}) as Record<string, unknown>
    const token = (listConfig.token as string) ?? undefined

    let markdown: string
    if (list.filePath === "README.md") {
      markdown = await getReadme(
        list.repoOwner,
        list.repoName,
        list.branch,
        token
      )
    } else {
      markdown = await getRepoContent(
        list.repoOwner,
        list.repoName,
        list.filePath,
        list.branch,
        token
      )
    }

    // Parse the markdown
    const parsed = parseAwesomeListMarkdown(markdown)

    // Process each resource
    for (const resource of parsed.resources) {
      try {
        const result = await processResource(
          resource,
          list.id,
          config.conflictStrategy,
          config.autoApprove
        )

        switch (result) {
          case "added":
            stats.itemsAdded++
            break
          case "updated":
            stats.itemsUpdated++
            break
          case "skipped":
            stats.itemsSkipped++
            break
          case "conflict":
            stats.conflicts++
            break
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error"
        errors.push({ url: resource.url, error: message })
      }
    }

    // Update queue entry status
    await prisma.githubSyncQueue.update({
      where: { id: queueEntry.id },
      data: { status: "completed" },
    })
  } catch (err) {
    // Update queue entry with error
    const message = err instanceof Error ? err.message : "Unknown error"
    await prisma.githubSyncQueue.update({
      where: { id: queueEntry.id },
      data: {
        status: "failed",
        error: message,
      },
    })

    // Still create history record for the failed attempt
    const history = await prisma.githubSyncHistory.create({
      data: {
        listId: list.id,
        action: "import",
        status: "failed",
        ...stats,
        errorLog: [
          { error: message, timestamp: new Date().toISOString() },
        ] as unknown as Prisma.InputJsonValue,
      },
    })

    return {
      success: false,
      ...stats,
      errors: [{ url: "", error: message }],
      historyId: history.id,
    }
  }

  // Create sync history record
  const history = await prisma.githubSyncHistory.create({
    data: {
      listId: list.id,
      action: "import",
      status: errors.length > 0 ? "completed_with_errors" : "completed",
      ...stats,
      errorLog:
        errors.length > 0
          ? (errors as unknown as Prisma.InputJsonValue)
          : ([] as unknown as Prisma.InputJsonValue),
    },
  })

  // Update AwesomeList last sync timestamp
  await prisma.awesomeList.update({
    where: { id: list.id },
    data: { lastSyncAt: new Date() },
  })

  return {
    success: true,
    ...stats,
    errors,
    historyId: history.id,
  }
}

/**
 * Export resources to a GitHub awesome-list repository.
 *
 * 1. Fetch the AwesomeList record from DB
 * 2. Generate markdown via formatAwesomeListMarkdown
 * 3. Lint the markdown via lintAwesomeList
 * 4. If lint has errors, store them and return failure
 * 5. Create commit via createCommit from github-client
 * 6. Create GithubSyncHistory record with "export" action
 * 7. Update AwesomeList.lastSyncAt
 * 8. Return ExportResult
 */
export async function exportToGithub(config: {
  listId: number
}): Promise<ExportResult> {
  const list = await prisma.awesomeList.findUnique({
    where: { id: config.listId },
  })

  if (!list) {
    throw Errors.NOT_FOUND("AwesomeList")
  }

  // Generate markdown from database
  const { markdown, resourceCount, categoryCount } =
    await formatAwesomeListMarkdown({
      listId: list.id,
      title: list.name,
    })

  // Lint the generated markdown
  const lintResult = lintAwesomeList(markdown)

  // If lint has errors, record failure and return
  if (!lintResult.valid) {
    const history = await prisma.githubSyncHistory.create({
      data: {
        listId: list.id,
        action: "export",
        status: "failed",
        itemsAdded: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        conflicts: 0,
        errorLog: lintResult.errors.map((e) => ({
          rule: e.rule,
          line: e.line,
          message: e.message,
        })) as unknown as Prisma.InputJsonValue,
        snapshot: {
          markdown,
          resourceCount,
          categoryCount,
          lintErrors: lintResult.errors.length,
          lintWarnings: lintResult.warnings.length,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    return {
      success: false,
      resourceCount,
      lintErrors: lintResult.errors.length,
      historyId: history.id,
    }
  }

  // Push to GitHub via commit
  const listConfig = (list.config ?? {}) as Record<string, unknown>
  const token = (listConfig.token as string) ?? undefined

  let commitSha: string
  try {
    commitSha = await createCommit(
      list.repoOwner,
      list.repoName,
      list.branch,
      list.filePath,
      markdown,
      `chore: update awesome list (${resourceCount} resources, ${categoryCount} categories)`,
      token
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"

    const history = await prisma.githubSyncHistory.create({
      data: {
        listId: list.id,
        action: "export",
        status: "failed",
        itemsAdded: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        conflicts: 0,
        errorLog: [
          { error: message, timestamp: new Date().toISOString() },
        ] as unknown as Prisma.InputJsonValue,
        snapshot: {
          markdown,
          resourceCount,
          categoryCount,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    return {
      success: false,
      resourceCount,
      lintErrors: 0,
      historyId: history.id,
    }
  }

  // Create sync history record
  const history = await prisma.githubSyncHistory.create({
    data: {
      listId: list.id,
      action: "export",
      status: "completed",
      itemsAdded: resourceCount,
      itemsUpdated: 0,
      itemsSkipped: 0,
      conflicts: 0,
      errorLog: [] as unknown as Prisma.InputJsonValue,
      snapshot: {
        markdown,
        resourceCount,
        categoryCount,
        commitSha,
        lintWarnings: lintResult.warnings.length,
      } as unknown as Prisma.InputJsonValue,
    },
  })

  // Update AwesomeList last sync timestamp
  await prisma.awesomeList.update({
    where: { id: list.id },
    data: { lastSyncAt: new Date() },
  })

  // Mark all approved resources as synced
  await prisma.resource.updateMany({
    where: { status: "approved" },
    data: {
      githubSynced: true,
      lastSyncedAt: new Date(),
    },
  })

  return {
    success: true,
    commitSha,
    resourceCount,
    lintErrors: 0,
    historyId: history.id,
  }
}
