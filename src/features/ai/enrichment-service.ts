import { prisma } from "@/lib/prisma"
import { analyzeUrl } from "@/features/ai/claude-service"
import { Prisma } from "@/generated/prisma/client"

/**
 * Start a new enrichment job.
 * Creates the job record, queries resources based on filter, creates queue items,
 * and fires off async processing.
 */
export async function startJob(
  filter: "all" | "unenriched"
): Promise<number> {
  const job = await prisma.enrichmentJob.create({
    data: {
      status: "processing",
      filter,
      startedAt: new Date(),
    },
  })

  const whereClause: Prisma.ResourceWhereInput =
    filter === "unenriched"
      ? {
          status: "approved",
          OR: [
            { metadata: { equals: {} } },
            { metadata: { equals: Prisma.DbNull } },
          ],
        }
      : { status: "approved" }

  const resources = await prisma.resource.findMany({
    where: whereClause,
    select: { id: true },
  })

  if (resources.length === 0) {
    await prisma.enrichmentJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        totalItems: 0,
        completedAt: new Date(),
      },
    })
    return job.id
  }

  await prisma.enrichmentQueueItem.createMany({
    data: resources.map((r) => ({
      jobId: job.id,
      resourceId: r.id,
      status: "pending" as const,
    })),
  })

  await prisma.enrichmentJob.update({
    where: { id: job.id },
    data: { totalItems: resources.length },
  })

  processQueue(job.id).catch(async (err) => {
    await markJobFailed(job.id, err)
  })

  return job.id
}

/**
 * Mark a job as failed with error info.
 */
async function markJobFailed(
  jobId: number,
  error: unknown
): Promise<void> {
  const message =
    error instanceof Error ? error.message : "Unknown error"

  const job = await prisma.enrichmentJob.findUnique({
    where: { id: jobId },
    select: { errorLog: true },
  })

  const existingErrors = Array.isArray(job?.errorLog)
    ? (job.errorLog as Array<Record<string, unknown>>)
    : []

  await prisma.enrichmentJob.update({
    where: { id: jobId },
    data: {
      status: "failed",
      completedAt: new Date(),
      errorLog: [
        ...existingErrors,
        { error: message, timestamp: new Date().toISOString() },
      ] as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Process all pending queue items for a job sequentially.
 * Includes 1s delay between items, exponential backoff retries (max 3),
 * and cancellation checks.
 */
export async function processQueue(jobId: number): Promise<void> {
  const pendingItems = await prisma.enrichmentQueueItem.findMany({
    where: { jobId, status: "pending" },
    include: { job: { select: { status: true } } },
    orderBy: { id: "asc" },
  })

  for (const item of pendingItems) {
    const currentJob = await prisma.enrichmentJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    })

    if (!currentJob || currentJob.status === "cancelled") {
      break
    }

    await processItem(jobId, item.id, item.resourceId)

    await delay(1000)
  }

  const finalJob = await prisma.enrichmentJob.findUnique({
    where: { id: jobId },
    select: { status: true },
  })

  if (finalJob && finalJob.status === "processing") {
    await prisma.enrichmentJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    })
  }
}

/**
 * Process a single queue item with retry logic.
 */
async function processItem(
  jobId: number,
  itemId: number,
  resourceId: number
): Promise<void> {
  await prisma.enrichmentQueueItem.update({
    where: { id: itemId },
    data: { status: "processing" },
  })

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { url: true, metadata: true },
  })

  if (!resource) {
    await prisma.enrichmentQueueItem.update({
      where: { id: itemId },
      data: { status: "failed", error: "Resource not found" },
    })
    await incrementJobCount(jobId, "skippedItems")
    return
  }

  const item = await prisma.enrichmentQueueItem.findUnique({
    where: { id: itemId },
    select: { retryCount: true },
  })

  const retryCount = item?.retryCount ?? 0
  const maxRetries = 3

  try {
    const result = await analyzeUrl(resource.url)

    const existingMetadata =
      resource.metadata && typeof resource.metadata === "object"
        ? (resource.metadata as Record<string, unknown>)
        : {}

    const enrichedMetadata = {
      ...existingMetadata,
      suggestedTitle: result.suggestedTitle,
      suggestedDescription: result.suggestedDescription,
      suggestedTags: result.suggestedTags,
      suggestedCategory: result.suggestedCategory,
      difficulty: result.difficulty,
      confidence: result.confidence,
      keyTopics: result.keyTopics,
      ogImage: result.ogImage,
      enrichedAt: new Date().toISOString(),
    }

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        metadata: enrichedMetadata as Prisma.InputJsonValue,
      },
    })

    await prisma.enrichmentQueueItem.update({
      where: { id: itemId },
      data: {
        status: "completed",
        result: enrichedMetadata as Prisma.InputJsonValue,
      },
    })

    await incrementJobCount(jobId, "processedItems")
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"

    if (retryCount + 1 >= maxRetries) {
      await prisma.enrichmentQueueItem.update({
        where: { id: itemId },
        data: {
          status: "failed",
          retryCount: retryCount + 1,
          error: errorMessage,
        },
      })

      await incrementJobCount(jobId, "failedItems")
      await appendErrorLog(jobId, resourceId, errorMessage)
    } else {
      const backoffMs = Math.pow(2, retryCount + 1) * 1000
      await delay(backoffMs)

      await prisma.enrichmentQueueItem.update({
        where: { id: itemId },
        data: {
          status: "pending",
          retryCount: retryCount + 1,
          error: errorMessage,
        },
      })

      await processItem(jobId, itemId, resourceId)
    }
  }
}

/**
 * Increment a progress counter on the job.
 */
async function incrementJobCount(
  jobId: number,
  field: "processedItems" | "failedItems" | "skippedItems"
): Promise<void> {
  await prisma.enrichmentJob.update({
    where: { id: jobId },
    data: { [field]: { increment: 1 } },
  })
}

/**
 * Append an error entry to the job's errorLog JSON array.
 */
async function appendErrorLog(
  jobId: number,
  resourceId: number,
  errorMessage: string
): Promise<void> {
  const job = await prisma.enrichmentJob.findUnique({
    where: { id: jobId },
    select: { errorLog: true },
  })

  const existingErrors = Array.isArray(job?.errorLog)
    ? (job.errorLog as Array<Record<string, unknown>>)
    : []

  await prisma.enrichmentJob.update({
    where: { id: jobId },
    data: {
      errorLog: [
        ...existingErrors,
        {
          resourceId,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
      ] as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Cancel an enrichment job and all its pending queue items.
 */
export async function cancelJob(jobId: number): Promise<void> {
  await prisma.enrichmentJob.update({
    where: { id: jobId },
    data: {
      status: "cancelled",
      completedAt: new Date(),
    },
  })

  await prisma.enrichmentQueueItem.updateMany({
    where: { jobId, status: { in: ["pending", "processing"] } },
    data: { status: "cancelled" },
  })
}

/**
 * Get detailed status of an enrichment job including queue item counts.
 */
export async function getJobStatus(jobId: number) {
  const job = await prisma.enrichmentJob.findUnique({
    where: { id: jobId },
  })

  if (!job) {
    return null
  }

  const statusCounts = await prisma.enrichmentQueueItem.groupBy({
    by: ["status"],
    where: { jobId },
    _count: { status: true },
  })

  const counts: Record<string, number> = {}
  for (const entry of statusCounts) {
    counts[entry.status] = entry._count.status
  }

  return {
    ...job,
    queueCounts: counts,
  }
}

/**
 * List all enrichment jobs ordered by most recent first.
 */
export async function listJobs() {
  return prisma.enrichmentJob.findMany({
    orderBy: { createdAt: "desc" },
  })
}

/**
 * Promise-based delay utility.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
