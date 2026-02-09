import { NextRequest } from "next/server"

import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret")

  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  try {
    const result = await prisma.viewHistory.deleteMany({
      where: {
        viewedAt: {
          lt: ninetyDaysAgo,
        },
      },
    })

    logger.info(
      { deletedCount: result.count },
      "Cleaned up old ViewHistory entries"
    )

    return Response.json({
      success: true,
      data: { deletedCount: result.count },
    })
  } catch (error) {
    logger.error({ err: error }, "Failed to clean up ViewHistory entries")
    return Response.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
