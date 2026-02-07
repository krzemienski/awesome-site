import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export const POST = withAdmin(async () => {
  try {
    // POC: Simple seed check - verify database connectivity and return status
    // In production, this would import and run the full seed script
    const resourceCount = await prisma.resource.count()
    const categoryCount = await prisma.category.count()
    const userCount = await prisma.user.count()

    return apiSuccess({
      message: "Seed complete",
      counts: {
        resources: resourceCount,
        categories: categoryCount,
        users: userCount,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
})
