import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"
import { ALLOWED_DOMAINS } from "@/lib/constants"
import { getSetting } from "@/features/admin/settings-service"
import {
  generateContentHash,
  getCachedResponse,
  cacheResponse,
} from "@/features/ai/ai-cache-service"
import type { AiAnalysisResult } from "@/features/ai/ai-types"

const AI_MODEL = "claude-haiku-4-5-20251001"

/**
 * Scrape basic metadata from a URL via native fetch.
 * Returns title, description, and og:image URL.
 */
async function scrapeMetadata(
  url: string
): Promise<{ title: string; description: string; ogImage: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AwesomeListBot/1.0" },
    signal: AbortSignal.timeout(10000),
  })
  const html = await res.text()

  const title =
    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? ""
  const description =
    html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
    )?.[1]?.trim() ?? ""
  const ogImage =
    html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i
    )?.[1]?.trim() ?? ""

  return { title, description, ogImage }
}

/**
 * Validate a URL against the domain allowlist.
 * Checks both the hardcoded ALLOWED_DOMAINS and any dynamic allowlist from site settings.
 */
async function validateDomain(url: string): Promise<boolean> {
  const hostname = new URL(url).hostname.replace(/^www\./, "")

  const hardcodedAllowed = ALLOWED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  )

  if (hardcodedAllowed) {
    return true
  }

  const dynamicAllowlist = await getSetting<string[]>("domain.allowlist")
  if (dynamicAllowlist && Array.isArray(dynamicAllowlist)) {
    return dynamicAllowlist.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    )
  }

  return false
}

/**
 * Build the Claude prompt for URL analysis.
 */
function buildAnalysisPrompt(
  url: string,
  metadata: { title: string; description: string }
): string {
  return `Analyze this web resource and provide structured suggestions for cataloging it in a curated resource library.

URL: ${url}
Page Title: ${metadata.title}
Page Description: ${metadata.description}

Respond with ONLY valid JSON (no markdown fences, no explanation) in this exact format:
{
  "suggestedTitle": "A clear, concise title for this resource",
  "suggestedDescription": "A 1-2 sentence description of what this resource offers",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedCategory": "The most fitting category name",
  "difficulty": "beginner|intermediate|advanced|expert",
  "confidence": 0.85,
  "keyTopics": ["topic1", "topic2", "topic3"]
}

Guidelines:
- suggestedTags: 3-8 lowercase, hyphenated tags (e.g., "machine-learning", "web-dev")
- suggestedCategory: A broad category like "JavaScript", "DevOps", "Machine Learning", "Web Development", "Databases", etc.
- difficulty: Rate the content's target audience skill level
- confidence: 0.0-1.0 how confident you are in your analysis
- keyTopics: 3-5 main topics covered by the resource`
}

/**
 * Parse Claude's JSON response, handling potential formatting issues.
 */
function parseClaudeResponse(text: string): Omit<AiAnalysisResult, "ogImage" | "cached"> {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("Claude response did not contain valid JSON")
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    suggestedTitle?: string
    suggestedDescription?: string
    suggestedTags?: string[]
    suggestedCategory?: string
    difficulty?: string
    confidence?: number
    keyTopics?: string[]
  }

  const validDifficulties = ["beginner", "intermediate", "advanced", "expert"] as const
  const difficulty = validDifficulties.includes(
    parsed.difficulty as (typeof validDifficulties)[number]
  )
    ? (parsed.difficulty as AiAnalysisResult["difficulty"])
    : "intermediate"

  return {
    suggestedTitle: parsed.suggestedTitle ?? "",
    suggestedDescription: parsed.suggestedDescription ?? "",
    suggestedTags: Array.isArray(parsed.suggestedTags)
      ? parsed.suggestedTags.map(String)
      : [],
    suggestedCategory: parsed.suggestedCategory ?? "",
    difficulty,
    confidence: typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5,
    keyTopics: Array.isArray(parsed.keyTopics)
      ? parsed.keyTopics.map(String)
      : [],
  }
}

/**
 * Track daily AI usage for cost monitoring.
 */
async function trackUsage(
  model: string,
  tokensUsed: number
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const inputCostPer1k = 0.001
  const outputCostPer1k = 0.005
  const estimatedCost = (tokensUsed / 1000) * ((inputCostPer1k + outputCostPer1k) / 2)

  await prisma.aiUsageDaily.upsert({
    where: {
      date_model: { date: today, model },
    },
    update: {
      requestCount: { increment: 1 },
      totalTokens: { increment: tokensUsed },
      estimatedCostUsd: { increment: estimatedCost },
    },
    create: {
      date: today,
      model,
      requestCount: 1,
      totalTokens: tokensUsed,
      estimatedCostUsd: estimatedCost,
    },
  })
}

/**
 * Analyze a URL using Claude AI.
 * Validates domain, scrapes metadata, checks cache, calls Claude if needed,
 * caches the response, and tracks usage.
 */
export async function analyzeUrl(url: string): Promise<AiAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      "AI analysis is not configured. Set ANTHROPIC_API_KEY environment variable."
    )
  }

  const isAllowed = await validateDomain(url)
  if (!isAllowed) {
    throw new Error(
      `Domain not in allowlist. URL must be from a recognized developer resource domain.`
    )
  }

  const contentHash = generateContentHash(url)

  const cached = await getCachedResponse(contentHash)
  if (cached) {
    const cachedResult = cached.response as Omit<AiAnalysisResult, "cached">
    return { ...cachedResult, cached: true }
  }

  let metadata: { title: string; description: string; ogImage: string }
  try {
    metadata = await scrapeMetadata(url)
  } catch {
    metadata = { title: "", description: "", ogImage: "" }
  }

  const prompt = buildAnalysisPrompt(url, metadata)

  const anthropic = new Anthropic({ apiKey })
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const textBlock = response.content.find((block) => block.type === "text")
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text response")
  }

  const analysis = parseClaudeResponse(textBlock.text)

  const tokensUsed =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)

  const cacheData = {
    ...analysis,
    ogImage: metadata.ogImage || undefined,
  }
  await cacheResponse(contentHash, prompt, cacheData, AI_MODEL, tokensUsed)

  await trackUsage(AI_MODEL, tokensUsed)

  return {
    ...analysis,
    ogImage: metadata.ogImage || undefined,
    cached: false,
  }
}
