import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const listId = searchParams.get("listId")

    if (!listId) {
      return apiSuccess({ status: "idle", queueEntry: null })
    }

    const queueEntry = await prisma.githubSyncQueue.findFirst({
      where: { listId: parseInt(listId, 10) },
      orderBy: { createdAt: "desc" },
    })

    if (!queueEntry) {
      return apiSuccess({ status: "idle", queueEntry: null })
    }

    const status =
      queueEntry.status === "processing"
        ? queueEntry.action === "import"
          ? "importing"
          : "exporting"
        : queueEntry.status === "failed"
          ? "error"
          : "idle"

    return apiSuccess({ status, queueEntry })
  } catch (error) {
    return handleApiError(error)
  }
})
