"use client"

import { useState, useCallback, useMemo } from "react"
import { Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { ResearchFinding } from "./types"

// ── Types ────────────────────────────────────────────────────────────────

type FindingTypeFilter =
  | "all"
  | "broken_link"
  | "missing_metadata"
  | "new_resource"
  | "trend"

interface FindingsListProps {
  readonly findings: readonly ResearchFinding[]
  readonly onApply: (id: number) => void
  readonly onDismiss: (id: number) => void
  readonly isApplying: boolean
  readonly isDismissing: boolean
}

// ── Constants ────────────────────────────────────────────────────────────

const FILTER_OPTIONS: ReadonlyArray<
  readonly [FindingTypeFilter, string]
> = [
  ["all", "All Types"],
  ["broken_link", "Broken Link"],
  ["missing_metadata", "Missing Metadata"],
  ["new_resource", "New Resource"],
  ["trend", "Trend"],
]

const TYPE_BADGE_COLORS: Record<string, string> = {
  broken_link: "bg-red-500/15 text-red-700 dark:text-red-400",
  missing_metadata: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  new_resource: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  trend: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getTypeBadgeColor(type: string): string {
  return TYPE_BADGE_COLORS[type] ?? "bg-gray-500/15 text-gray-700 dark:text-gray-400"
}

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

function getConfidenceBadgeColor(confidence: number): string {
  const pct = confidence * 100
  if (pct >= 80) return "bg-green-500/15 text-green-700 dark:text-green-400"
  if (pct >= 50) return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
  return "bg-red-500/15 text-red-700 dark:text-red-400"
}

function formatTypeLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

// ── FindingRow ───────────────────────────────────────────────────────────

function FindingRow({
  finding,
  onApply,
  onDismiss,
  isApplying,
  isDismissing,
}: {
  readonly finding: ResearchFinding
  readonly onApply: (id: number) => void
  readonly onDismiss: (id: number) => void
  readonly isApplying: boolean
  readonly isDismissing: boolean
}) {
  const isActioned = finding.applied || finding.dismissed

  const handleApply = useCallback(() => {
    onApply(finding.id)
  }, [onApply, finding.id])

  const handleDismiss = useCallback(() => {
    onDismiss(finding.id)
  }, [onDismiss, finding.id])

  return (
    <div className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getTypeBadgeColor(finding.type)}>
            {formatTypeLabel(finding.type)}
          </Badge>
          <Badge className={getConfidenceBadgeColor(finding.confidence)}>
            {formatConfidence(finding.confidence)}
          </Badge>
          {finding.applied && (
            <Badge className="bg-green-500/15 text-green-700 dark:text-green-400">
              Applied
            </Badge>
          )}
          {finding.dismissed && (
            <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400">
              Dismissed
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium truncate">{finding.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {finding.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(finding.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleApply}
          disabled={isActioned || isApplying}
          title="Apply finding"
        >
          <Check className="size-4 text-green-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          disabled={isActioned || isDismissing}
          title="Dismiss finding"
        >
          <X className="size-4 text-red-600" />
        </Button>
      </div>
    </div>
  )
}

// ── FindingsList ─────────────────────────────────────────────────────────

export function FindingsList({
  findings,
  onApply,
  onDismiss,
  isApplying,
  isDismissing,
}: FindingsListProps) {
  const [typeFilter, setTypeFilter] = useState<FindingTypeFilter>("all")

  const handleFilterChange = useCallback((value: string) => {
    setTypeFilter(value as FindingTypeFilter)
  }, [])

  const filteredFindings = useMemo(
    () =>
      typeFilter === "all"
        ? findings
        : findings.filter((f) => f.type === typeFilter),
    [findings, typeFilter],
  )

  return (
    <div className="space-y-3">
      {/* Filter Row */}
      <div className="flex items-center justify-between px-4">
        <h4 className="text-sm font-semibold">
          Findings ({filteredFindings.length})
        </h4>
        <Select value={typeFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]" size="sm">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          {typeFilter === "all"
            ? "No findings yet"
            : `No ${formatTypeLabel(typeFilter).toLowerCase()} findings`}
        </p>
      ) : (
        <div className="rounded-md border">
          {filteredFindings.map((finding) => (
            <FindingRow
              key={finding.id}
              finding={finding}
              onApply={onApply}
              onDismiss={onDismiss}
              isApplying={isApplying}
              isDismissing={isDismissing}
            />
          ))}
        </div>
      )}
    </div>
  )
}
