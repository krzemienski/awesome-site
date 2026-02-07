import { prisma } from "@/lib/prisma"
import type { InteractionType, Prisma } from "@/generated/prisma/client"

/**
 * Track a user interaction event on a resource.
 * Supports: view, click, bookmark, rate, complete.
 */
export async function trackInteraction(
  userId: string,
  resourceId: number,
  type: InteractionType,
  metadata?: Record<string, unknown>
) {
  return prisma.userInteraction.create({
    data: {
      userId,
      resourceId,
      type,
      metadata: (metadata ?? {}) as Prisma.InputJsonValue,
    },
  })
}
