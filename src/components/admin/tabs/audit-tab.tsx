"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import {
  ScrollText,
  ChevronDown,
  ChevronRight,
  User,
  FileText,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

import { DataTable } from "@/components/admin/data-table"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ── Types ──────────────────────────────────────────────────────────────────

interface AuditLogResource {
  readonly id: number
  readonly title: string
  readonly url: string
}

interface AuditLogItem {
  readonly id: number
  readonly resourceId: number
  readonly action: string
  readonly performedById: string
  readonly previousState: Record<string, unknown> | null
  readonly newState: Record<string, unknown> | null
  readonly createdAt: string
  readonly resource: AuditLogResource | null
}

interface PaginationMeta {
  readonly total: number
  readonly page: number
  readonly limit: number
  readonly hasMore: boolean
}

interface AuditApiResponse {
  readonly success: boolean
  readonly data: readonly AuditLogItem[]
  readonly meta?: PaginationMeta
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return format(date, "MMM d, yyyy HH:mm:ss")
  } catch {
    return dateStr
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

function actionBadgeVariant(
  action: string
): "default" | "secondary" | "destructive" | "outline" {
  if (action.includes("delete") || action.includes("ban")) return "destructive"
  if (action.includes("create") || action.includes("import")) return "default"
  if (action.includes("update") || action.includes("edit")) return "secondary"
  return "outline"
}

const KNOWN_ACTIONS = [
  "create",
  "update",
  "delete",
  "import",
  "approve",
  "reject",
  "ban",
  "category_create",
  "category_update",
  "category_delete",
  "settings_update",
  "user_ban",
] as const

// ── Detail Expander ───────────────────────────────────────────────────────

function DetailsCell({
  previousState,
  newState,
}: {
  readonly previousState: Record<string, unknown> | null
  readonly newState: Record<string, unknown> | null
}) {
  const [expanded, setExpanded] = React.useState(false)

  const hasDetails =
    (previousState !== null && Object.keys(previousState).length > 0) ||
    (newState !== null && Object.keys(newState).length > 0)

  if (!hasDetails) {
    return <span className="text-muted-foreground text-xs">No details</span>
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? (
          <ChevronDown className="mr-1 size-3" />
        ) : (
          <ChevronRight className="mr-1 size-3" />
        )}
        {expanded ? "Hide" : "Details"}
      </Button>
      {expanded && (
        <div className="mt-2 max-w-[400px] space-y-2">
          {previousState !== null && Object.keys(previousState).length > 0 && (
            <div>
              <span className="text-muted-foreground text-xs font-medium">
                Previous:
              </span>
              <pre className="bg-muted mt-1 overflow-auto rounded p-2 text-xs">
                {JSON.stringify(previousState, null, 2)}
              </pre>
            </div>
          )}
          {newState !== null && Object.keys(newState).length > 0 && (
            <div>
              <span className="text-muted-foreground text-xs font-medium">
                New:
              </span>
              <pre className="bg-muted mt-1 overflow-auto rounded p-2 text-xs">
                {JSON.stringify(newState, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Columns ────────────────────────────────────────────────────────────────

function buildColumns(): ColumnDef<AuditLogItem, unknown>[] {
  return [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <div className="text-sm font-medium">
            {formatTimestamp(row.original.createdAt)}
          </div>
          <div className="text-muted-foreground text-xs">
            {formatRelativeTime(row.original.createdAt)}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "performedById",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <User className="text-muted-foreground size-3.5" />
          <span className="max-w-[120px] truncate font-mono text-xs">
            {row.original.performedById}
          </span>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Badge variant={actionBadgeVariant(row.original.action)}>
          {row.original.action}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      id: "resource",
      header: "Target Resource",
      cell: ({ row }) => {
        const resource = row.original.resource
        if (!resource) {
          return (
            <span className="text-muted-foreground text-xs italic">
              System action
            </span>
          )
        }
        return (
          <div className="flex items-center gap-1.5 max-w-[200px]">
            <FileText className="text-muted-foreground size-3.5 shrink-0" />
            <span className="truncate text-sm" title={resource.title}>
              {resource.title}
            </span>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => (
        <DetailsCell
          previousState={
            row.original.previousState as Record<string, unknown> | null
          }
          newState={row.original.newState as Record<string, unknown> | null}
          />
      ),
      enableSorting: false,
    },
  ]
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function AuditSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AuditTab() {
  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(50)
  const [actionFilter, setActionFilter] = React.useState<string>("all")
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")

  const queryParams = React.useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page + 1))
    params.set("limit", String(pageSize))
    if (actionFilter !== "all") {
      params.set("action", actionFilter)
    }
    return params.toString()
  }, [page, pageSize, actionFilter])

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery<AuditApiResponse>({
    queryKey: ["admin", "audit", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/admin/audit?${queryParams}`)
      if (!res.ok) throw new Error("Failed to fetch audit logs")
      return res.json() as Promise<AuditApiResponse>
    },
  })

  const items = React.useMemo(() => {
    const rawItems = response?.data ?? []
    if (!dateFrom && !dateTo) return [...rawItems]

    return [...rawItems].filter((item) => {
      const itemDate = new Date(item.createdAt)
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        if (itemDate < fromDate) return false
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (itemDate > toDate) return false
      }
      return true
    })
  }, [response?.data, dateFrom, dateTo])

  const meta = response?.meta
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1

  const columns = React.useMemo(() => buildColumns(), [])

  const handleActionFilterChange = React.useCallback((value: string) => {
    setActionFilter(value)
    setPage(0)
  }, [])

  const handlePageChange = React.useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handlePageSizeChange = React.useCallback((newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }, [])

  if (isLoading) {
    return <AuditSkeleton />
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Audit Log</h1>
        <p className="text-destructive">
          Failed to load audit logs. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground text-sm">
          Chronological log of all administrative actions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="action-filter" className="text-sm">
            Action Type
          </Label>
          <Select
            value={actionFilter}
            onValueChange={handleActionFilterChange}
          >
            <SelectTrigger id="action-filter" className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {KNOWN_ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date-from" className="text-sm">
            From
          </Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date-to" className="text-sm">
            To
          </Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[160px]"
          />
        </div>

        {(actionFilter !== "all" || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActionFilter("all")
              setDateFrom("")
              setDateTo("")
              setPage(0)
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Results */}
      {items.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ScrollText className="text-muted-foreground size-12" />
            <h2 className="mt-4 text-lg font-semibold">
              No audit log entries
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Administrative actions will appear here as they occur.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Audit Entries</CardTitle>
            <CardDescription>
              {meta?.total ?? items.length} total log entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={items}
              page={page}
              pageSize={pageSize}
              pageCount={totalPages}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              searchColumn="performedById"
              searchPlaceholder="Search by user ID..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
