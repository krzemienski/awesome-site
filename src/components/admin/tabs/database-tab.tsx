"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Database, Loader2, CheckCircle2, Sprout } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

interface DashboardStats {
  totalResources: number
  pendingResources: number
  totalUsers: number
  activeUsers: number
  pendingEdits: number
  enrichedResources: number
}

interface StatsResponse {
  success: boolean
  data: {
    stats: DashboardStats
  }
}

interface ModelStat {
  name: string
  count: number
}

function buildModelStats(stats: DashboardStats): ModelStat[] {
  return [
    { name: "Resources", count: stats.totalResources },
    { name: "Resources (Pending)", count: stats.pendingResources },
    { name: "Resources (Enriched)", count: stats.enrichedResources },
    { name: "Users", count: stats.totalUsers },
    { name: "Users (Active)", count: stats.activeUsers },
    { name: "Pending Edits", count: stats.pendingEdits },
  ]
}

export function DatabaseTab() {
  const queryClient = useQueryClient()
  const [seedDialogOpen, setSeedDialogOpen] = React.useState(false)

  const { data, isLoading, isError } = useQuery<StatsResponse>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
    staleTime: 30_000,
  })

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/database/seed", {
        method: "POST",
      })
      if (!res.ok) throw new Error("Seed operation failed")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Database seeded successfully")
      setSeedDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function handleSeedConfirm() {
    seedMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Database</h1>
          <p className="text-sm text-muted-foreground">
            Database statistics and management.
          </p>
        </div>
        <p className="text-sm text-destructive">
          Failed to load database stats. Please try again.
        </p>
      </div>
    )
  }

  const stats = data?.data?.stats
  const modelStats = stats ? buildModelStats(stats) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Database</h1>
        <p className="text-sm text-muted-foreground">
          Database statistics, connection status, and seed operations.
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Connection Status
          </CardTitle>
          <CardDescription>Current database connection info.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-500" />
            <Badge variant="outline" className="text-green-600">
              Connected
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Table Statistics
          </CardTitle>
          <CardDescription>
            Row counts for database models.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modelStats.map((model) => (
              <div
                key={model.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <span className="text-sm font-medium">{model.name}</span>
                <Badge variant="secondary">{model.count.toLocaleString()}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seed Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="size-5" />
            Seed Database
          </CardTitle>
          <CardDescription>
            Run the database seed script to populate initial data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="destructive"
            onClick={() => setSeedDialogOpen(true)}
            disabled={seedMutation.isPending}
          >
            {seedMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sprout className="mr-2 size-4" />
            )}
            {seedMutation.isPending ? "Seeding..." : "Seed Database"}
          </Button>

        </CardContent>
      </Card>

      <ConfirmDialog
        open={seedDialogOpen}
        onOpenChange={setSeedDialogOpen}
        title="Seed Database"
        description="This will seed the database with initial data. Are you sure you want to proceed?"
        confirmLabel="Seed"
        variant="destructive"
        isLoading={seedMutation.isPending}
        onConfirm={handleSeedConfirm}
      />
    </div>
  )
}
