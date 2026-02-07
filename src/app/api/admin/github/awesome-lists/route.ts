import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export const GET = withAdmin(async () => {
  try {
    const lists = await prisma.awesomeList.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            syncHistory: true,
            syncQueue: true,
          },
        },
      },
    })

    return apiSuccess(lists)
  } catch (error) {
    return handleApiError(error)
  }
})
