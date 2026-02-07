import type { NextRequest } from "next/server"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { listPublished } from "@/features/journeys/journey-service"
import type { JourneyDifficulty } from "@/generated/prisma/client"

/**
 * GET /api/journeys
 * Public list of published journeys with optional filters.
 * Query params: difficulty, category, featured, page, limit
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const difficulty = url.searchParams.get("difficulty") as JourneyDifficulty | null
    const category = url.searchParams.get("category")
    const featured = url.searchParams.get("featured")
    const page = Number(url.searchParams.get("page")) || undefined
    const limit = Number(url.searchParams.get("limit")) || undefined

    const result = await listPublished({
      difficulty: difficulty ?? undefined,
      category: category ?? undefined,
      featured: featured !== null ? featured === "true" : undefined,
      page,
      limit,
    })

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
}
