"use client"

import { useEffect, useState, useCallback } from "react"
import { History, Clock, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface HistoryResource {
  id: number
  title: string
  url: string
  description: string | null
  category: { name: string; slug: string }
  subcategory: { name: string; slug: string } | null
  subSubcategory: { name: string; slug: string } | null
  tags: Array<{ tag: { id: number; name: string } }>
  _count: { favorites: number }
}

interface HistoryItem {
  id: number
  viewedAt: string
  resource: HistoryResource
}

interface HistoryResponse {
  items: HistoryItem[]
  total: number
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [isPending, setIsPending] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const limit = 50

  const fetchHistory = useCallback(async (currentOffset: number) => {
    setIsPending(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/history?limit=${limit}&offset=${currentOffset}`
      )
      if (!res.ok) {
        throw new Error("Failed to load history")
      }
      const json = await res.json()
      setData(json.data as HistoryResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history")
    } finally {
      setIsPending(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory(offset)
  }, [offset, fetchHistory])

  if (isPending) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">View History</h1>
        <LoadingSkeleton variant="list" count={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">View History</h1>
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0

  if (items.length === 0 && offset === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">View History</h1>
        <EmptyState
          icon={History}
          title="No view history yet"
          description="Resources you visit will appear here."
          actionLabel="Browse Resources"
          onAction={() => {
            window.location.href = "/resources"
          }}
        />
      </div>
    )
  }

  const hasMore = offset + limit < total

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">View History</h1>
        <span className="text-muted-foreground text-sm">
          {total} view{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-start gap-4 py-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/resources/${item.resource.id}`}
                    className="font-medium hover:underline"
                  >
                    {item.resource.title}
                  </Link>
                  <a
                    href={item.resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground shrink-0 hover:text-foreground"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>

                {item.resource.description && (
                  <p className="text-muted-foreground line-clamp-1 text-sm">
                    {item.resource.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.resource.category.name}
                  </Badge>
                  {item.resource.tags.slice(0, 3).map(({ tag }) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Clock className="size-3" />
                    {new Date(item.viewedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(offset > 0 || hasMore) && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
