"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Square,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  Loader2,
  Zap,
  BarChart3,
} from "lucide-react"

import { EnrichmentStartDialog } from "@/components/admin/dialogs/enrichment-start-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useEnrichmentJobs, useEnrichmentJob } from "@/hooks/use-enrichment"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// ── Types ──────────────────────────────────────────────────────────────────

interface ErrorLogEntry {
  readonly resourceId: number
  readonly error: string
  readonly timestamp: string
}

interface EnrichmentJob {
  readonly id: number
  readonly status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  readonly filter: string
  readonly totalItems: number
  readonly processedItems: number
  readonly failedItems: number
  readonly skippedItems: number
  readonly startedAt: string | null
  readonly completedAt: string | null
  readonly errorLog: readonly ErrorLogEntry[]
  readonly createdAt: string
  readonly updatedAt: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-500/15 text-green-700 dark:text-green-400"
    case "failed":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    case "cancelled":
      return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
    case "processing":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
    case "pending":
      return "bg-gray-500/15 text-gray-700 dark:text-gray-400"
    default:
      return ""
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 text-green-600" />
    case "failed":
      return <XCircle className="size-4 text-red-600" />
    case "cancelled":
      return <AlertTriangle className="size-4 text-yellow-600" />
    case "processing":
      return <Loader2 className="size-4 animate-spin text-blue-600" />
    case "pending":
      return <Clock className="size-4 text-gray-500" />
    default:
      return null
  }
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "—"
  const start = new Date(startedAt).getTime()
  const end = completedAt ? new Date(completedAt).getTime() : Date.now()
  const seconds = Math.round((end - start) / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes === 0) return `${remainingSeconds}s`
  return `${minutes}m ${remainingSeconds}s`
}

function isActiveJob(status: string): boolean {
  return status === "processing" || status === "pending"
}

// ── Active Job Card ────────────────────────────────────────────────────────

function ActiveJobCard({
  job,
  onCancel,
  isCancelling,
}: {
  readonly job: EnrichmentJob
  readonly onCancel: () => void
  readonly isCancelling: boolean
}) {
  const total = job.totalItems || 1
  const processed = job.processedItems + job.failedItems + job.skippedItems
  const percentage = Math.round((processed / total) * 100)

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusIcon(job.status)}
            <CardTitle className="text-lg">
              Active Enrichment Job #{job.id}
            </CardTitle>
            <Badge className={statusColor(job.status)}>{job.status}</Badge>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            ) : (
              <Square className="mr-1 size-3.5" />
            )}
            Cancel
          </Button>
        </div>
        <CardDescription>
          Filter: {job.filter} &middot; Started{" "}
          {job.startedAt
            ? new Date(job.startedAt).toLocaleString()
            : "pending"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {processed} / {job.totalItems} items
            </span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-md border p-3 text-center">
            <div className="text-lg font-bold text-green-600">
              {job.processedItems}
            </div>
            <div className="text-muted-foreground text-xs">Processed</div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-lg font-bold text-red-600">
              {job.failedItems}
            </div>
            <div className="text-muted-foreground text-xs">Failed</div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-lg font-bold text-yellow-600">
              {job.skippedItems}
            </div>
            <div className="text-muted-foreground text-xs">Skipped</div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-lg font-bold">{job.totalItems}</div>
            <div className="text-muted-foreground text-xs">Total</div>
          </div>
        </div>

        {/* Duration */}
        <div className="text-muted-foreground text-sm">
          Duration: {formatDuration(job.startedAt, job.completedAt)}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Error Log Section ──────────────────────────────────────────────────────

function JobErrorLog({ errorLog }: { readonly errorLog: readonly ErrorLogEntry[] }) {
  if (errorLog.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-center text-sm">
        No errors recorded.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">Resource ID</TableHead>
          <TableHead>Error</TableHead>
          <TableHead className="w-44">Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {errorLog.map((entry, idx) => (
          <TableRow key={`${entry.resourceId}-${idx}`}>
            <TableCell className="font-mono text-sm">
              #{entry.resourceId}
            </TableCell>
            <TableCell className="text-sm text-red-600 dark:text-red-400">
              {entry.error}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(entry.timestamp).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ── Job History Row (with expandable error log) ────────────────────────────

function JobHistoryRow({ job }: { readonly job: EnrichmentJob }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const errorCount = Array.isArray(job.errorLog) ? job.errorLog.length : 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
      <React.Fragment>
        <TableRow>
          <TableCell className="font-mono text-sm">#{job.id}</TableCell>
          <TableCell>
            <Badge className={statusColor(job.status)}>
              <span className="mr-1 inline-flex">{statusIcon(job.status)}</span>
              {job.status}
            </Badge>
          </TableCell>
          <TableCell className="text-sm">{job.filter}</TableCell>
          <TableCell className="text-sm">{job.totalItems}</TableCell>
          <TableCell className="text-sm text-green-600">
            {job.processedItems}
          </TableCell>
          <TableCell className="text-sm text-red-600">
            {job.failedItems}
          </TableCell>
          <TableCell className="text-muted-foreground text-sm">
            {job.startedAt
              ? new Date(job.startedAt).toLocaleString()
              : "—"}
          </TableCell>
          <TableCell className="text-sm">
            {formatDuration(job.startedAt, job.completedAt)}
          </TableCell>
          <TableCell>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <AlertTriangle className="size-3.5" />
                {errorCount}
                <ChevronDown
                  className={`size-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
          </TableCell>
        </TableRow>
        {isOpen && (
          <TableRow>
            <TableCell colSpan={9} className="bg-muted/30 p-4">
              <JobErrorLog errorLog={Array.isArray(job.errorLog) ? job.errorLog : []} />
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    </Collapsible>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function EnrichmentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function EnrichmentTab() {
  const queryClient = useQueryClient()
  const [startDialogOpen, setStartDialogOpen] = React.useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false)
  const [cancelJobId, setCancelJobId] = React.useState<number | null>(null)

  // Fetch all jobs
  const { data: jobs, isLoading, isError } = useEnrichmentJobs()

  // Find active job (most recent processing or pending)
  const activeJob: EnrichmentJob | null = React.useMemo(() => {
    if (!Array.isArray(jobs)) return null
    return (jobs as EnrichmentJob[]).find((j) => isActiveJob(j.status)) ?? null
  }, [jobs])

  // Poll active job with 5s interval
  const activeJobId = activeJob?.id ?? null
  const { data: activeJobDetail } = useEnrichmentJob(activeJobId)

  // Start enrichment mutation
  const startMutation = useMutation({
    mutationFn: async (filter: "all" | "unenriched") => {
      const res = await fetch("/api/admin/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to start enrichment")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "enrichment", "jobs"] })
      setStartDialogOpen(false)
    },
  })

  // Cancel enrichment mutation
  const cancelMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await fetch(`/api/admin/enrichment/jobs/${jobId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to cancel job")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "enrichment", "jobs"] })
      setCancelDialogOpen(false)
      setCancelJobId(null)
    },
  })

  function handleStartEnrichment(filter: "all" | "unenriched") {
    startMutation.mutate(filter)
  }

  function handleCancelClick(jobId: number) {
    setCancelJobId(jobId)
    setCancelDialogOpen(true)
  }

  function handleCancelConfirm() {
    if (cancelJobId !== null) {
      cancelMutation.mutate(cancelJobId)
    }
  }

  if (isLoading) {
    return <EnrichmentSkeleton />
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">AI Enrichment</h1>
        <p className="text-destructive">
          Failed to load enrichment jobs. Please try again.
        </p>
      </div>
    )
  }

  const jobList = (Array.isArray(jobs) ? jobs : []) as readonly EnrichmentJob[]
  const completedJobs = jobList.filter((j) => !isActiveJob(j.status))
  const displayActiveJob = (activeJobDetail as EnrichmentJob | undefined) ?? activeJob

  // Calculate summary stats
  const totalProcessed = jobList.reduce((sum, j) => sum + j.processedItems, 0)
  const totalFailed = jobList.reduce((sum, j) => sum + j.failedItems, 0)
  const completedCount = jobList.filter((j) => j.status === "completed").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">AI Enrichment</h1>
          <p className="text-muted-foreground text-sm">
            Manage AI-powered resource analysis and metadata enrichment.
          </p>
        </div>
        <Button
          onClick={() => setStartDialogOpen(true)}
          disabled={activeJob !== null}
        >
          <Zap className="mr-2 size-4" />
          Start Enrichment
        </Button>
      </div>

      {/* Active Job Card */}
      {displayActiveJob && isActiveJob(displayActiveJob.status) && (
        <ActiveJobCard
          job={displayActiveJob}
          onCancel={() => handleCancelClick(displayActiveJob.id)}
          isCancelling={cancelMutation.isPending}
        />
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              <span className="text-2xl font-bold">{totalProcessed}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Failed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="size-5 text-red-600" />
              <span className="text-2xl font-bold">{totalFailed}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Jobs Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-5 text-blue-600" />
              <span className="text-2xl font-bold">{completedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job History</CardTitle>
          <CardDescription>
            Past enrichment jobs with status and error details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedJobs.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No enrichment jobs yet. Start one to begin.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filter</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="w-24">Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedJobs.map((job) => (
                    <JobHistoryRow key={job.id} job={job} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Dialog */}
      <EnrichmentStartDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        onStart={handleStartEnrichment}
        isLoading={startMutation.isPending}
      />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Enrichment Job"
        description="Are you sure you want to cancel this enrichment job? Items already processed will be kept."
        confirmLabel="Cancel Job"
        variant="destructive"
        isLoading={cancelMutation.isPending}
        onConfirm={handleCancelConfirm}
      />
    </div>
  )
}
