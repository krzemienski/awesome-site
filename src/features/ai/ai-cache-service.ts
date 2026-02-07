import { createHash } from "crypto"
import { prisma } from "@/lib/prisma"

/**
 * Generate a SHA-256 content hash from a URL string.
 */
export function generateContentHash(url: string): string {
  return createHash("sha256").update(url).digest("hex")
}

/**
 * Look up a cached AI response by content hash.
 * If found, increments the hit counter and returns the cached response.
 */
export async function getCachedResponse(
  contentHash: string
): Promise<{ response: unknown; model: string; tokensUsed: number } | null> {
  const cached = await prisma.aiResponseCache.findUnique({
    where: { contentHash },
  })

  if (!cached) {
    return null
  }

  if (cached.expiresAt && new Date() > cached.expiresAt) {
    return null
  }

  await prisma.aiResponseCache.update({
    where: { id: cached.id },
    data: { hitCount: cached.hitCount + 1 },
  })

  return {
    response: cached.response,
    model: cached.model,
    tokensUsed: cached.tokensUsed,
  }
}

/**
 * Store an AI response in the cache keyed by content hash.
 */
export async function cacheResponse(
  contentHash: string,
  prompt: string,
  response: unknown,
  model: string,
  tokensUsed: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.aiResponseCache.upsert({
    where: { contentHash },
    update: {
      prompt,
      response: response as Parameters<
        typeof prisma.aiResponseCache.create
      >[0]["data"]["response"],
      model,
      tokensUsed,
      expiresAt,
    },
    create: {
      contentHash,
      prompt,
      response: response as Parameters<
        typeof prisma.aiResponseCache.create
      >[0]["data"]["response"],
      model,
      tokensUsed,
      expiresAt,
    },
  })
}
