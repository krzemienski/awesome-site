"use client"

import Link from "next/link"
import { BookOpen, Clock, Trophy, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface JourneyCardProps {
  readonly journey: {
    readonly id: number
    readonly title: string
    readonly description: string
    readonly difficulty: string
    readonly category: string | null
    readonly estimatedDuration: string | null
    readonly featured: boolean
    readonly _count: {
      readonly steps: number
      readonly enrollments: number
    }
  }
  readonly progress?: {
    readonly percentage: number
    readonly completedSteps: number
    readonly totalSteps: number
  } | null
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
}

export function JourneyCard({ journey, progress }: JourneyCardProps) {
  const difficultyStyle =
    DIFFICULTY_STYLES[journey.difficulty] ?? "bg-gray-100 text-gray-800"

  return (
    <Link href={`/journeys/${journey.id}`} className="group block">
      <Card
        className={`h-full transition-shadow group-hover:shadow-md ${
          journey.featured ? "border-primary/40 ring-primary/20 ring-1" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-lg leading-tight">
              {journey.title}
            </CardTitle>
            {journey.featured && (
              <Badge variant="default" className="shrink-0">
                <Star className="mr-1 size-3" />
                Featured
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {journey.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={difficultyStyle}>{journey.difficulty}</Badge>
            {journey.category && (
              <Badge variant="outline">{journey.category}</Badge>
            )}
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <BookOpen className="size-3.5" />
              {journey._count.steps} step{journey._count.steps === 1 ? "" : "s"}
            </span>
            {journey.estimatedDuration && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {journey.estimatedDuration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Trophy className="size-3.5" />
              {journey._count.enrollments} enrolled
            </span>
          </div>

          {progress && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {progress.completedSteps}/{progress.totalSteps} steps
                </span>
                <span className="font-medium">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
