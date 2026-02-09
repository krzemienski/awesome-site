"use client"

import * as React from "react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import {
  Link2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Activity,
  Ban,
  ArrowUpDown,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { StatCard } from "@/components/admin/stat-card"
import { DataTable } from "@/components/admin/data-table"
import { TrendChart } from "./link-health/trend-chart"
import { JobHistory } from "./link-health/job-history"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ApiResponse } from "@/lib/api-response"
import type { LinkHealthHistoryEntry } from "@/features/admin/link-health-service"

// ── Types ──────────────────────────────────────────────────────────────────

interface LinkCheckResult {
  readonly resourceId: number
  readonly url: string
  readonly title: string
  readonly statusCode: number | null
  readonly responseTime: number
  readonly error: string | null
  readonly healthy: boolean
  readonly checkedAt: string
}

interface LinkHealthReport {
  readonly totalChecked: number
  readonly healthy: number
  readonly broken: number
  readonly timeout: number
  readonly results: readonly LinkCheckResult[]
  readonly startedAt: string | null
  readonly completedAt: string | null
}

interface LinkHealthReportWithHistory extends LinkHealthReport {
  readonly history?: readonly LinkHealthHistoryEntry[]
}

type StatusFilter = "all" | "healthy" | "broken" | "timeout" | "redirect"

// ── Helpers ────────────────────────────────────────────────────────────────

function deriveStatus(result: LinkCheckResult): string {
  if (result.error?.includes("timed out")) return "timeout"
  if (result.statusCode !== null && result.statusCode >= 300 && result.statusCode < 400) return "redirect"
  if (result.healthy) return "healthy"
  return "broken"
}

function statusBadge(result: LinkCheckResult) {
  const status = deriveStatus(result)

  switch (status) {
    case "healthy":
      return (
        <Badge className="bg-green-500/15 text-green-700 dark:text-green-400">
          <CheckCircle className="size-3" />
          Healthy
        </Badge>
      )
    case "broken":
      return (
        <Badge className="bg-red-500/15 text-red-700 dark:text-red-400">
          <XCircle className="size-3" />
          Broken
        </Badge>
      )
    case "redirect":
      return (
        <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400">
          <ArrowUpDown className="size-3" />
          Redirect
        </Badge>
      )
    case "timeout":
      return (
        <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400">
          <Clock className="size-3" />
          Timeout
        </Badge>
      )
    default:
      return null
  }
}

function truncateUrl(url: string, maxLength = 60): string {
  if (url.length <= maxLength) return url
  return `${url.slice(0, maxLength)}...`
}

function formatCheckedAt(checkedAt: string): string {
  try {
    return formatDistanceToNow(new Date(checkedAt), { addSuffix: true })
  } catch {
    return checkedAt
  }
}

function filterResults(
  results: readonly LinkCheckResult[],
  filter: StatusFilter
): readonly LinkCheckResult[] {
  if (filter === "all") return results

  return results.filter((r) => deriveStatus(r) === filter)
}

// ── Columns ────────────────────────────────────────────────────────────────

function buildColumns(
  onDisable: (resourceId: number) => void,
  isDisabling: boolean
): ColumnDef<LinkCheckResult, unknown>[] {
  return [
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
            title={row.original.url}
          >
            {truncateUrl(row.original.url)}
            <ExternalLink className="size-3 shrink-0" />
          </a>
          <div className="text-muted-foreground mt-0.5 text-xs">
            {row.original.title}
          </div>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "statusCode",
      header: "Status Code",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.statusCode ?? "N/A"}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "checkedAt",
      header: "Last Checked",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatCheckedAt(row.original.checkedAt)}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "responseTime",
      header: "Response Time",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.responseTime}ms
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => statusBadge(row.original),
      enableSorting: false,
    },
    {
      accessorKey: "error",
      header: "Error",
      cell: ({ row }) => {
        const error = row.original.error
        if (!error) return <span className="text-muted-foreground text-xs">-</span>
        return (
          <span className="max-w-[200px] truncate text-xs text-red-600" title={error}>
            {error}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const status = deriveStatus(row.original)
        if (status !== "broken" && status !== "timeout") return null

        return (
          <Button
            variant="ghost"
            size="sm"
            disabled={isDisabling}
            onClick={() => onDisable(row.original.resourceId)}
            className="text-destructive hover:text-destructive"
          >
            <Ban className="mr-1 size-3" />
            Archive
          </Button>
        )
      },
      enableSorting: false,
    },
  ]
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function LinkHealthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  )
}

// ── Button Label Helper ────────────────────────────────────────────────────

function getCheckButtonLabel(
  isPending: boolean,
  report: LinkHealthReportWithHistory | undefined
): string {
  if (!isPending) return "Check All Links"

  const checked = report?.results?.length ?? 0
  const total = report?.totalChecked ?? 0

  if (total > 0 && checked > 0) {
    return `Checking ${checked}/${total}...`
  }

  return "Checking..."
}

// ── Main Component ─────────────────────────────────────────────────────────

export function LinkHealthTab() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")

  // Track whether a check is in progress for polling
  const [isChecking, setIsChecking] = React.useState(false)
  // Safety limit: stop polling after 5 minutes (60 refetches @ 5s interval)
  const refetchCountRef = React.useRef(0)

  // Fetch existing results with history
  const {
    data: report,
    isLoading,
    isError,
  } = useQuery<LinkHealthReportWithHistory>({
    queryKey: ["admin", "link-health"],
    queryFn: async () => {
      const res = await fetch("/api/admin/link-health?includeHistory=true")
      if (!res.ok) throw new Error("Failed to fetch link health results")
      const json = (await res.json()) as ApiResponse<LinkHealthReportWithHistory>
      if (!json.data) throw new Error("No link health data returned")

      // Increment refetch counter
      if (isChecking) {
        refetchCountRef.current += 1
        // Safety limit: stop after 60 refetches (5 minutes)
        if (refetchCountRef.current >= 60) {
          setIsChecking(false)
          refetchCountRef.current = 0
        }
      }

      return json.data
    },
    refetchInterval: isChecking ? 5000 : false,
  })

  // Trigger check mutation
  const checkMutation = useMutation({
    mutationFn: async (): Promise<LinkHealthReport> => {
      const res = await fetch("/api/admin/link-health", { method: "POST" })
      if (!res.ok) throw new Error("Failed to start link health check")
      const json = (await res.json()) as ApiResponse<LinkHealthReport>
      if (!json.data) throw new Error("No link health check data returned")
      return json.data
    },
    onMutate: () => {
      setIsChecking(true)
      refetchCountRef.current = 0
    },
    onSuccess: (data) => {
      setIsChecking(false)
      refetchCountRef.current = 0
      queryClient.invalidateQueries({ queryKey: ["admin", "link-health"] })
      toast.success(
        `Check complete: ${data.healthy} healthy, ${data.broken} broken`
      )
    },
    onError: () => {
      setIsChecking(false)
      refetchCountRef.current = 0
      toast.error("Link check failed")
    },
  })

  // Disable resource mutation
  const disableMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const res = await fetch(`/api/admin/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      })
      if (!res.ok) throw new Error("Failed to archive resource")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Resource archived")
      queryClient.invalidateQueries({ queryKey: ["admin", "link-health"] })
    },
    onError: () => {
      toast.error("Failed to archive resource")
    },
  })

  const columns = React.useMemo(
    () =>
      buildColumns(
        (resourceId) => disableMutation.mutate(resourceId),
        disableMutation.isPending
      ),
    [disableMutation]
  )

  const history = React.useMemo(
    () => (report?.history ?? []) as LinkHealthHistoryEntry[],
    [report?.history]
  )

  if (isLoading) {
    return <LinkHealthSkeleton />
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Link Health</h1>
        <p className="text-destructive">
          Failed to load link health data. Please try again.
        </p>
      </div>
    )
  }

  const totalChecked = report?.totalChecked ?? 0
  const healthyCount = report?.healthy ?? 0
  const brokenCount = report?.broken ?? 0
  const timeoutCount = report?.timeout ?? 0
  const results = report?.results ?? []
  const filteredResults = filterResults(results, statusFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Link Health</h1>
          <p className="text-muted-foreground text-sm">
            Monitor and validate resource URLs across the site.
          </p>
        </div>
        <Button
          onClick={() => checkMutation.mutate()}
          disabled={checkMutation.isPending}
          size="lg"
        >
          {checkMutation.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Activity className="mr-2 size-4" />
          )}
          {getCheckButtonLabel(checkMutation.isPending, report)}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Total Links"
          value={totalChecked}
          icon={<Link2 className="size-4" />}
        />
        <StatCard
          label="Healthy"
          value={healthyCount}
          icon={<CheckCircle className="size-4 text-green-500" />}
        />
        <StatCard
          label="Broken"
          value={brokenCount}
          icon={<XCircle className="size-4 text-red-500" />}
        />
        <StatCard
          label="Timeout"
          value={timeoutCount}
          icon={<Clock className="size-4 text-orange-500" />}
        />
      </div>

      {/* Trend Chart */}
      {history.length >= 2 && <TrendChart history={history} />}

      {/* Results Table */}
      {totalChecked === 0 && !checkMutation.data ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="text-muted-foreground size-12" />
            <h2 className="mt-4 text-lg font-semibold">
              No link check results yet
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Click &quot;Check All Links&quot; to scan all resource URLs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Link Check Results</CardTitle>
            <CardDescription>
              {results.length} link(s) checked
              {report?.completedAt
                ? ` \u2014 last run ${formatCheckedAt(report.completedAt)}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={[...filteredResults]}
              searchColumn="url"
              searchPlaceholder="Search URLs..."
              toolbarContent={
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="broken">Broken</SelectItem>
                    <SelectItem value="redirect">Redirect</SelectItem>
                    <SelectItem value="timeout">Timeout</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Job History */}
      {history.length > 0 && <JobHistory history={history} />}
    </div>
  )
}
