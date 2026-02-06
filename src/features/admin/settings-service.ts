import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export async function getSetting<T = unknown>(
  key: string
): Promise<T | null> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } })
  return setting ? (setting.value as T) : null
}

export async function setSetting(
  key: string,
  value: Prisma.InputJsonValue,
  description?: string
): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    update: {
      value,
      ...(description !== undefined ? { description } : {}),
    },
    create: { key, value, description },
  })
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const settings = await prisma.siteSetting.findMany()
  const result: Record<string, unknown> = {}
  for (const s of settings) {
    result[s.key] = s.value
  }
  return result
}
