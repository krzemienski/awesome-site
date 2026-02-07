import { randomBytes, createHash } from "crypto"
import { prisma } from "@/lib/prisma"
import { AppError, Errors } from "@/lib/api-error"
import type { ApiKeyTier } from "@/generated/prisma/client"

const KEY_PREFIX_MARKER = "ak_"

interface CreateKeyParams {
  readonly userId: string
  readonly name: string
  readonly tier?: ApiKeyTier
  readonly expiresAt?: string
  readonly scopes?: string[]
}

interface ListKeysParams {
  readonly userId?: string
  readonly page?: number
  readonly limit?: number
  readonly tier?: string
  readonly status?: string
}

interface KeyUsageStats {
  readonly totalRequests: number
  readonly last24h: number
  readonly last7d: number
  readonly avgResponseTime: number
  readonly topEndpoints: Array<{ endpoint: string; count: number }>
}

/**
 * Generate a new API key, hash it, store in DB.
 * Returns the raw key (shown once) and the created record.
 */
export async function createKey(params: CreateKeyParams) {
  const rawKey = `${KEY_PREFIX_MARKER}${randomBytes(32).toString("hex")}`
  const keyPrefix = rawKey.slice(0, 12)
  const keyHash = createHash("sha256").update(rawKey).digest("hex")

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: params.userId,
      keyHash,
      keyPrefix,
      name: params.name,
      tier: params.tier ?? "free",
      scopes: params.scopes ?? [],
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
    },
  })

  return {
    rawKey,
    apiKey: {
      id: apiKey.id,
      keyPrefix: apiKey.keyPrefix,
      name: apiKey.name,
      tier: apiKey.tier,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    },
  }
}

/**
 * Revoke an API key by setting revokedAt timestamp.
 */
export async function revokeKey(keyId: string, userId?: string) {
  const existing = await prisma.apiKey.findUnique({ where: { id: keyId } })

  if (!existing) {
    throw Errors.NOT_FOUND("API key")
  }

  if (userId && existing.userId !== userId) {
    throw new AppError("You can only revoke your own API keys", 403, "FORBIDDEN")
  }

  if (existing.revokedAt) {
    throw new AppError("API key is already revoked", 400, "ALREADY_REVOKED")
  }

  return prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  })
}

/**
 * Validate a raw API key string. Returns the key record if valid.
 */
export async function validateKey(rawKey: string) {
  const keyHash = createHash("sha256").update(rawKey).digest("hex")

  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } })

  if (!apiKey) {
    return null
  }

  if (apiKey.revokedAt) {
    return null
  }

  if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) {
    return null
  }

  return apiKey
}

/**
 * List API keys with optional filters. Never returns keyHash.
 */
export async function listKeys(params: ListKeysParams) {
  const { userId, page = 0, limit = 20, tier, status } = params

  const where: Record<string, unknown> = {}

  if (userId) {
    where.userId = userId
  }

  if (tier && ["free", "standard", "premium"].includes(tier)) {
    where.tier = tier
  }

  if (status === "active") {
    where.revokedAt = null
  } else if (status === "revoked") {
    where.revokedAt = { not: null }
  }

  const [keys, total] = await Promise.all([
    prisma.apiKey.findMany({
      where,
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        tier: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: page * limit,
      take: limit,
    }),
    prisma.apiKey.count({ where }),
  ])

  return { keys, total }
}

/**
 * Get usage statistics for a specific API key.
 */
export async function getKeyUsage(keyId: string): Promise<KeyUsageStats> {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [totalRequests, last24h, last7d, avgResult, topEndpoints] =
    await Promise.all([
      prisma.apiUsageLog.count({ where: { apiKeyId: keyId } }),
      prisma.apiUsageLog.count({
        where: { apiKeyId: keyId, createdAt: { gte: oneDayAgo } },
      }),
      prisma.apiUsageLog.count({
        where: { apiKeyId: keyId, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.apiUsageLog.aggregate({
        where: { apiKeyId: keyId },
        _avg: { responseTime: true },
      }),
      prisma.apiUsageLog.groupBy({
        by: ["endpoint"],
        where: { apiKeyId: keyId },
        _count: { endpoint: true },
        orderBy: { _count: { endpoint: "desc" } },
        take: 5,
      }),
    ])

  return {
    totalRequests,
    last24h,
    last7d,
    avgResponseTime: Math.round(avgResult._avg.responseTime ?? 0),
    topEndpoints: topEndpoints.map((e) => ({
      endpoint: e.endpoint,
      count: e._count.endpoint,
    })),
  }
}

/**
 * Update the tier of an API key (admin action).
 */
export async function updateKeyTier(keyId: string, tier: ApiKeyTier) {
  const existing = await prisma.apiKey.findUnique({ where: { id: keyId } })

  if (!existing) {
    throw Errors.NOT_FOUND("API key")
  }

  return prisma.apiKey.update({
    where: { id: keyId },
    data: { tier },
  })
}
