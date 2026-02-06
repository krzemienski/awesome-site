import { prisma } from "@/lib/prisma"

export interface Recommendation {
  resourceId: number
  title: string
  url: string
  description: string
  category: string
  score: number
  confidence: number
  explanation: string
}

interface CategoryCount {
  categoryId: number
  count: number
}

interface TagCount {
  tagId: number
  count: number
}

/**
 * Get personalized resource recommendations for a user.
 * Weighted scoring: category preference (30%), tag overlap (25%),
 * co-viewed (20%), learning goal similarity (15%), recency (10%).
 * Fallback: popular resources for users with minimal history.
 */
export async function getRecommendations(
  userId: string,
  limit = 10
): Promise<readonly Recommendation[]> {
  const safeLimit = Math.min(Math.max(1, limit), 50)

  const [favorites, bookmarks, recentViews, completedSteps] =
    await Promise.all([
      prisma.userFavorite.findMany({
        where: { userId },
        select: { resourceId: true, resource: { select: { categoryId: true } } },
      }),
      prisma.userBookmark.findMany({
        where: { userId },
        select: { resourceId: true },
      }),
      prisma.viewHistory.findMany({
        where: {
          userId,
          viewedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { resourceId: true, resource: { select: { categoryId: true } } },
      }),
      prisma.stepCompletion.findMany({
        where: { userId },
        select: { step: { select: { resourceId: true } } },
      }),
    ])

  const interactionCount =
    favorites.length + bookmarks.length + recentViews.length

  if (interactionCount < 3) {
    return getPopularFallback(userId, safeLimit)
  }

  const exclusionSet = buildExclusionSet(
    favorites.map((f) => f.resourceId),
    bookmarks.map((b) => b.resourceId),
    recentViews.map((v) => v.resourceId),
    completedSteps
      .map((s) => s.step.resourceId)
      .filter((id): id is number => id !== null)
  )

  const candidates = await prisma.resource.findMany({
    where: {
      status: "approved",
      id: { notIn: [...exclusionSet] },
    },
    take: 100,
    include: {
      category: { select: { name: true } },
      tags: { select: { tag: { select: { id: true, name: true } } } },
    },
  })

  if (candidates.length === 0) {
    return []
  }

  const categoryPrefs = buildCategoryPreferences(favorites, recentViews)
  const userTagIds = await getUserTagIds(userId, [...exclusionSet])
  const coViewedScores = await buildCoViewedScores(
    favorites.map((f) => f.resourceId),
    exclusionSet,
    candidates.map((c) => c.id)
  )
  const journeyCategories = await getJourneyCategories(userId)

  const now = Date.now()
  const maxCategoryCount = Math.max(
    ...categoryPrefs.map((c) => c.count),
    1
  )
  const maxTagOverlap = Math.max(userTagIds.size, 1)
  const maxCoViewed = Math.max(...candidates.map((c) => coViewedScores.get(c.id) ?? 0), 1)

  const scored = candidates.map((candidate) => {
    const candidateTagIds = new Set(candidate.tags.map((t) => t.tag.id))

    const categoryScore = computeCategoryScore(
      candidate.categoryId,
      categoryPrefs,
      maxCategoryCount
    )

    const tagOverlap = computeTagOverlap(candidateTagIds, userTagIds)
    const tagScore = tagOverlap / maxTagOverlap

    const coViewedRaw = coViewedScores.get(candidate.id) ?? 0
    const coViewedScore = coViewedRaw / maxCoViewed

    const goalScore = journeyCategories.has(candidate.category.name.toLowerCase())
      ? 1
      : 0

    const daysSinceCreation =
      (now - candidate.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const recencyScore = Math.max(0, 1 - daysSinceCreation / 365)

    const weightedScore =
      categoryScore * 0.3 +
      tagScore * 0.25 +
      coViewedScore * 0.2 +
      goalScore * 0.15 +
      recencyScore * 0.1

    const confidence = computeConfidence(
      categoryScore,
      tagScore,
      coViewedScore,
      goalScore
    )

    const explanation = generateExplanation(
      categoryScore,
      tagScore,
      coViewedScore,
      goalScore,
      recencyScore,
      candidate.category.name
    )

    return {
      resourceId: candidate.id,
      title: candidate.title,
      url: candidate.url,
      description: candidate.description,
      category: candidate.category.name,
      score: Math.round(weightedScore * 1000) / 1000,
      confidence: Math.round(confidence * 1000) / 1000,
      explanation,
    }
  })

  const sorted = [...scored].sort((a, b) => b.score - a.score)
  return sorted.slice(0, safeLimit)
}

function buildExclusionSet(
  favIds: readonly number[],
  bookmarkIds: readonly number[],
  viewIds: readonly number[],
  stepResourceIds: readonly number[]
): Set<number> {
  const set = new Set<number>()
  for (const id of favIds) set.add(id)
  for (const id of bookmarkIds) set.add(id)
  for (const id of viewIds) set.add(id)
  for (const id of stepResourceIds) set.add(id)
  return set
}

function buildCategoryPreferences(
  favorites: readonly { resourceId: number; resource: { categoryId: number } }[],
  views: readonly { resourceId: number; resource: { categoryId: number } }[]
): readonly CategoryCount[] {
  const counts = new Map<number, number>()
  for (const f of favorites) {
    counts.set(f.resource.categoryId, (counts.get(f.resource.categoryId) ?? 0) + 2)
  }
  for (const v of views) {
    counts.set(v.resource.categoryId, (counts.get(v.resource.categoryId) ?? 0) + 1)
  }
  return [...counts.entries()].map(([categoryId, count]) => ({
    categoryId,
    count,
  }))
}

async function getUserTagIds(
  userId: string,
  interactedResourceIds: readonly number[]
): Promise<Set<number>> {
  if (interactedResourceIds.length === 0) return new Set()

  const tags = await prisma.resourceTag.findMany({
    where: { resourceId: { in: [...interactedResourceIds] } },
    select: { tagId: true },
  })
  return new Set(tags.map((t) => t.tagId))
}

async function buildCoViewedScores(
  favoritedIds: readonly number[],
  exclusionSet: Set<number>,
  candidateIds: readonly number[]
): Promise<Map<number, number>> {
  const scores = new Map<number, number>()
  if (favoritedIds.length === 0 || candidateIds.length === 0) return scores

  const usersWhoViewedFavorites = await prisma.viewHistory.findMany({
    where: { resourceId: { in: [...favoritedIds] } },
    select: { userId: true },
    distinct: ["userId"],
    take: 50,
  })

  const otherUserIds = usersWhoViewedFavorites.map((u) => u.userId)
  if (otherUserIds.length === 0) return scores

  const otherViews = await prisma.viewHistory.findMany({
    where: {
      userId: { in: otherUserIds },
      resourceId: {
        in: candidateIds.filter((id) => !exclusionSet.has(id)),
      },
    },
    select: { resourceId: true },
  })

  for (const view of otherViews) {
    scores.set(view.resourceId, (scores.get(view.resourceId) ?? 0) + 1)
  }

  return scores
}

async function getJourneyCategories(userId: string): Promise<Set<string>> {
  const enrollments = await prisma.userJourneyProgress.findMany({
    where: { userId, completedAt: null },
    select: { journey: { select: { category: true } } },
  })
  return new Set(enrollments.map((e) => e.journey.category.toLowerCase()))
}

function computeCategoryScore(
  categoryId: number,
  prefs: readonly CategoryCount[],
  maxCount: number
): number {
  const match = prefs.find((p) => p.categoryId === categoryId)
  if (!match) return 0
  return match.count / maxCount
}

function computeTagOverlap(
  candidateTags: Set<number>,
  userTags: Set<number>
): number {
  let overlap = 0
  for (const tagId of candidateTags) {
    if (userTags.has(tagId)) overlap++
  }
  return overlap
}

function computeConfidence(
  categoryScore: number,
  tagScore: number,
  coViewedScore: number,
  goalScore: number
): number {
  const signalCount = [categoryScore, tagScore, coViewedScore, goalScore].filter(
    (s) => s > 0
  ).length
  const avgSignal =
    (categoryScore + tagScore + coViewedScore + goalScore) / 4
  return Math.min(1, (signalCount / 4) * 0.6 + avgSignal * 0.4)
}

function generateExplanation(
  categoryScore: number,
  tagScore: number,
  coViewedScore: number,
  goalScore: number,
  recencyScore: number,
  categoryName: string
): string {
  const factors: { score: number; label: string }[] = [
    { score: categoryScore * 0.3, label: `Matches your interest in ${categoryName}` },
    { score: tagScore * 0.25, label: "Shares tags with resources you like" },
    { score: coViewedScore * 0.2, label: "Popular among users with similar tastes" },
    { score: goalScore * 0.15, label: "Aligns with your learning goals" },
    { score: recencyScore * 0.1, label: "Recently added resource" },
  ]

  const sorted = [...factors].sort((a, b) => b.score - a.score)
  const top = sorted.find((f) => f.score > 0)
  return top?.label ?? "Recommended based on popularity"
}

async function getPopularFallback(
  userId: string,
  limit: number
): Promise<readonly Recommendation[]> {
  const excludedIds = await prisma.userFavorite.findMany({
    where: { userId },
    select: { resourceId: true },
  })
  const excludeSet = new Set(excludedIds.map((e) => e.resourceId))

  const popular = await prisma.resource.findMany({
    where: {
      status: "approved",
      ...(excludeSet.size > 0 ? { id: { notIn: [...excludeSet] } } : {}),
    },
    include: {
      category: { select: { name: true } },
      _count: { select: { favorites: true, viewHistory: true } },
    },
    orderBy: [
      { favorites: { _count: "desc" } },
      { viewHistory: { _count: "desc" } },
    ],
    take: limit,
  })

  return popular.map((r) => ({
    resourceId: r.id,
    title: r.title,
    url: r.url,
    description: r.description,
    category: r.category.name,
    score: 0.5,
    confidence: 0.3,
    explanation: `Popular in ${r.category.name}`,
  }))
}
