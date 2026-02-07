"use client"

import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { XCircle, Clock, Search, Settings2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type {
  ApiResponse,
  ResearchJob,
  ResearchFinding,
  JobReport,
} from "./types"
import { statusColor, statusIcon, JOB_TYPE_LABELS } from "./helpers"
import { FindingsList } from "./findings-list"
import { ReportViewer } from "./report-viewer"

// ── Types ────────────────────────────────────────────────────────────────

interface JobDetailPanelProps {
  readonly jobId: number | null
}

interface JobWithFindings extends ResearchJob {
  readonly findings: readonly ResearchFinding[]
}

interface ReportResponse {
  readonly id: number
  readonly type: string
  readonly status: string
  readonly report: Record<string, unknown> | null
}

// ── Fetch Helpers ────────────────────────────────────────────────────────

async function fetchJob(jobId: number): Promise<ApiResponse<JobWithFindings>> {
  try {
    const res = await fetch(`/api/admin/research/jobs/${jobId}`)
    if (!res.ok) throw new Error("Failed to fetch job details")
    return res.json()
  } catch (error) {
    throw new Error(
      `Job detail fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

async function fetchReport(jobId: number): Promise<ApiResponse<ReportResponse>> {
  try {
    const res = await fetch(`/api/admin/research/jobs/${jobId}/report`)
    if (!res.ok) throw new Error("Failed to fetch job report")
    return res.json()
  } catch (error) {
    throw new Error(
      `Job report fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

async function postApplyFinding(findingId: number): Promise<void> {
  try {
    const res = await fetch(`/api/admin/research/findings/${findingId}/apply`, {
      method: "POST",
    })
    if (!res.ok) throw new Error("Failed to apply finding")
  } catch (error) {
    throw new Error(
      `Apply finding failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

async function postDismissFinding(findingId: number): Promise<void> {
  try {
    const res = await fetch(`/api/admin/research/findings/${findingId}/dismiss`, {
      method: "POST",
    })
    if (!res.ok) throw new Error("Failed to dismiss finding")
  } catch (error) {
    throw new Error(
      `Dismiss finding failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

// ── Sub-Components ───────────────────────────────────────────────────────

function DetailHeader({ job }: { readonly job: JobWithFindings }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {statusIcon(job.status)}
        <h3 className="text-lg font-semibold truncate">
          {JOB_TYPE_LABELS[job.type]}
        </h3>
        <Badge variant="outline" className="text-xs">
          #{job.id}
        </Badge>
        <Badge className={statusColor(job.status)}>{job.status}</Badge>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
      </span>
    </div>
  )
}

function ProcessingBanner({
  job,
  onCancel,
  isCancelling,
}: {
  readonly job: JobWithFindings
  readonly onCancel: () => void
  readonly isCancelling: boolean
}) {
  if (job.status !== "processing") return null

  const elapsed = job.startedAt
    ? formatDistanceToNow(new Date(job.startedAt))
    : "just started"

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardContent className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 animate-pulse text-blue-600" />
          <span>Processing for {elapsed}</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onCancel}
          disabled={isCancelling}
        >
          <XCircle className="size-4 mr-1" />
          {isCancelling ? "Cancelling..." : "Cancel"}
        </Button>
      </CardContent>
    </Card>
  )
}

function InfoCards({ job }: { readonly job: JobWithFindings }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-1 flex items-center gap-2">
            {statusIcon(job.status)}
            <span className="text-sm font-medium capitalize">{job.status}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground">Findings</p>
          <div className="mt-1 flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {job._count.findings}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TimelineCard({ job }: { readonly job: JobWithFindings }) {
  const formatTimestamp = (ts: string | null) =>
    ts
      ? new Date(ts).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—"

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="size-4" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <TimelineRow label="Created" value={formatTimestamp(job.createdAt)} />
        <TimelineRow label="Started" value={formatTimestamp(job.startedAt)} />
        <TimelineRow label="Completed" value={formatTimestamp(job.completedAt)} />
      </CardContent>
    </Card>
  )
}

function TimelineRow({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function ConfigCard({ config }: { readonly config: Record<string, unknown> }) {
  const entries = Object.entries(config)
  if (entries.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings2 className="size-4" />
          Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{key}</span>
            <span className="font-medium">{String(value)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────

function toJobReport(response: ReportResponse): JobReport | null {
  const raw = response.report
  if (!raw) return null

  return {
    type: typeof raw.type === "string" ? raw.type : response.type,
    totalFindings:
      typeof raw.totalFindings === "number" ? raw.totalFindings : 0,
    completedAt:
      typeof raw.completedAt === "string"
        ? raw.completedAt
        : new Date().toISOString(),
    ...(typeof raw.error === "string" ? { error: raw.error } : {}),
  }
}

// ── Main Component ──────────────────────────────────────────────────────

export function JobDetailPanel({ jobId }: JobDetailPanelProps) {
  const queryClient = useQueryClient()

  const jobQuery = useQuery<ApiResponse<JobWithFindings>>({
    queryKey: ["admin", "research", "jobs", jobId],
    queryFn: () => fetchJob(jobId!),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status
      return status === "processing" || status === "pending" ? 3000 : false
    },
  })

  const reportQuery = useQuery<ApiResponse<ReportResponse>>({
    queryKey: ["admin", "research", "jobs", jobId, "report"],
    queryFn: () => fetchReport(jobId!),
    enabled: jobId !== null,
    staleTime: 30_000,
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (jobId === null) throw new Error("No job selected")
      const res = await fetch(`/api/admin/research/jobs/${jobId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to cancel research job")
    },
    onSuccess: () => {
      toast.success("Research job cancelled")
      queryClient.invalidateQueries({
        queryKey: ["admin", "research", "jobs", jobId],
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const applyMutation = useMutation({
    mutationFn: postApplyFinding,
    onSuccess: () => {
      toast.success("Finding applied")
      queryClient.invalidateQueries({
        queryKey: ["admin", "research", "jobs", jobId],
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const dismissMutation = useMutation({
    mutationFn: postDismissFinding,
    onSuccess: () => {
      toast.success("Finding dismissed")
      queryClient.invalidateQueries({
        queryKey: ["admin", "research", "jobs", jobId],
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleCancel = useCallback(() => {
    cancelMutation.mutate()
  }, [cancelMutation])

  const handleApply = useCallback(
    (findingId: number) => {
      applyMutation.mutate(findingId)
    },
    [applyMutation],
  )

  const handleDismiss = useCallback(
    (findingId: number) => {
      dismissMutation.mutate(findingId)
    },
    [dismissMutation],
  )

  // ── Empty State ──────────────────────────────────────────────────────

  if (jobId === null) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          Select a job to view details
        </p>
      </div>
    )
  }

  // ── Loading State ────────────────────────────────────────────────────

  if (jobQuery.isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  // ── Error State ──────────────────────────────────────────────────────

  if (jobQuery.isError || !jobQuery.data?.data) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-destructive">Failed to load job details</p>
      </div>
    )
  }

  const job = jobQuery.data.data
  const report = reportQuery.data?.data
    ? toJobReport(reportQuery.data.data)
    : null

  return (
    <div className="space-y-4 overflow-y-auto p-4">
      <DetailHeader job={job} />

      <ProcessingBanner
        job={job}
        onCancel={handleCancel}
        isCancelling={cancelMutation.isPending}
      />

      <InfoCards job={job} />
      <TimelineCard job={job} />
      <ConfigCard config={job.config} />

      <FindingsList
        findings={job.findings}
        onApply={handleApply}
        onDismiss={handleDismiss}
        isApplying={applyMutation.isPending}
        isDismissing={dismissMutation.isPending}
      />

      <ReportViewer report={report} />
    </div>
  )
}
