import type {
  LearningJourney,
  JourneyStep,
  UserJourneyProgress,
  StepCompletion,
  JourneyStatus,
  JourneyDifficulty,
} from "@/generated/prisma/client"

/**
 * Re-export Prisma enums for use across the feature module.
 */
export type { JourneyStatus, JourneyDifficulty }

/**
 * Journey with steps and computed counts for list/detail views.
 */
export interface JourneyWithSteps extends LearningJourney {
  steps: JourneyStep[]
  _count: {
    steps: number
    enrollments: number
  }
}

/**
 * User's progress on a journey with completion stats.
 */
export interface JourneyProgress {
  id: number
  userId: string
  journeyId: number
  startedAt: Date
  completedAt: Date | null
  updatedAt: Date
  completedSteps: number
  totalSteps: number
  percentage: number
  completions: StepCompletion[]
}

/**
 * Journey step with completion status for a specific user.
 */
export interface StepWithCompletion extends JourneyStep {
  completion: StepCompletion | null
}

/**
 * Journey with progress info for user's enrolled journeys list.
 */
export interface UserJourneyWithProgress {
  journey: JourneyWithSteps
  progress: UserJourneyProgress
  completedSteps: number
  totalSteps: number
  percentage: number
}

/**
 * Filters for listing published journeys.
 */
export interface JourneyFilters {
  difficulty?: JourneyDifficulty
  category?: string
  featured?: boolean
  page?: number
  limit?: number
}
