"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { ThumbsUp, ThumbsDown, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Recommendation {
  readonly id: number
  readonly title: string
  readonly url: string
  readonly category: { readonly name: string }
}

interface RecommendationsPanelProps {
  readonly resourceId: number
}

export function RecommendationsPanel({ resourceId }: RecommendationsPanelProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recommendations", resourceId],
    queryFn: async () => {
      const res = await fetch(`/api/ai/recommendations?limit=6`)
      if (res.status === 401) return null
      if (!res.ok) throw new Error("Failed to fetch recommendations")
      const json = await res.json()
      return json.data as Recommendation[]
    },
    retry: false,
  })

  const feedbackMutation = useMutation({
    mutationFn: async ({
      recId,
      feedback,
    }: {
      readonly recId: number
      readonly feedback: "up" | "down"
    }) => {
      const res = await fetch("/api/recommendations/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: recId, feedback }),
      })
      if (!res.ok) throw new Error("Failed to submit feedback")
      return res.json()
    },
  })

  if (data === null) return null

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-md border p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) return null

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recommendations yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((rec) => (
            <div
              key={rec.id}
              className="flex flex-col gap-2 rounded-md border p-3 transition-colors hover:bg-accent/50"
            >
              <a
                href={`/resources/${rec.id}`}
                className="text-sm font-medium leading-tight hover:underline"
              >
                {rec.title}
              </a>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {rec.category.name}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() =>
                      feedbackMutation.mutate({ recId: rec.id, feedback: "up" })
                    }
                    disabled={feedbackMutation.isPending}
                    aria-label="Thumbs up"
                  >
                    <ThumbsUp className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() =>
                      feedbackMutation.mutate({
                        recId: rec.id,
                        feedback: "down",
                      })
                    }
                    disabled={feedbackMutation.isPending}
                    aria-label="Thumbs down"
                  >
                    <ThumbsDown className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
