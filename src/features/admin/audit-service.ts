import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export async function createAuditLog(params: {
  resourceId: number
  action: string
  performedById: string
  previousState?: Record<string, unknown>
  newState?: Record<string, unknown>
}) {
  return prisma.resourceAuditLog.create({
    data: {
      resourceId: params.resourceId,
      action: params.action,
      performedById: params.performedById,
      previousState: params.previousState
        ? (params.previousState as Prisma.InputJsonValue)
        : undefined,
      newState: params.newState
        ? (params.newState as Prisma.InputJsonValue)
        : undefined,
    },
  })
}

/**
 * Log a non-resource admin action. Uses the first resource in DB as anchor
 * since ResourceAuditLog requires a resourceId FK. The action string encodes
 * the entity type (e.g. "category_create", "user_ban", "settings_update").
 * Silently skips if no resources exist yet.
 */
export async function logAdminAction(params: {
  action: string
  performedById: string
  previousState?: Record<string, unknown>
  newState?: Record<string, unknown>
}) {
  try {
    const anchor = await prisma.resource.findFirst({
      select: { id: true },
      orderBy: { id: "asc" },
    })
    if (!anchor) return
    await prisma.resourceAuditLog.create({
      data: {
        resourceId: anchor.id,
        action: params.action,
        performedById: params.performedById,
        previousState: params.previousState
          ? (params.previousState as Prisma.InputJsonValue)
          : undefined,
        newState: params.newState
          ? (params.newState as Prisma.InputJsonValue)
          : undefined,
      },
    })
  } catch {
    // Non-critical: audit logging should never block the primary operation
  }
}

export interface AuditLogFilters {
  readonly action?: string
  readonly resourceId?: number
  readonly performedById?: string
  readonly page?: number
  readonly limit?: number
}

export async function listAuditLogs(filters: AuditLogFilters = {}) {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(Math.max(1, filters.limit ?? 20), 100)
  const skip = (page - 1) * limit

  const where: Prisma.ResourceAuditLogWhereInput = {}

  if (filters.action) {
    where.action = { contains: filters.action, mode: "insensitive" }
  }

  if (filters.resourceId) {
    where.resourceId = filters.resourceId
  }

  if (filters.performedById) {
    where.performedById = filters.performedById
  }

  const [items, total] = await Promise.all([
    prisma.resourceAuditLog.findMany({
      where,
      include: {
        resource: { select: { id: true, title: true, url: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.resourceAuditLog.count({ where }),
  ])

  return {
    items,
    total,
    page,
    limit,
    hasMore: skip + items.length < total,
  }
}
