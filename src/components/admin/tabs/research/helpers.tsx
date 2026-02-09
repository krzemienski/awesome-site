import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Badge } from "@/components/ui/badge"
import type { JobStatus, ResearchJob, ResearchJobType } from "./types"

// ── Constants ─────────────────────────────────────────────────────────────

export const JOB_TYPE_LABELS: Record<ResearchJobType, string> = {
  validation: "Validation",
  enrichment: "Enrichment",
  discovery: "Discovery",
  trend_analysis: "Trend Analysis",
  comprehensive: "Comprehensive",
}

export const SCOPE_ESTIMATES: Record<ResearchJobType, string> = {
  validation: "Will check up to 100 approved resources",
  enrichment: "Will scan resources missing descriptions or metadata",
  discovery: "Will analyze all categories for content gaps",
  trend_analysis: "Will analyze 30-day growth patterns",
  comprehensive: "Will run all research types sequentially",
}

// ── Status Helpers ────────────────────────────────────────────────────────

export function statusColor(status: JobStatus): string {
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

export function statusIcon(status: JobStatus) {
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

// ── JobListItem ───────────────────────────────────────────────────────────

export function JobListItem({
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
        <span>{job._count?.findings ?? 0} findings</span>
      </div>
    </button>
  )
}
