"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"

import { DataTable, DataTableColumnHeader } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

interface EditResource {
  id: number
  title: string
  url: string
}

interface EditSubmitter {
  id: string
  name: string | null
  email: string
}

interface AdminEdit {
  id: number
  resourceId: number
  submittedById: string
  status: string
  editType: string
  justification: string
  proposedChanges: Record<string, { oldValue: string | null; newValue: string | null }>
  aiAnalysis: Record<string, unknown> | null
  reviewedById: string | null
  reviewedAt: string | null
  reviewFeedback: string | null
  createdAt: string
  updatedAt: string
  resource: EditResource
  submittedBy: EditSubmitter
}

interface AdminEditsResponse {
  success: boolean
  data: AdminEdit[]
  meta: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "approved":
      return "default" as const
    case "pending":
      return "secondary" as const
    case "rejected":
      return "destructive" as const
    default:
      return "outline" as const
  }
}

function statusColor(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-500/15 text-green-700 dark:text-green-400"
    case "pending":
      return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
    case "rejected":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    default:
      return ""
  }
}

function editTypeBadgeVariant(editType: string) {
  switch (editType) {
    case "correction":
      return "default" as const
    case "enhancement":
      return "secondary" as const
    case "report":
      return "destructive" as const
    default:
      return "outline" as const
  }
}

function DiffView({
  proposedChanges,
}: {
  proposedChanges: Record<string, { oldValue: string | null; newValue: string | null }>
}) {
  const entries = Object.entries(proposedChanges)

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No proposed changes.</p>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map(([field, values]) => (
        <div key={field} className="rounded-md border p-3">
          <p className="mb-2 text-sm font-semibold capitalize">{field}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Current
              </p>
              <div className="rounded bg-red-500/10 p-2 text-sm">
                {values.oldValue ?? <span className="italic text-muted-foreground">empty</span>}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Proposed
              </p>
              <div className="rounded bg-green-500/10 p-2 text-sm">
                {values.newValue ?? <span className="italic text-muted-foreground">empty</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (feedback: string) => void
  isLoading: boolean
}) {
  const [feedback, setFeedback] = React.useState("")

  function handleSubmit() {
    onConfirm(feedback)
    setFeedback("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Edit Suggestion</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="reject-feedback" className="text-sm font-medium">
            Feedback (optional)
          </label>
          <Textarea
            id="reject-feedback"
            placeholder="Explain why this edit was rejected..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EditSuggestionsTab() {
  const queryClient = useQueryClient()

  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(20)
  const [statusFilter, setStatusFilter] = React.useState("")
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(
    new Set()
  )
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [rejectingEditId, setRejectingEditId] = React.useState<number | null>(
    null
  )

  React.useEffect(() => {
    setPage(0)
  }, [statusFilter, pageSize])

  const queryParams = React.useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page + 1))
    params.set("limit", String(pageSize))
    if (statusFilter) params.set("status", statusFilter)
    return params.toString()
  }, [page, pageSize, statusFilter])

  const { data, isLoading } = useQuery<AdminEditsResponse>({
    queryKey: ["admin-edits", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/admin/edits?${queryParams}`)
      if (!res.ok) throw new Error("Failed to fetch edit suggestions")
      return res.json()
    },
    staleTime: 60_000,
  })

  const edits = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  function invalidateEdits() {
    queryClient.invalidateQueries({ queryKey: ["admin-edits"] })
  }

  const approveMutation = useMutation({
    mutationFn: async (editId: number) => {
      const res = await fetch(`/api/admin/edits/${editId}/approve`, {
        method: "PUT",
      })
      if (!res.ok) throw new Error("Failed to approve edit")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Edit suggestion approved successfully")
      invalidateEdits()
    },
    onError: () => toast.error("Failed to approve edit suggestion"),
  })

  const rejectMutation = useMutation({
    mutationFn: async ({
      editId,
      feedback,
    }: {
      editId: number
      feedback: string
    }) => {
      const res = await fetch(`/api/admin/edits/${editId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      })
      if (!res.ok) throw new Error("Failed to reject edit")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Edit suggestion rejected successfully")
      invalidateEdits()
      setRejectDialogOpen(false)
      setRejectingEditId(null)
    },
    onError: () => toast.error("Failed to reject edit suggestion"),
  })

  function toggleRow(id: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleRejectClick(editId: number) {
    setRejectingEditId(editId)
    setRejectDialogOpen(true)
  }

  function handleRejectConfirm(feedback: string) {
    if (rejectingEditId === null) return
    rejectMutation.mutate({ editId: rejectingEditId, feedback })
  }

  const columns: ColumnDef<AdminEdit>[] = [
    {
      id: "expand",
      header: "",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toggleRow(row.original.id)}
        >
          {expandedRows.has(row.original.id) ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      ),
    },
    {
      accessorKey: "resource",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Resource" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium">
          {row.original.resource.title}
        </div>
      ),
    },
    {
      accessorKey: "submittedBy",
      header: "Submitter",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.submittedBy.name ?? row.original.submittedBy.email}
        </span>
      ),
    },
    {
      accessorKey: "editType",
      header: "Edit Type",
      cell: ({ row }) => (
        <Badge variant={editTypeBadgeVariant(row.original.editType)}>
          {row.original.editType}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={statusBadgeVariant(row.original.status)}
          className={statusColor(row.original.status)}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const edit = row.original
        if (edit.status !== "pending") return null
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-green-600 hover:bg-green-500/10 hover:text-green-700"
              onClick={() => approveMutation.mutate(edit.id)}
              disabled={approveMutation.isPending}
              title="Approve"
            >
              <CheckCircle className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
              onClick={() => handleRejectClick(edit.id)}
              disabled={rejectMutation.isPending}
              title="Reject"
            >
              <XCircle className="size-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const toolbarContent = (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Edit Suggestions</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve or reject user-submitted edit suggestions.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={edits}
        page={page}
        pageSize={pageSize}
        pageCount={pageCount}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
        isLoading={isLoading}
        toolbarContent={toolbarContent}
      />

      {/* Expanded row details */}
      {edits
        .filter((edit) => expandedRows.has(edit.id))
        .map((edit) => (
          <Card key={`detail-${edit.id}`}>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Edit #{edit.id} — {edit.resource.title}
                </h3>
                <Badge variant={editTypeBadgeVariant(edit.editType)}>
                  {edit.editType}
                </Badge>
              </div>

              {edit.justification && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Justification
                  </p>
                  <p className="text-sm">{edit.justification}</p>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Proposed Changes
                </p>
                <DiffView proposedChanges={edit.proposedChanges} />
              </div>

              {edit.reviewFeedback && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Review Feedback
                  </p>
                  <p className="text-sm">{edit.reviewFeedback}</p>
                </div>
              )}

              {edit.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => approveMutation.mutate(edit.id)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="mr-1 size-4" />
                    Approve & Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRejectClick(edit.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="mr-1 size-4" />
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isLoading={rejectMutation.isPending}
      />
    </div>
  )
}
