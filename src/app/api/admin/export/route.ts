import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import {
  exportMarkdown,
  exportJson,
  exportCsv,
} from "@/features/admin/export-service"

/**
 * POST /api/admin/export -- Generate markdown export
 * Body: { title?: string, description?: string }
 */
export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      title?: string
      description?: string
    }

    const result = await exportMarkdown(body.title, body.description)

    return apiSuccess({
      markdown: result.markdown,
      resourceCount: result.resourceCount,
      categoryCount: result.categoryCount,
    })
  } catch (error) {
    return handleApiError(error)
  }
})

/**
 * GET /api/admin/export -- JSON full backup or CSV export
 * Query params: format ("json" | "csv", default "json"), categoryId?, status?
 */
export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") ?? "json"
    const categoryIdStr = searchParams.get("categoryId")
    const status = searchParams.get("status")

    if (format === "csv") {
      const filters: { categoryId?: number; status?: string } = {}

      if (categoryIdStr) {
        const parsed = parseInt(categoryIdStr, 10)
        if (!isNaN(parsed)) {
          filters.categoryId = parsed
        }
      }

      if (status) {
        filters.status = status
      }

      const csv = await exportCsv(filters)

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="resources.csv"',
        },
      })
    }

    const data = await exportJson()
    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
})
