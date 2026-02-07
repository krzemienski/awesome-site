"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookOpen,
  Clock,
  Trophy,
  ArrowLeft,
  Loader2,
} from "lucide-react"

import { Container } from "@/components/layout/container"
import { JourneySteps } from "@/components/journeys/journey-steps"
import { StepCompletionDialog } from "@/components/journeys/step-completion-dialog"
import { JsonLdScript, courseJsonLd } from "@/lib/json-ld"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
}

interface JourneyDetail {
  id: number
  title: string
  description: string
  difficulty: string
  category: string | null
  estimatedDuration: string | null
  featured: boolean
  status: string
  steps: Array<{
    id: number
    title: string
    description: string | null
    stepOrder: number
    isOptional: boolean
    resourceId: number | null
    resource?: { id: number; title: string; url: string } | null
  }>
  _count: { steps: number; enrollments: number }
}

interface JourneyProgress {
  completedSteps: number
  totalSteps: number
  percentage: number
  completions: Array<{
    stepId: number
    rating: number | null
    timeSpent: number | null
    notes: string | null
  }>
}

export default function JourneyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const journeyId = Number(params?.id)

  const [completingStepId, setCompletingStepId] = React.useState<number | null>(
    null
  )

  // Fetch journey detail
  const {
    data: journey,
    isLoading: isJourneyLoading,
    isError,
  } = useQuery<JourneyDetail>({
    queryKey: ["journey", journeyId],
    queryFn: async () => {
      const res = await fetch(`/api/journeys/${journeyId}`)
      if (!res.ok) throw new Error("Failed to load journey")
      const json = await res.json()
      return json.data
    },
    enabled: Number.isInteger(journeyId) && journeyId > 0,
  })

  // Fetch user progress (may 404 if not enrolled)
  const { data: progress } = useQuery<JourneyProgress | null>({
    queryKey: ["journey-progress", journeyId],
    queryFn: async () => {
      const res = await fetch(`/api/journeys/${journeyId}/progress`)
      if (res.status === 404 || res.status === 401) return null
      if (!res.ok) throw new Error("Failed to load progress")
      const json = await res.json()
      return json.data
    },
    enabled: Number.isInteger(journeyId) && journeyId > 0,
  })

  const isEnrolled = progress !== null && progress !== undefined

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/journeys/${journeyId}/start`, {
        method: "POST",
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to start journey")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["journey-progress", journeyId],
      })
    },
  })

  // Complete step mutation
  const completeMutation = useMutation({
    mutationFn: async (data: {
      stepId: number
      rating?: number
      timeSpent?: number
      notes?: string
    }) => {
      const res = await fetch(`/api/journeys/${journeyId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to complete step")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["journey-progress", journeyId],
      })
      queryClient.invalidateQueries({ queryKey: ["journey", journeyId] })
      setCompletingStepId(null)
    },
  })

  // Merge steps with completion status
  const steps = journey?.steps
  const completions = progress?.completions
  const stepsWithCompletion = React.useMemo(() => {
    if (!steps) return []
    const completedStepIds = new Set(
      (completions ?? []).map((c) => c.stepId)
    )
    return steps.map((step) => ({
      ...step,
      completion: completedStepIds.has(step.id)
        ? (completions?.find((c) => c.stepId === step.id) ?? null)
        : null,
    }))
  }, [steps, completions])

  if (isJourneyLoading) {
    return (
      <main className="py-8">
        <Container>
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="mb-2 h-6 w-96" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="mt-6 h-64 w-full rounded-xl" />
        </Container>
      </main>
    )
  }

  if (isError || !journey) {
    return (
      <main className="py-8">
        <Container>
          <p className="text-destructive">Journey not found.</p>
          <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" />
            Go Back
          </Button>
        </Container>
      </main>
    )
  }

  const difficultyStyle =
    DIFFICULTY_STYLES[journey.difficulty] ?? "bg-gray-100 text-gray-800"

  return (
    <main className="py-8">
      <Container className="max-w-4xl">
        <JsonLdScript
          data={courseJsonLd({
            title: journey.title,
            description: journey.description,
            difficulty: journey.difficulty,
            category: journey.category,
            estimatedDuration: journey.estimatedDuration,
            journeyId: journey.id,
            steps: journey.steps.map((s) => ({
              title: s.title,
              stepOrder: s.stepOrder,
              description: s.description,
            })),
          })}
        />
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push("/journeys")}
        >
          <ArrowLeft className="mr-1 size-4" />
          All Journeys
        </Button>

        {/* Header */}
        <div className="space-y-4">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {journey.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={difficultyStyle}>{journey.difficulty}</Badge>
            {journey.category && (
              <Badge variant="outline">{journey.category}</Badge>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {journey.description}
          </p>

          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <BookOpen className="size-4" />
              {journey._count.steps} step{journey._count.steps === 1 ? "" : "s"}
            </span>
            {journey.estimatedDuration && (
              <span className="flex items-center gap-1">
                <Clock className="size-4" />
                {journey.estimatedDuration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Trophy className="size-4" />
              {journey._count.enrollments} enrolled
            </span>
          </div>
        </div>

        {/* Progress / Enroll */}
        <div className="mt-6">
          {isEnrolled && progress ? (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Progress</span>
                <span className="text-sm font-bold">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} />
              <p className="text-muted-foreground text-xs">
                {progress.completedSteps} of {progress.totalSteps} steps
                completed
              </p>
            </div>
          ) : (
            <Button
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Start Journey
            </Button>
          )}
        </div>

        <Separator className="my-6" />

        {/* Steps */}
        <div>
          <h2 className="font-heading mb-4 text-xl font-semibold">Steps</h2>
          <JourneySteps
            steps={stepsWithCompletion}
            isEnrolled={isEnrolled}
            onCompleteStep={(stepId) => setCompletingStepId(stepId)}
          />
        </div>

        {/* Step Completion Dialog */}
        <StepCompletionDialog
          open={completingStepId !== null}
          onOpenChange={(open) => {
            if (!open) setCompletingStepId(null)
          }}
          stepId={completingStepId}
          journeyId={journeyId}
          onSubmit={(data) => completeMutation.mutate(data)}
          isLoading={completeMutation.isPending}
        />
      </Container>
    </main>
  )
}
