import { prisma } from "@/lib/prisma"
import { getSetting, setSetting } from "@/features/admin/settings-service"

export interface LinkCheckResult {
  resourceId: number
  url: string
  title: string
  statusCode: number | null
  responseTime: number
  error: string | null
  healthy: boolean
  checkedAt: string
}

export interface LinkHealthReport {
  totalChecked: number
  healthy: number
  broken: number
  timeout: number
  results: LinkCheckResult[]
  startedAt: string
  completedAt: string
}

export interface LinkHealthHistoryEntry {
  readonly timestamp: string
  readonly totalChecked: number
  readonly healthy: number
  readonly broken: number
  readonly timeout: number
}

const CONCURRENCY_LIMIT = 10
const REQUEST_TIMEOUT_MS = 10_000

async function withConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0

  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++
      const item = items[i]
      if (item !== undefined) {
        results[i] = await fn(item)
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  )
  return results
}

async function checkSingleUrl(
  resource: { id: number; url: string; title: string },
  isRetry = false
): Promise<LinkCheckResult> {
  const checkedAt = new Date().toISOString()
  const start = Date.now()

  try {
    const method = isRetry ? "GET" : "HEAD"
    const response = await fetch(resource.url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "User-Agent": "AwesomeSite-LinkChecker/1.0",
      },
    })

    const responseTime = Date.now() - start
    const statusCode = response.status

    if (statusCode === 405 && !isRetry) {
      return checkSingleUrl(resource, true)
    }

    return {
      resourceId: resource.id,
      url: resource.url,
      title: resource.title,
      statusCode,
      responseTime,
      error: null,
      healthy: statusCode >= 200 && statusCode < 400,
      checkedAt,
    }
  } catch (err) {
    const responseTime = Date.now() - start
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError"

    if (isTimeout && !isRetry) {
      return checkSingleUrl(resource, true)
    }

    const errorMessage =
      err instanceof Error ? err.message : "Unknown error"

    return {
      resourceId: resource.id,
      url: resource.url,
      title: resource.title,
      statusCode: null,
      responseTime,
      error: isTimeout ? "Request timed out" : errorMessage,
      healthy: false,
      checkedAt,
    }
  }
}

export async function checkLinks(): Promise<LinkHealthReport> {
  const startedAt = new Date().toISOString()

  const resources = await prisma.resource.findMany({
    where: { status: "approved" },
    select: { id: true, url: true, title: true },
  })

  const results = await withConcurrency(
    resources,
    CONCURRENCY_LIMIT,
    (resource) => checkSingleUrl(resource)
  )

  const healthy = results.filter((r) => r.healthy).length
  const broken = results.filter((r) => !r.healthy && !r.error?.includes("timed out")).length
  const timeout = results.filter((r) => r.error?.includes("timed out")).length

  const report: LinkHealthReport = {
    totalChecked: results.length,
    healthy,
    broken,
    timeout,
    results,
    startedAt,
    completedAt: new Date().toISOString(),
  }

  await setSetting(
    "linkHealth.lastResults",
    report as unknown as import("@/generated/prisma/client").Prisma.InputJsonValue,
    "Last link health check results"
  )
  await setSetting(
    "linkHealth.lastRunAt",
    new Date().toISOString(),
    "Last link health check timestamp"
  )

  const existingHistory =
    (await getSetting<LinkHealthHistoryEntry[]>("linkHealth.history")) ?? []
  const newEntry: LinkHealthHistoryEntry = {
    timestamp: new Date().toISOString(),
    totalChecked: results.length,
    healthy,
    broken,
    timeout,
  }
  const cappedHistory = [...existingHistory, newEntry].slice(-50)
  await setSetting(
    "linkHealth.history",
    cappedHistory as unknown as import("@/generated/prisma/client").Prisma.InputJsonValue,
    "Link health check history"
  )

  return report
}

export type LinkHealthFilter = "broken" | "healthy" | "all"

export async function getResults(
  filter: LinkHealthFilter = "all"
): Promise<LinkHealthReport | null> {
  const report = await getSetting<LinkHealthReport>("linkHealth.lastResults")

  if (!report) {
    return null
  }

  if (filter === "all") {
    return {
      ...report,
      results: [...report.results].sort(
        (a, b) => (a.statusCode ?? 999) - (b.statusCode ?? 999)
      ),
    }
  }

  const filtered = report.results
    .filter((r) => (filter === "broken" ? !r.healthy : r.healthy))
    .sort((a, b) => (a.statusCode ?? 999) - (b.statusCode ?? 999))

  return {
    ...report,
    results: filtered,
  }
}
