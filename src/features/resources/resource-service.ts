import { prisma } from "@/lib/prisma"
import { AppError, Errors } from "@/lib/api-error"
import { PAGINATION } from "@/lib/constants"
import type {
  ResourceFilters,
  ResourceWithRelations,
  PaginatedResponse,
  CreateResourceInput,
  UpdateResourceInput,
} from "./resource-types"
import {
  buildResourceWhere,
  buildResourceOrderBy,
  buildResourceInclude,
} from "./resource-queries"

/**
 * List resources with filters, pagination, and sorting.
 */
export async function listResources(
  filters: ResourceFilters
): Promise<PaginatedResponse<ResourceWithRelations>> {
  const page = filters.page ?? PAGINATION.defaultPage
  const limit = Math.min(
    filters.limit ?? PAGINATION.defaultLimit,
    PAGINATION.maxLimit
  )
  const skip = (page - 1) * limit

  const where = await buildResourceWhere(filters)
  const orderBy = buildResourceOrderBy(filters)
  const include = buildResourceInclude()

  const [items, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy,
      include,
      skip,
      take: limit,
    }),
    prisma.resource.count({ where }),
  ])

  return {
    items: items as unknown as ResourceWithRelations[],
    meta: {
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    },
  }
}

/**
 * Get a single resource by ID with all relations.
 * Throws NOT_FOUND if resource does not exist.
 */
export async function getResource(id: number): Promise<ResourceWithRelations> {
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: buildResourceInclude(),
  })

  if (!resource) {
    throw Errors.NOT_FOUND("Resource")
  }

  return resource as unknown as ResourceWithRelations
}

/**
 * Create a new resource with pending status.
 * Handles tag creation/linking via slug lookup.
 */
export async function createResource(
  input: CreateResourceInput,
  submittedById?: string
): Promise<ResourceWithRelations> {
  const existingUrl = await prisma.resource.findUnique({
    where: { url: input.url },
    select: { id: true },
  })

  if (existingUrl) {
    throw Errors.DUPLICATE("url")
  }

  const resource = await prisma.resource.create({
    data: {
      title: input.title,
      url: input.url,
      description: input.description,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId ?? null,
      subSubcategoryId: input.subSubcategoryId ?? null,
      submittedById: submittedById ?? null,
      status: "pending",
      tags: input.tags
        ? {
            create: await resolveTagConnections(input.tags),
          }
        : undefined,
    },
    include: buildResourceInclude(),
  })

  return resource as unknown as ResourceWithRelations
}

/**
 * Update an existing resource by ID.
 * Replaces tags if provided.
 */
export async function updateResource(
  id: number,
  input: UpdateResourceInput
): Promise<ResourceWithRelations> {
  const existing = await prisma.resource.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    throw Errors.NOT_FOUND("Resource")
  }

  if (input.url) {
    const duplicate = await prisma.resource.findFirst({
      where: { url: input.url, NOT: { id } },
      select: { id: true },
    })
    if (duplicate) {
      throw Errors.DUPLICATE("url")
    }
  }

  const { tags, ...data } = input

  const resource = await prisma.$transaction(async (tx) => {
    if (tags !== undefined) {
      await tx.resourceTag.deleteMany({ where: { resourceId: id } })

      if (tags.length > 0) {
        const tagConnections = await resolveTagConnections(tags)
        await tx.resourceTag.createMany({
          data: tagConnections.map((conn) => ({
            resourceId: id,
            tagId: conn.tag.connect!.id,
          })),
        })
      }
    }

    return tx.resource.update({
      where: { id },
      data: {
        ...data,
        metadata: data.metadata
          ? JSON.parse(JSON.stringify(data.metadata))
          : undefined,
      },
      include: buildResourceInclude(),
    })
  })

  return resource as unknown as ResourceWithRelations
}

/**
 * Delete a resource by ID (hard delete).
 * Throws NOT_FOUND if resource does not exist.
 */
export async function deleteResource(id: number): Promise<void> {
  const existing = await prisma.resource.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    throw Errors.NOT_FOUND("Resource")
  }

  await prisma.resource.delete({ where: { id } })
}

/**
 * Check if a URL already exists in the database.
 * Returns the existing resource ID if found, null otherwise.
 */
export async function checkUrlExists(
  url: string
): Promise<{ exists: boolean; resourceId: number | null }> {
  const existing = await prisma.resource.findUnique({
    where: { url },
    select: { id: true },
  })

  return {
    exists: existing !== null,
    resourceId: existing?.id ?? null,
  }
}

/**
 * Approve a pending resource. Sets status to approved and records approver.
 */
export async function approveResource(
  id: number,
  approvedById: string
): Promise<ResourceWithRelations> {
  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { id: true, status: true },
  })

  if (!resource) {
    throw Errors.NOT_FOUND("Resource")
  }

  if (resource.status !== "pending") {
    throw new AppError(
      `Cannot approve resource with status "${resource.status}"`,
      422,
      "INVALID_STATUS"
    )
  }

  const updated = await prisma.resource.update({
    where: { id },
    data: {
      status: "approved",
      approvedById,
      approvedAt: new Date(),
    },
    include: buildResourceInclude(),
  })

  return updated as unknown as ResourceWithRelations
}

/**
 * Reject a pending resource. Sets status to rejected.
 */
export async function rejectResource(
  id: number,
  approvedById: string
): Promise<ResourceWithRelations> {
  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { id: true, status: true },
  })

  if (!resource) {
    throw Errors.NOT_FOUND("Resource")
  }

  if (resource.status !== "pending") {
    throw new AppError(
      `Cannot reject resource with status "${resource.status}"`,
      422,
      "INVALID_STATUS"
    )
  }

  const updated = await prisma.resource.update({
    where: { id },
    data: {
      status: "rejected",
      approvedById,
    },
    include: buildResourceInclude(),
  })

  return updated as unknown as ResourceWithRelations
}

/**
 * Resolve tag names to tag connections for Prisma create.
 * Creates tags that don't exist yet (by slug).
 */
async function resolveTagConnections(
  tagNames: string[]
): Promise<Array<{ tag: { connect: { id: number } } }>> {
  const connections: Array<{ tag: { connect: { id: number } } }> = []

  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    })

    connections.push({ tag: { connect: { id: tag.id } } })
  }

  return connections
}
