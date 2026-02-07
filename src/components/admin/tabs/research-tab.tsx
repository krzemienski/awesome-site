"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  FileSearch,
  BarChart3,
  Microscope,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { StatCard } from "@/components/admin/stat-card"

// ── Types ──────────────────────────────────────────────────────────────────

type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled"

type ResearchJobType =
  | "validation"
  | "enrichment"
  | "discovery"
  | "trend_analysis"
  | "comprehensive"

interface ResearchJob {
  readonly id: number
  readonly type: ResearchJobType
  readonly status: JobStatus
  readonly config: Record<string, unknown>
  readonly report: Record<string, unknown> | null
  readonly startedAt: string | null
  readonly completedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly _count: { readonly findings: number }
}

interface ApiResponse<T> {
  readonly success: boolean
  readonly data: T
}

// ── Helpers ────────────────────────────────────────────────────────────────

const JOB_TYPE_LABELS: Record<ResearchJobType, string> = {
  validation: "Validation",
  enrichment: "Enrichment",
  discovery: "Discovery",
  trend_analysis: "Trend Analysis",
  comprehensive: "Comprehensive",
}

function statusColor(status: JobStatus): string {
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
  }
}

function statusIcon(status: JobStatus) {
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
  }
}

// ── Job List Item ──────────────────────────────────────────────────────────

function JobListItem({
  job,
  isSelected,
  onSelect,
}: {
  readonly job: ResearchJob
  readonly isSelected: boolean
  readonly onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full border-b px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {statusIcon(job.status)}
          <span className="text-sm font-medium truncate">
            {JOB_TYPE_LABELS[job.type]}
          </span>
        </div>
        <Badge className={statusColor(job.status)}>{job.status}</Badge>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
        </span>
        <span>{job._count.findings} findings</span>
      </div>
    </button>
  )
}

// ── Job Detail Panel ───────────────────────────────────────────────────────

function JobDetailPanel({ job }: { readonly job: ResearchJob }) {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {JOB_TYPE_LABELS[job.type]} #{job.id}
          </h2>
          <p className="text-sm text-muted-foreground">
            Created{" "}
            {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
          </p>
        </div>
        <Badge className={statusColor(job.status)}>{job.status}</Badge>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {statusIcon(job.status)}
              <span className="font-medium capitalize">{job.status}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Findings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileSearch className="size-4 text-blue-600" />
              <span className="text-2xl font-bold">{job._count.findings}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{new Date(job.createdAt).toLocaleString()}</span>
          </div>
          {job.startedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started</span>
              <span>{new Date(job.startedAt).toLocaleString()}</span>
            </div>
          )}
          {job.completedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span>{new Date(job.completedAt).toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Config */}
      {Object.keys(job.config).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
              {JSON.stringify(job.config, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyDetail() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
      <Microscope className="size-12 opacity-40" />
      <p className="text-sm">Select a job to view details</p>
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function ResearchSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ResearchTab() {
  const queryClient = useQueryClient()
  const [selectedJobId, setSelectedJobId] = React.useState<number | null>(null)
  const [jobType, setJobType] = React.useState<ResearchJobType>("comprehensive")

  // Fetch jobs
  const {
    data: jobsResponse,
    isLoading,
    isError,
  } = useQuery<ApiResponse<readonly ResearchJob[]>>({
    queryKey: ["admin", "research", "jobs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/research/jobs")
      if (!res.ok) throw new Error("Failed to fetch research jobs")
      return res.json() as Promise<ApiResponse<readonly ResearchJob[]>>
    },
  })

  const jobs = jobsResponse?.data ?? []
  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null

  // Start research mutation
  const startMutation = useMutation({
    mutationFn: async (type: ResearchJobType) => {
      const res = await fetch("/api/admin/research/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error ?? "Failed to start research job")
      }
      return res.json() as Promise<ApiResponse<{ jobId: number }>>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "research", "jobs"] })
    },
  })

  if (isLoading) {
    return <ResearchSkeleton />
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Research</h1>
        <p className="text-destructive">
          Failed to load research jobs. Please try again.
        </p>
      </div>
    )
  }

  // Calculate summary stats
  const completedCount = jobs.filter((j) => j.status === "completed").length
  const totalFindings = jobs.reduce((sum, j) => sum + j._count.findings, 0)
  const hasActiveJob = jobs.some(
    (j) => j.status === "processing" || j.status === "pending"
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Research</h1>
          <p className="text-muted-foreground text-sm">
            Manage AI-powered research jobs and view findings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={jobType}
            onValueChange={(v) => setJobType(v as ResearchJobType)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="validation">Validation</SelectItem>
              <SelectItem value="enrichment">Enrichment</SelectItem>
              <SelectItem value="discovery">Discovery</SelectItem>
              <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
              <SelectItem value="comprehensive">Comprehensive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => startMutation.mutate(jobType)}
            disabled={startMutation.isPending || hasActiveJob}
          >
            {startMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Search className="mr-2 size-4" />
            )}
            Start Research
          </Button>
        </div>
      </div>

      {/* Cost Dashboard */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Jobs Completed"
          value={completedCount}
          icon={<BarChart3 className="size-4" />}
        />
        <StatCard
          label="Total Findings"
          value={totalFindings}
          icon={<FileSearch className="size-4" />}
        />
        <StatCard
          label="Estimated Cost"
          value="$0.00"
          icon={<DollarSign className="size-4" />}
        />
      </div>

      {/* Split Panel: Job List + Detail */}
      <Card className="overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="min-h-[500px]">
          {/* Left: Job List */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="flex h-full flex-col">
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Jobs</h3>
                <p className="text-xs text-muted-foreground">
                  {jobs.length} total
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {jobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground">
                    <Microscope className="size-8 opacity-40" />
                    <p className="text-sm">No research jobs yet</p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <JobListItem
                      key={job.id}
                      job={job}
                      isSelected={selectedJobId === job.id}
                      onSelect={() => setSelectedJobId(job.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Job Detail */}
          <ResizablePanel defaultSize={65} minSize={40}>
            <div className="h-full overflow-y-auto">
              {selectedJob ? (
                <JobDetailPanel job={selectedJob} />
              ) : (
                <EmptyDetail />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Card>
    </div>
  )
}
