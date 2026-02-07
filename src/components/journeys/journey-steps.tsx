"use client"

import { CheckCircle2, Circle, ExternalLink } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

interface StepData {
  readonly id: number
  readonly title: string
  readonly description: string | null
  readonly stepOrder: number
  readonly isOptional: boolean
  readonly resourceId: number | null
  readonly resource?: {
    readonly id: number
    readonly title: string
    readonly url: string
  } | null
  readonly completion?: {
    readonly id?: number
    readonly stepId?: number
    readonly rating: number | null
    readonly timeSpent: number | null
    readonly notes: string | null
  } | null
}

interface JourneyStepsProps {
  readonly steps: readonly StepData[]
  readonly isEnrolled: boolean
  readonly onCompleteStep?: (stepId: number) => void
}

export function JourneySteps({
  steps,
  isEnrolled,
  onCompleteStep,
}: JourneyStepsProps) {
  if (steps.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        No steps added yet.
      </p>
    )
  }

  return (
    <ol className="space-y-3">
      {steps.map((step) => {
        const isCompleted = !!step.completion
        return (
          <li
            key={step.id}
            className="flex items-start gap-3 rounded-lg border p-4"
          >
            <div className="mt-0.5 shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="size-5 text-green-600" />
              ) : (
                <Circle className="text-muted-foreground size-5" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm font-medium">
                  {step.stepOrder}.
                </span>
                <span
                  className={`font-medium ${isCompleted ? "line-through opacity-60" : ""}`}
                >
                  {step.title}
                </span>
                {step.isOptional && (
                  <span className="text-muted-foreground text-xs">(optional)</span>
                )}
              </div>

              {step.description && (
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              )}

              {step.resource && (
                <Link
                  href={`/resources/${step.resource.id}`}
                  className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                >
                  <ExternalLink className="size-3" />
                  {step.resource.title}
                </Link>
              )}

              {isCompleted && step.completion?.rating && (
                <p className="text-muted-foreground text-xs">
                  Rating: {step.completion.rating}/5
                  {step.completion.timeSpent
                    ? ` | Time: ${step.completion.timeSpent} min`
                    : ""}
                </p>
              )}
            </div>

            {isEnrolled && !isCompleted && onCompleteStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCompleteStep(step.id)}
                className="shrink-0"
              >
                Complete
              </Button>
            )}
          </li>
        )
      })}
    </ol>
  )
}
