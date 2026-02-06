"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Users,
  Clock,
  GitPullRequest,
  Sparkles,
  Play,
  Eye,
  Download,
  Activity,
} from "lucide-react"
import { StatCard } from "@/components/admin/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  readonly totalResources: number
  readonly pendingResources: number
  readonly totalUsers: number
  readonly activeUsers: number
  readonly pendingEdits: number
  readonly enrichedResources: number
}

interface AuditLogEntry {
  readonly id: number
  readonly resourceId: number
  readonly action: string
  readonly performedById: string
  readonly createdAt: string
  readonly resource: { readonly title: string }
}

interface StatsResponse {
  readonly stats: DashboardStats
  readonly activity: readonly AuditLogEntry[]
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return new Date(dateStr).toLocaleDateString()
}

function actionToBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.includes("approve")) return "default"
  if (action.includes("reject") || action.includes("delete")) return "destructive"
  if (action.includes("create")) return "secondary"
  return "outline"
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export function OverviewTab() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { data, isLoading, isError } = useQuery<StatsResponse>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats")
      if (!res.ok) {
        throw new Error("Failed to fetch admin stats")
      }
      const json = await res.json()
      return json.data as StatsResponse
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return <OverviewSkeleton />
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Overview</h1>
        <p className="text-destructive">
          Failed to load dashboard stats. Please try again.
        </p>
      </div>
    )
  }

  const { stats, activity } = data

  function navigateToTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.push(`/admin?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Resources"
          value={stats.totalResources}
          icon={<LayoutDashboard className="size-4" />}
        />
        <StatCard
          label="Pending Resources"
          value={stats.pendingResources}
          icon={<FileText className="size-4" />}
        />
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Active Users (30d)"
          value={stats.activeUsers}
          icon={<Clock className="size-4" />}
        />
        <StatCard
          label="Pending Edits"
          value={stats.pendingEdits}
          icon={<GitPullRequest className="size-4" />}
        />
        <StatCard
          label="Enriched Resources"
          value={stats.enrichedResources}
          icon={<Sparkles className="size-4" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" disabled>
          <Play className="mr-2 size-4" />
          Start Enrichment
        </Button>
        <Button
          variant="outline"
          onClick={() => navigateToTab("resources")}
        >
          <Eye className="mr-2 size-4" />
          View Pending
        </Button>
        <Button variant="outline" disabled>
          <Download className="mr-2 size-4" />
          Export
        </Button>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="size-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No recent activity to display.
            </p>
          ) : (
            <ul className="space-y-3">
              {activity.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={actionToBadgeVariant(entry.action)}>
                        {entry.action}
                      </Badge>
                      <span className="text-sm font-medium">
                        {entry.resource.title}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      by {entry.performedById}
                    </span>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatTimeAgo(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
