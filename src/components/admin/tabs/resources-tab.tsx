"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  MoreHorizontal,
  Plus,
  CheckCircle,
  XCircle,
  Trash2,
  Pencil,
  ExternalLink,
  Download,
} from "lucide-react"
import { toast } from "sonner"

import { DataTable, DataTableColumnHeader } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ResourceDialog } from "@/components/admin/dialogs/resource-dialog"
import { useCategories } from "@/hooks/use-categories"

interface AdminResource {
  id: number
  title: string
  url: string
  description: string
  categoryId: number
  subcategoryId: number | null
  subSubcategoryId: number | null
  status: string
  metadata: Record<string, unknown>
  createdAt: string
  category: { id: number; name: string }
  subcategory: { id: number; name: string } | null
  subSubcategory: { id: number; name: string } | null
  tags: Array<{ tag: { id: number; name: string; slug: string } }>
}

interface AdminResourcesResponse {
  success: boolean
  data: AdminResource[]
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

function isEnriched(metadata: Record<string, unknown>): boolean {
  return Object.keys(metadata).length > 0
}

export function ResourcesTab() {
  const queryClient = useQueryClient()
  const { data: categories } = useCategories()

  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(20)
  const [statusFilter, setStatusFilter] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [enrichedFilter, setEnrichedFilter] = React.useState("")

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editResource, setEditResource] = React.useState<AdminResource | null>(
    null
  )
  const [selectedRows, setSelectedRows] = React.useState<AdminResource[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  React.useEffect(() => {
    setPage(0)
  }, [statusFilter, categoryFilter, debouncedSearch, enrichedFilter, pageSize])

  const queryParams = React.useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page + 1))
    params.set("limit", String(pageSize))
    if (statusFilter) params.set("status", statusFilter)
    if (categoryFilter) params.set("categoryId", categoryFilter)
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (enrichedFilter) params.set("enriched", enrichedFilter)
    return params.toString()
  }, [page, pageSize, statusFilter, categoryFilter, debouncedSearch, enrichedFilter])

  const { data, isLoading } = useQuery<AdminResourcesResponse>({
    queryKey: ["admin-resources", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/admin/resources?${queryParams}`)
      if (!res.ok) throw new Error("Failed to fetch resources")
      return res.json()
    },
    staleTime: 60_000,
  })

  const resources = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  function invalidateResources() {
    queryClient.invalidateQueries({ queryKey: ["admin-resources"] })
  }

  async function handleApprove(id: number) {
    await fetch(`/api/resources/${id}/approve`, { method: "PUT" })
    invalidateResources()
  }

  async function handleReject(id: number) {
    await fetch(`/api/resources/${id}/reject`, { method: "PUT" })
    invalidateResources()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/resources/${id}`, { method: "DELETE" })
    invalidateResources()
  }

  function handleEdit(resource: AdminResource) {
    setEditResource(resource)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditResource(null)
    setDialogOpen(true)
  }

  async function handleBulkDelete() {
    const ids = selectedRows.map((r) => r.id)
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/admin/resources/${id}`, { method: "DELETE" })
      )
    )
    const failed = results.filter((r) => r.status === "rejected").length
    if (failed > 0) {
      toast.error(`${failed} of ${ids.length} deletions failed`)
    } else {
      toast.success(`Deleted ${ids.length} resource${ids.length === 1 ? "" : "s"}`)
    }
    setSelectedRows([])
    setBulkDeleteOpen(false)
    invalidateResources()
  }

  function handleExportCsv() {
    const rows = selectedRows.length > 0 ? selectedRows : resources
    if (rows.length === 0) {
      toast.error("No resources to export")
      return
    }
    const header = "ID,Title,URL,Category,Status,Tags,Created"
    const csvRows = rows.map((r) => {
      const tags = r.tags.map((t) => t.tag.name).join("; ")
      return [
        r.id,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.url}"`,
        `"${r.category.name}"`,
        r.status,
        `"${tags}"`,
        new Date(r.createdAt).toISOString().split("T")[0],
      ].join(",")
    })
    const csv = [header, ...csvRows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `resources-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} resource${rows.length === 1 ? "" : "s"}`)
  }

  const columns: ColumnDef<AdminResource>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium">
          {row.original.title}
        </div>
      ),
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => (
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex max-w-[150px] items-center gap-1 truncate text-sm text-muted-foreground hover:text-foreground"
        >
          {new URL(row.original.url).hostname}
          <ExternalLink className="size-3 shrink-0" />
        </a>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.category.name}</span>
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
      id: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const tags = row.original.tags
        if (tags.length === 0) return <span className="text-muted-foreground text-sm">-</span>
        return (
          <div className="flex max-w-[200px] flex-wrap gap-1">
            {tags.slice(0, 3).map((t) => (
              <Badge key={t.tag.id} variant="outline" className="text-xs">
                {t.tag.name}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      id: "enriched",
      header: "Enriched",
      cell: ({ row }) =>
        isEnriched(row.original.metadata) ? (
          <Badge variant="default" className="bg-green-500/15 text-green-700 text-xs dark:text-green-400">
            Yes
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">No</span>
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
        const r = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(r)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              {r.status === "pending" && (
                <DropdownMenuItem onClick={() => handleApprove(r.id)}>
                  <CheckCircle className="mr-2 size-4" />
                  Approve
                </DropdownMenuItem>
              )}
              {r.status === "pending" && (
                <DropdownMenuItem onClick={() => handleReject(r.id)}>
                  <XCircle className="mr-2 size-4" />
                  Reject
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleDelete(r.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const toolbarContent = (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search resources..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-[200px]"
      />
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories?.map((cat) => (
            <SelectItem key={cat.id} value={String(cat.id)}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={enrichedFilter} onValueChange={setEnrichedFilter}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Enrichment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="true">Enriched</SelectItem>
          <SelectItem value="false">Not enriched</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={handleExportCsv} className="ml-auto">
        <Download className="mr-1 size-4" />
        Export CSV
      </Button>
      <Button onClick={handleCreate} size="sm">
        <Plus className="mr-1 size-4" />
        Add Resource
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Resources</h1>
        <p className="text-sm text-muted-foreground">
          Manage resources, review submissions, and handle approvals.
        </p>
      </div>

      {selectedRows.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedRows.length} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="mr-1 size-4" />
            Delete Selected
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-1 size-4" />
            Export CSV
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={resources}
        page={page}
        pageSize={pageSize}
        pageCount={pageCount}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
        enableRowSelection
        onSelectionChange={setSelectedRows}
        isLoading={isLoading}
        toolbarContent={toolbarContent}
      />

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedRows.length} resources?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected resources will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        resource={editResource}
        onSuccess={invalidateResources}
      />
    </div>
  )
}
