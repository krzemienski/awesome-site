import { prisma } from "@/lib/prisma"
import { apiSuccess, handleApiError } from "@/lib/api-response"

export async function GET() {
  try {
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`
    const dbConnected = Array.isArray(result) && result.length > 0

    return apiSuccess({
      status: "healthy",
      database: dbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
