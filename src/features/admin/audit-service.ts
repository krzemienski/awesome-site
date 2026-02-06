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
