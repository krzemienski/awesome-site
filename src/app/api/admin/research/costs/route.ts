import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { getCostBreakdown } from "@/features/ai/research-service"

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const daysParam = searchParams.get("days")
    const days = daysParam ? Number(daysParam) : 30

    const validDays = Number.isNaN(days) || days < 1 || days > 365 ? 30 : days
    const breakdown = await getCostBreakdown(validDays)
    return apiSuccess(breakdown)
  } catch (error) {
    return handleApiError(error)
  }
})
