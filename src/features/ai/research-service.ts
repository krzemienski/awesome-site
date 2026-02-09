import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import type { ResearchJobType } from "@/generated/prisma/client"
import { AppError, Errors } from "@/lib/api-error"

/**
 * Start a new research job. Creates the record and fires off async processing.
 */
export async function startResearchJob(
  type: ResearchJobType,
  config?: Record<string, unknown>
): Promise<number> {
  const job = await prisma.researchJob.create({
    data: {
      type,
      status: "processing",
      config: (config ?? {}) as Prisma.InputJsonValue,
      startedAt: new Date(),
    },
  })

  processResearchJob(job.id, type, config).catch(async (err) => {
    const message = err instanceof Error ? err.message : "Unknown error"
    await prisma.researchJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        report: { error: message } as Prisma.InputJsonValue,
      },
    })
  })

  return job.id
}

/**
 * Process a research job based on its type.
 * Generates findings for each research type and updates the job on completion.
 */
async function processResearchJob(
  jobId: number,
  type: ResearchJobType,
  _config?: Record<string, unknown>
): Promise<void> {
  const findingGenerators: Record<
    ResearchJobType,
    () => Promise<void>
  > = {
    validation: () => runValidation(jobId),
    enrichment: () => runEnrichment(jobId),
    discovery: () => runDiscovery(jobId),
    trend_analysis: () => runTrendAnalysis(jobId),
    comprehensive: () => runComprehensive(jobId),
  }

  const generator = findingGenerators[type]
  await generator()

  const findings = await prisma.researchFinding.count({
    where: { jobId },
  })

  await prisma.researchJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      completedAt: new Date(),
      report: {
        type,
        totalFindings: findings,
        completedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  })
}

/**
 * Validation: Check resource URLs for broken links and missing metadata.
 */
async function runValidation(jobId: number): Promise<void> {
  const resources = await prisma.resource.findMany({
    where: { status: "approved" },
    select: { id: true, url: true, title: true, description: true },
    take: 100,
  })

  for (const resource of resources) {
    try {
      const response = await fetch(resource.url, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "AwesomeListBot/1.0" },
      })

      if (!response.ok) {
        await createFinding(jobId, {
          type: "broken_link",
          title: `Broken link: ${resource.title}`,
          description: `URL ${resource.url} returned status ${response.status}`,
          confidence: 0.95,
          data: {
            resourceId: resource.id,
            url: resource.url,
            statusCode: response.status,
            action: "review_or_remove",
          },
        })
      }
    } catch {
      await createFinding(jobId, {
        type: "broken_link",
        title: `Unreachable: ${resource.title}`,
        description: `URL ${resource.url} could not be reached (timeout or DNS failure)`,
        confidence: 0.8,
        data: {
          resourceId: resource.id,
          url: resource.url,
          action: "review_or_remove",
        },
      })
    }

    if (!resource.description || resource.description.trim().length === 0) {
      await createFinding(jobId, {
        type: "missing_metadata",
        title: `Missing description: ${resource.title}`,
        description: `Resource "${resource.title}" has no description`,
        confidence: 1.0,
        data: {
          resourceId: resource.id,
          field: "description",
          action: "add_description",
        },
      })
    }
  }
}

/**
 * Enrichment: Find resources missing descriptions or metadata.
 */
async function runEnrichment(jobId: number): Promise<void> {
  const resources = await prisma.resource.findMany({
    where: {
      status: "approved",
      OR: [
        { description: "" },
        { metadata: { equals: Prisma.DbNull } },
        { metadata: { equals: {} } },
      ],
    },
    select: { id: true, url: true, title: true, description: true, metadata: true },
    take: 100,
  })

  for (const resource of resources) {
    const missingFields: string[] = []
    if (!resource.description || resource.description.trim().length === 0) {
      missingFields.push("description")
    }
    const metadata = resource.metadata as Record<string, unknown> | null
    if (!metadata || Object.keys(metadata).length === 0) {
      missingFields.push("metadata")
    }

    await createFinding(jobId, {
      type: "missing_metadata",
      title: `Needs enrichment: ${resource.title}`,
      description: `Resource is missing: ${missingFields.join(", ")}`,
      confidence: 1.0,
      data: {
        resourceId: resource.id,
        missingFields,
        action: "enrich_resource",
      },
    })
  }
}

/**
 * Discovery: Suggest new resources based on existing categories.
 */
async function runDiscovery(jobId: number): Promise<void> {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { resources: true } },
      subcategories: {
        include: { _count: { select: { resources: true } } },
      },
    },
  })

  for (const category of categories) {
    if (category._count.resources < 5) {
      await createFinding(jobId, {
        type: "new_resource",
        title: `Low content: ${category.name}`,
        description: `Category "${category.name}" has only ${category._count.resources} resources. Consider adding more.`,
        confidence: 0.7,
        data: {
          categoryId: category.id,
          categoryName: category.name,
          currentCount: category._count.resources,
          action: "add_resources",
        },
      })
    }

    for (const sub of category.subcategories) {
      if (sub._count.resources === 0) {
        await createFinding(jobId, {
          type: "new_resource",
          title: `Empty subcategory: ${sub.name}`,
          description: `Subcategory "${sub.name}" under "${category.name}" has no resources`,
          confidence: 0.85,
          data: {
            categoryId: category.id,
            subcategoryId: sub.id,
            subcategoryName: sub.name,
            action: "add_resources_or_remove_subcategory",
          },
        })
      }
    }
  }
}

/**
 * Trend Analysis: Analyze category growth patterns and resource activity.
 */
async function runTrendAnalysis(jobId: number): Promise<void> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentResources = await prisma.resource.groupBy({
    by: ["categoryId"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: { id: true },
  })

  const categoryIds = recentResources.map((r) => r.categoryId)
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  })

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  for (const group of recentResources) {
    if (group._count.id >= 5) {
      await createFinding(jobId, {
        type: "trend",
        title: `Growing category: ${categoryMap.get(group.categoryId) ?? "Unknown"}`,
        description: `${group._count.id} new resources added in the last 30 days`,
        confidence: 0.75,
        data: {
          categoryId: group.categoryId,
          categoryName: categoryMap.get(group.categoryId),
          newResourceCount: group._count.id,
          period: "30d",
          action: "highlight_trending",
        },
      })
    }
  }

  const totalResources = await prisma.resource.count({
    where: { status: "approved" },
  })
  const recentCount = await prisma.resource.count({
    where: { status: "approved", createdAt: { gte: thirtyDaysAgo } },
  })
  const growthRate = totalResources > 0 ? (recentCount / totalResources) * 100 : 0

  await createFinding(jobId, {
    type: "trend",
    title: "Overall growth summary",
    description: `${recentCount} resources added in the last 30 days (${growthRate.toFixed(1)}% growth rate)`,
    confidence: 1.0,
    data: {
      totalResources,
      recentCount,
      growthRate: Number(growthRate.toFixed(1)),
      period: "30d",
      action: "informational",
    },
  })
}

/**
 * Comprehensive: Run all research types.
 */
async function runComprehensive(jobId: number): Promise<void> {
  await runValidation(jobId)
  await runEnrichment(jobId)
  await runDiscovery(jobId)
  await runTrendAnalysis(jobId)
}

/**
 * Helper to create a research finding record.
 */
async function createFinding(
  jobId: number,
  finding: {
    type: string
    title: string
    description: string
    confidence: number
    data: Record<string, unknown>
  }
): Promise<void> {
  await prisma.researchFinding.create({
    data: {
      jobId,
      type: finding.type,
      title: finding.title,
      description: finding.description,
      confidence: finding.confidence,
      data: finding.data as Prisma.InputJsonValue,
    },
  })
}

/**
 * Apply a research finding -- mark as applied and execute the suggested change.
 */
export async function applyFinding(findingId: number): Promise<void> {
  const finding = await prisma.researchFinding.findUnique({
    where: { id: findingId },
  })

  if (!finding) {
    throw Errors.NOT_FOUND("Research finding")
  }

  if (finding.applied) {
    throw new AppError("Finding already applied", 400, "ALREADY_APPLIED")
  }

  const data = finding.data as Record<string, unknown>
  const action = data.action as string | undefined

  if (action === "review_or_remove" && data.resourceId) {
    await prisma.resource.update({
      where: { id: data.resourceId as number },
      data: { status: "rejected" },
    })
  }

  await prisma.researchFinding.update({
    where: { id: findingId },
    data: { applied: true },
  })
}

/**
 * Dismiss a research finding.
 */
export async function dismissFinding(findingId: number): Promise<void> {
  const finding = await prisma.researchFinding.findUnique({
    where: { id: findingId },
  })

  if (!finding) {
    throw Errors.NOT_FOUND("Research finding")
  }

  await prisma.researchFinding.update({
    where: { id: findingId },
    data: { dismissed: true },
  })
}

/**
 * Get a research job by ID with its findings.
 */
export async function getJob(id: number) {
  const job = await prisma.researchJob.findUnique({
    where: { id },
    include: {
      findings: {
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { findings: true } },
    },
  })

  if (!job) {
    throw Errors.NOT_FOUND("Research job")
  }

  return job
}

/**
 * List all research jobs ordered by most recent first.
 */
export async function listJobs() {
  return prisma.researchJob.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { findings: true } },
    },
  })
}

/**
 * Cancel a research job.
 */
export async function cancelJob(id: number): Promise<void> {
  const job = await prisma.researchJob.findUnique({
    where: { id },
  })

  if (!job) {
    throw Errors.NOT_FOUND("Research job")
  }

  await prisma.researchJob.update({
    where: { id },
    data: {
      status: "cancelled",
      completedAt: new Date(),
    },
  })
}

/**
 * Get the report JSON for a research job.
 */
export async function getJobReport(id: number) {
  const job = await prisma.researchJob.findUnique({
    where: { id },
    select: { id: true, type: true, status: true, report: true },
  })

  if (!job) {
    throw Errors.NOT_FOUND("Research job")
  }

  return job
}

/**
 * Get AI cost breakdown for the last N days, aggregated by model.
 */
export async function getCostBreakdown(days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const usage = await prisma.aiUsageDaily.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "desc" },
  })

  const byModel: Record<string, {
    requestCount: number
    totalTokens: number
    estimatedCostUsd: number
  }> = {}

  for (const entry of usage) {
    const existing = byModel[entry.model] ?? {
      requestCount: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    }

    byModel[entry.model] = {
      requestCount: existing.requestCount + entry.requestCount,
      totalTokens: existing.totalTokens + entry.totalTokens,
      estimatedCostUsd: existing.estimatedCostUsd + entry.estimatedCostUsd,
    }
  }

  const totalCost = Object.values(byModel).reduce(
    (sum, m) => sum + m.estimatedCostUsd,
    0
  )

  return {
    days,
    totalCost,
    byModel,
    dailyUsage: usage,
  }
}
