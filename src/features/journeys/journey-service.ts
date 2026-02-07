import { prisma } from "@/lib/prisma"
import { Errors } from "@/lib/api-error"
import { PAGINATION } from "@/lib/constants"
import type {
  JourneyWithSteps,
  JourneyProgress,
  StepWithCompletion,
  UserJourneyWithProgress,
  JourneyFilters,
} from "./journey-types"
import type {
  CreateJourneyInput,
  UpdateJourneyInput,
  AddStepInput,
  CompleteStepInput,
} from "./journey-schemas"
import type { JourneyDifficulty } from "@/generated/prisma/client"

/**
 * List published journeys with optional filters and pagination.
 */
export async function listPublished(filters: JourneyFilters = {}) {
  const page = filters.page ?? PAGINATION.defaultPage
  const limit = Math.min(
    filters.limit ?? PAGINATION.defaultLimit,
    PAGINATION.maxLimit
  )
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { status: "published" as const }

  if (filters.difficulty) {
    where.difficulty = filters.difficulty
  }
  if (filters.category) {
    where.category = filters.category
  }
  if (filters.featured !== undefined) {
    where.featured = filters.featured
  }

  const [items, total] = await Promise.all([
    prisma.learningJourney.findMany({
      where,
      include: {
        steps: { select: { id: true }, orderBy: { stepOrder: "asc" } },
        _count: { select: { steps: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.learningJourney.count({ where }),
  ])

  return {
    items: items as unknown as JourneyWithSteps[],
    meta: {
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    },
  }
}

/**
 * Get a single journey by ID with ordered steps and enrollment count.
 */
export async function getJourney(id: number): Promise<JourneyWithSteps> {
  const journey = await prisma.learningJourney.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
        include: { resource: { select: { id: true, title: true, url: true } } },
      },
      _count: { select: { steps: true, enrollments: true } },
    },
  })

  if (!journey) {
    throw Errors.NOT_FOUND("Journey")
  }

  return journey as unknown as JourneyWithSteps
}

/**
 * Create a new journey with draft status.
 */
export async function createJourney(
  data: CreateJourneyInput,
  createdById: string
): Promise<JourneyWithSteps> {
  const journey = await prisma.learningJourney.create({
    data: {
      title: data.title,
      description: data.description,
      difficulty: data.difficulty as JourneyDifficulty,
      category: data.category,
      estimatedDuration: data.estimatedDuration ?? null,
      status: "draft",
      createdById,
    },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      _count: { select: { steps: true, enrollments: true } },
    },
  })

  return journey as unknown as JourneyWithSteps
}

/**
 * Update an existing journey by ID.
 */
export async function updateJourney(
  id: number,
  data: UpdateJourneyInput
): Promise<JourneyWithSteps> {
  const existing = await prisma.learningJourney.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    throw Errors.NOT_FOUND("Journey")
  }

  const journey = await prisma.learningJourney.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.difficulty !== undefined && {
        difficulty: data.difficulty as JourneyDifficulty,
      }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.estimatedDuration !== undefined && {
        estimatedDuration: data.estimatedDuration,
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.featured !== undefined && { featured: data.featured }),
    },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      _count: { select: { steps: true, enrollments: true } },
    },
  })

  return journey as unknown as JourneyWithSteps
}

/**
 * Delete a journey by ID (cascades to steps).
 */
export async function deleteJourney(id: number): Promise<void> {
  const existing = await prisma.learningJourney.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    throw Errors.NOT_FOUND("Journey")
  }

  await prisma.learningJourney.delete({ where: { id } })
}

/**
 * Add a step to a journey. Auto-sets stepOrder to max+1.
 */
export async function addStep(journeyId: number, data: AddStepInput) {
  const journey = await prisma.learningJourney.findUnique({
    where: { id: journeyId },
    select: { id: true },
  })

  if (!journey) {
    throw Errors.NOT_FOUND("Journey")
  }

  const maxStep = await prisma.journeyStep.findFirst({
    where: { journeyId },
    orderBy: { stepOrder: "desc" },
    select: { stepOrder: true },
  })

  const nextOrder = (maxStep?.stepOrder ?? 0) + 1

  const step = await prisma.journeyStep.create({
    data: {
      journeyId,
      title: data.title,
      description: data.description ?? null,
      resourceId: data.resourceId ?? null,
      isOptional: data.isOptional,
      stepOrder: nextOrder,
    },
  })

  return step
}

/**
 * Remove a step by ID.
 */
export async function removeStep(stepId: number): Promise<void> {
  const existing = await prisma.journeyStep.findUnique({
    where: { id: stepId },
    select: { id: true },
  })

  if (!existing) {
    throw Errors.NOT_FOUND("Step")
  }

  await prisma.journeyStep.delete({ where: { id: stepId } })
}

/**
 * Reorder steps within a journey by providing ordered step IDs.
 */
export async function reorderSteps(
  journeyId: number,
  stepIds: number[]
): Promise<void> {
  const journey = await prisma.learningJourney.findUnique({
    where: { id: journeyId },
    select: { id: true },
  })

  if (!journey) {
    throw Errors.NOT_FOUND("Journey")
  }

  await prisma.$transaction(
    stepIds.map((stepId, index) =>
      prisma.journeyStep.update({
        where: { id: stepId },
        data: { stepOrder: index + 1 },
      })
    )
  )
}

/**
 * Enroll a user in a journey (upsert to handle re-enrollment).
 */
export async function enrollUser(userId: string, journeyId: number) {
  const journey = await prisma.learningJourney.findUnique({
    where: { id: journeyId },
    select: { id: true, status: true },
  })

  if (!journey) {
    throw Errors.NOT_FOUND("Journey")
  }

  const enrollment = await prisma.userJourneyProgress.upsert({
    where: { userId_journeyId: { userId, journeyId } },
    update: {},
    create: { userId, journeyId },
  })

  return enrollment
}

/**
 * Complete a step for a user. Checks if all required steps are done
 * and marks journey as completed if so.
 */
export async function completeStep(
  userId: string,
  stepId: number,
  data: Omit<CompleteStepInput, "stepId">
) {
  const step = await prisma.journeyStep.findUnique({
    where: { id: stepId },
    select: { id: true, journeyId: true },
  })

  if (!step) {
    throw Errors.NOT_FOUND("Step")
  }

  const enrollment = await prisma.userJourneyProgress.findUnique({
    where: { userId_journeyId: { userId, journeyId: step.journeyId } },
  })

  if (!enrollment) {
    throw Errors.NOT_FOUND("Enrollment")
  }

  const completion = await prisma.stepCompletion.upsert({
    where: { userId_stepId: { userId, stepId } },
    update: {
      rating: data.rating ?? null,
      timeSpent: data.timeSpent ?? null,
      notes: data.notes ?? null,
    },
    create: {
      userId,
      stepId,
      rating: data.rating ?? null,
      timeSpent: data.timeSpent ?? null,
      notes: data.notes ?? null,
    },
  })

  // Check if all required steps are completed
  const requiredSteps = await prisma.journeyStep.findMany({
    where: { journeyId: step.journeyId, isOptional: false },
    select: { id: true },
  })

  const completedStepIds = await prisma.stepCompletion.findMany({
    where: {
      userId,
      stepId: { in: requiredSteps.map((s) => s.id) },
    },
    select: { stepId: true },
  })

  const allRequiredDone =
    requiredSteps.length > 0 &&
    requiredSteps.every((rs) =>
      completedStepIds.some((cs) => cs.stepId === rs.id)
    )

  if (allRequiredDone) {
    await prisma.userJourneyProgress.update({
      where: { userId_journeyId: { userId, journeyId: step.journeyId } },
      data: { completedAt: new Date() },
    })
  }

  return completion
}

/**
 * Get a user's progress for a specific journey with step completion details.
 */
export async function getUserProgress(
  userId: string,
  journeyId: number
): Promise<JourneyProgress> {
  const enrollment = await prisma.userJourneyProgress.findUnique({
    where: { userId_journeyId: { userId, journeyId } },
  })

  if (!enrollment) {
    throw Errors.NOT_FOUND("Enrollment")
  }

  const [totalSteps, completions] = await Promise.all([
    prisma.journeyStep.count({ where: { journeyId } }),
    prisma.stepCompletion.findMany({
      where: {
        userId,
        step: { journeyId },
      },
    }),
  ])

  const completedSteps = completions.length
  const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  return {
    id: enrollment.id,
    userId: enrollment.userId,
    journeyId: enrollment.journeyId,
    startedAt: enrollment.startedAt,
    completedAt: enrollment.completedAt,
    updatedAt: enrollment.updatedAt,
    completedSteps,
    totalSteps,
    percentage,
    completions,
  }
}

/**
 * Get all journeys a user is enrolled in with progress info.
 */
export async function getUserJourneys(
  userId: string
): Promise<UserJourneyWithProgress[]> {
  const enrollments = await prisma.userJourneyProgress.findMany({
    where: { userId },
    include: {
      journey: {
        include: {
          steps: { orderBy: { stepOrder: "asc" } },
          _count: { select: { steps: true, enrollments: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  const results: UserJourneyWithProgress[] = []

  for (const enrollment of enrollments) {
    const completedSteps = await prisma.stepCompletion.count({
      where: {
        userId,
        step: { journeyId: enrollment.journeyId },
      },
    })

    const totalSteps = enrollment.journey.steps.length
    const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

    results.push({
      journey: enrollment.journey as unknown as JourneyWithSteps,
      progress: enrollment,
      completedSteps,
      totalSteps,
      percentage,
    })
  }

  return results
}

/**
 * Get steps for a journey with completion status for a specific user.
 */
export async function getStepsWithCompletion(
  journeyId: number,
  userId: string
): Promise<StepWithCompletion[]> {
  const steps = await prisma.journeyStep.findMany({
    where: { journeyId },
    orderBy: { stepOrder: "asc" },
    include: {
      completions: {
        where: { userId },
        take: 1,
      },
    },
  })

  return steps.map((step) => ({
    ...step,
    completion: step.completions[0] ?? null,
    completions: undefined,
  })) as unknown as StepWithCompletion[]
}
