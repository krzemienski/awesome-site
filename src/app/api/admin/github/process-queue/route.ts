import type { NextRequest } from "next/server"
import { z } from "zod"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiSuccess, handleApiError } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

const queueSchema = z.object({
  listId: z.number().int().positive(),
  action: z.enum(["import", "export"]),
})

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = queueSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 422 }
      )
    }

    const entry = await prisma.githubSyncQueue.create({
      data: {
        listId: parsed.data.listId,
        action: parsed.data.action,
        status: "pending",
        payload: {} as unknown as Prisma.InputJsonValue,
      },
    })

    return apiSuccess(entry, 201)
  } catch (error) {
    return handleApiError(error)
  }
})
