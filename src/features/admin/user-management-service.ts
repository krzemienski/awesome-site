import { prisma } from "@/lib/prisma"

export async function listUsers(params: {
  page?: number
  limit?: number
  search?: string
  role?: string
}) {
  const { page = 0, limit = 20, search, role } = params

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
    ]
  }

  if (role && role !== "all") {
    where.role = role
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: page * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  return { users, total }
}

export async function changeRole(userId: string, role: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  })
}

export async function banUser(
  userId: string,
  reason?: string,
  expires?: Date
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      banned: true,
      banReason: reason ?? null,
      banExpires: expires ?? null,
    },
  })
}

export async function unbanUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      banned: false,
      banReason: null,
      banExpires: null,
    },
  })
}
