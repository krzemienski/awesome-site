import { prisma } from "@/lib/prisma"
import type { UpdatePreferencesInput } from "@/features/user/user-schemas"

/**
 * Get user preferences. Creates default preferences if none exist.
 */
export async function getPreferences(userId: string) {
  const prefs = await prisma.userPreference.findUnique({
    where: { userId },
  })

  if (!prefs) {
    return prisma.userPreference.create({ data: { userId } })
  }

  return prefs
}

/**
 * Update user preferences. Uses upsert to create if not exists.
 */
export async function updatePreferences(
  userId: string,
  input: UpdatePreferencesInput
) {
  return prisma.userPreference.upsert({
    where: { userId },
    update: { ...input },
    create: { userId, ...input },
  })
}
