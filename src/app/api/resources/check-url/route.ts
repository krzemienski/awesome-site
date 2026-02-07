import { NextRequest } from "next/server"
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response"
import { checkUrlExists } from "@/features/resources/resource-service"

/**
 * GET /api/resources/check-url?url=https://example.com
 * Public: check if a URL already exists in the database.
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const url = req.nextUrl.searchParams.get("url")

    if (!url) {
      return apiError("url query parameter is required", 422, "VALIDATION_ERROR")
    }

    try {
      new URL(url)
    } catch {
      return apiError("Invalid URL format", 422, "VALIDATION_ERROR")
    }

    const result = await checkUrlExists(url)

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
}
