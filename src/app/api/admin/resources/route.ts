import type { NextRequest } from "next/server"
import { withAdmin } from "@/features/auth/auth-middleware"
import { apiPaginated, apiSuccess, handleApiError } from "@/lib/api-response"
import type { AuthenticatedRouteContext } from "@/features/auth/auth-types"
import { prisma } from "@/lib/prisma"
import { PAGINATION } from "@/lib/constants"
import { createAuditLog } from "@/features/admin/audit-service"
import { createResourceSchema } from "@/features/resources/resource-schemas"

export const GET = withAdmin(
  async (req: NextRequest, _ctx: AuthenticatedRouteContext) => {
    try {
      const url = new URL(req.url)
      const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"))
      const limit = Math.min(
        Number(url.searchParams.get("limit") ?? String(PAGINATION.defaultLimit)),
        PAGINATION.maxLimit
      )
      const skip = (page - 1) * limit

      const status = url.searchParams.get("status") ?? undefined
      const categoryId = url.searchParams.get("categoryId")
        ? Number(url.searchParams.get("categoryId"))
        : undefined
      const search = url.searchParams.get("search") ?? undefined
      const enriched = url.searchParams.get("enriched")

      const where: Record<string, unknown> = {}

      if (status) {
        where.status = status
      }

      if (categoryId) {
        where.categoryId = categoryId
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { url: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ]
      }

      if (enriched === "true") {
        where.NOT = { metadata: { equals: {} } }
      } else if (enriched === "false") {
        where.metadata = { equals: {} }
      }

      const [items, total] = await Promise.all([
        prisma.resource.findMany({
          where,
          include: {
            category: true,
            subcategory: true,
            subSubcategory: true,
            tags: { include: { tag: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.resource.count({ where }),
      ])

      return apiPaginated(items, {
        total,
        page,
        limit,
        hasMore: skip + items.length < total,
      })
    } catch (error) {
      return handleApiError(error)
    }
  }
)

export const POST = withAdmin(
  async (req: NextRequest, ctx: AuthenticatedRouteContext) => {
    try {
      const body = await req.json()
      const parsed = createResourceSchema.safeParse(body)

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

      const { tags, ...data } = parsed.data

      const resource = await prisma.resource.create({
        data: {
          ...data,
          subcategoryId: data.subcategoryId ?? null,
          subSubcategoryId: data.subSubcategoryId ?? null,
          status: "approved",
          approvedById: ctx.user.id,
          approvedAt: new Date(),
          tags: tags
            ? {
                create: await resolveTagConnections(tags),
              }
            : undefined,
        },
        include: {
          category: true,
          subcategory: true,
          subSubcategory: true,
          tags: { include: { tag: true } },
        },
      })

      await createAuditLog({
        resourceId: resource.id,
        action: "create",
        performedById: ctx.user.id,
        newState: {
          title: resource.title,
          url: resource.url,
          status: resource.status,
        },
      })

      return apiSuccess(resource, 201)
    } catch (error) {
      return handleApiError(error)
    }
  }
)

async function resolveTagConnections(
  tagNames: string[]
): Promise<Array<{ tag: { connect: { id: number } } }>> {
  const connections: Array<{ tag: { connect: { id: number } } }> = []

  for (const name of tagNames) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    })

    connections.push({ tag: { connect: { id: tag.id } } })
  }

  return connections
}
