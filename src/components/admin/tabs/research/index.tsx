"use client"

import { useState, useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, BarChart3, FileSearch, Microscope } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { StatCard } from "@/components/admin/stat-card"

import type { ApiResponse } from "@/lib/api-response"
import type { ResearchJob, ResearchJobType } from "./types"
import { JobListItem } from "./helpers"
import { CostDashboard } from "./cost-dashboard"
import { JobCreationDialog } from "./job-creation-dialog"
import { JobDetailPanel } from "./job-detail-panel"

// ── Fetch Helpers ────────────────────────────────────────────────────────

async function fetchJobs(): Promise<ApiResponse<readonly ResearchJob[]>> {
  try {
    const res = await fetch("/api/admin/research/jobs")
    if (!res.ok) throw new Error("Failed to fetch research jobs")
    return res.json()
  } catch (error) {
    throw new Error(
      `Research jobs fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

interface CreateJobPayload {
  readonly type: ResearchJobType
  readonly config: Record<string, unknown>
}

async function createJob(
  payload: CreateJobPayload
): Promise<ApiResponse<{ readonly jobId: number }>> {
  try {
    const res = await fetch("/api/admin/research/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = (await res.json()) as { readonly error?: string }
      throw new Error(err.error ?? "Failed to start research job")
    }
    return res.json()
  } catch (error) {
    throw new Error(
      `Research job creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

// ── Skeleton ─────────────────────────────────────────────────────────────

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

// ── Sub-Components ──────────────────────────────────────────────────────

function ResearchHeader({
  onOpenDialog,
  hasActiveJob,
}: {
  readonly onOpenDialog: () => void
  readonly hasActiveJob: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold">Research</h1>
        <p className="text-muted-foreground text-sm">
          Manage AI-powered research jobs and view findings.
        </p>
      </div>
      <Button onClick={onOpenDialog} disabled={hasActiveJob}>
        <Search className="mr-2 size-4" />
        Start Research
      </Button>
    </div>
  )
}

function JobListPanel({
  jobs,
  selectedJobId,
  onSelectJob,
}: {
  readonly jobs: readonly ResearchJob[]
  readonly selectedJobId: number | null
  readonly onSelectJob: (id: number) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Jobs</h3>
        <p className="text-xs text-muted-foreground">{jobs.length} total</p>
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
              onSelect={() => onSelectJob(job.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────

export function ResearchTab() {
  const queryClient = useQueryClient()
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const {
    data: jobsResponse,
    isLoading,
    isError,
  } = useQuery<ApiResponse<readonly ResearchJob[]>>({
    queryKey: ["admin", "research", "jobs"],
    queryFn: fetchJobs,
    refetchInterval: (query) => {
      const jobs = query.state.data?.data
      if (!jobs) return false
      const hasActive = jobs.some(
        (j) => j.status === "processing" || j.status === "pending"
      )
      return hasActive ? 5000 : false
    },
  })

  const jobs = useMemo(() => jobsResponse?.data ?? [], [jobsResponse?.data])

  const { completedCount, totalFindings, hasActiveJob } = useMemo(() => ({
    completedCount: jobs.filter((j) => j.status === "completed").length,
    totalFindings: jobs.reduce((sum, j) => sum + j._count.findings, 0),
    hasActiveJob: jobs.some(
      (j) => j.status === "processing" || j.status === "pending"
    ),
  }), [jobs])

  const startMutation = useMutation({
    mutationFn: createJob,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "research", "jobs"] })
      if (data.data?.jobId) {
        setSelectedJobId(data.data.jobId)
      }
      setDialogOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleCreateJob = useCallback(
    (payload: CreateJobPayload) => {
      startMutation.mutate(payload)
    },
    [startMutation]
  )

  const handleSelectJob = useCallback((id: number) => {
    setSelectedJobId(id)
  }, [])

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true)
  }, [])

  if (isLoading) return <ResearchSkeleton />

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

  return (
    <div className="space-y-6">
      <ResearchHeader onOpenDialog={handleOpenDialog} hasActiveJob={hasActiveJob} />

      <JobCreationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateJob}
        isLoading={startMutation.isPending}
        hasActiveJob={hasActiveJob}
      />

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
        <CostDashboard />
      </div>

      <Card className="overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="min-h-[500px]">
          <ResizablePanel defaultSize={35} minSize={25}>
            <JobListPanel
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelectJob={handleSelectJob}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65} minSize={40}>
            <div className="h-full overflow-y-auto">
              <JobDetailPanel jobId={selectedJobId} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Card>
    </div>
  )
}
