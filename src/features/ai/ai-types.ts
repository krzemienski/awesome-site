import type {
  EnrichmentJob as PrismaEnrichmentJob,
  EnrichmentQueueItem as PrismaEnrichmentQueueItem,
  EnrichmentJobStatus,
} from "@/generated/prisma/client"

export interface AiAnalysisResult {
  suggestedTitle: string
  suggestedDescription: string
  suggestedTags: string[]
  suggestedCategory: string
  difficulty: "beginner" | "intermediate" | "advanced" | "expert"
  confidence: number
  keyTopics: string[]
  ogImage?: string
  cached: boolean
}

export interface AiCacheEntry {
  id: number
  contentHash: string
  prompt: string
  response: AiAnalysisResult
  model: string
  tokensUsed: number
  hitCount: number
  createdAt: Date
  expiresAt: Date | null
}

export type EnrichmentJob = PrismaEnrichmentJob & {
  queueItems?: EnrichmentQueueItem[]
}

export type EnrichmentQueueItem = PrismaEnrichmentQueueItem

export { EnrichmentJobStatus }
