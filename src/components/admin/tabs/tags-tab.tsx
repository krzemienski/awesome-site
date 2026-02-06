"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2, Merge, Check, X } from "lucide-react"

import { DataTable, DataTableColumnHeader } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

interface AdminTag {
  id: number
  name: string
  slug: string
  description: string | null
  _count: { resources: number }
}

export function TagsTab() {
  const queryClient = useQueryClient()

  const [deleteTarget, setDeleteTarget] = React.useState<AdminTag | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editName, setEditName] = React.useState("")
  const [isSavingRename, setIsSavingRename] = React.useState(false)
  const [selectedRows, setSelectedRows] = React.useState<AdminTag[]>([])
  const [mergeDialogOpen, setMergeDialogOpen] = React.useState(false)
  const [mergeTargetId, setMergeTargetId] = React.useState<string>("")
  const [isMerging, setIsMerging] = React.useState(false)

  const { data, isLoading } = useQuery<{ success: boolean; data: AdminTag[] }>({
    queryKey: ["admin-tags"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tags")
      if (!res.ok) throw new Error("Failed to fetch tags")
      return res.json()
    },
    staleTime: 60_000,
  })

  const tags = data?.data ?? []

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-tags"] })
    queryClient.invalidateQueries({ queryKey: ["tags"] })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/tags/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to delete tag")
      }
      invalidate()
      setDeleteTarget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setIsDeleting(false)
    }
  }

  function startRename(tag: AdminTag) {
    setEditingId(tag.id)
    setEditName(tag.name)
  }

  function cancelRename() {
    setEditingId(null)
    setEditName("")
  }

  async function saveRename(tagId: number) {
    if (!editName.trim()) {
      cancelRename()
      return
    }
    setIsSavingRename(true)
    try {
      const res = await fetch(`/api/admin/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to rename tag")
      }
      invalidate()
      setEditingId(null)
      setEditName("")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rename failed")
    } finally {
      setIsSavingRename(false)
    }
  }

  function openMergeDialog() {
    setMergeTargetId("")
    setMergeDialogOpen(true)
  }

  async function handleMerge() {
    const targetId = parseInt(mergeTargetId, 10)
    if (isNaN(targetId)) return

    const sourceIds = selectedRows
      .map((r) => r.id)
      .filter((id) => id !== targetId)

    if (sourceIds.length === 0) return

    setIsMerging(true)
    try {
      const res = await fetch("/api/admin/tags/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTagIds: sourceIds,
          targetTagId: targetId,
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to merge tags")
      }
      invalidate()
      setMergeDialogOpen(false)
      setSelectedRows([])
    } catch (err) {
      alert(err instanceof Error ? err.message : "Merge failed")
    } finally {
      setIsMerging(false)
    }
  }

  const columns: ColumnDef<AdminTag>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const tag = row.original
        if (editingId === tag.id) {
          return (
            <div className="flex items-center gap-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename(tag.id)
                  if (e.key === "Escape") cancelRename()
                }}
                className="h-7 w-40"
                autoFocus
                disabled={isSavingRename}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => saveRename(tag.id)}
                disabled={isSavingRename}
              >
                <Check className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={cancelRename}
                disabled={isSavingRename}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          )
        }
        return (
          <button
            type="button"
            className="max-w-[200px] truncate font-medium hover:underline cursor-pointer text-left"
            onClick={() => startRename(tag)}
          >
            {tag.name}
          </button>
        )
      },
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.slug}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
          {row.original.description ?? "-"}
        </div>
      ),
    },
    {
      id: "usage",
      accessorFn: (row) => row._count.resources,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Usage" />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original._count.resources}</Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const tag = row.original
        const canDelete = tag._count.resources === 0
        return (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeleteTarget(tag)}
            disabled={!canDelete}
            title={canDelete ? "Delete tag" : "Cannot delete tag with resources"}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete</span>
          </Button>
        )
      },
    },
  ]

  const nonSelectedTags = tags.filter(
    (t) => !selectedRows.some((s) => s.id === t.id)
  )
  const mergeTargetOptions = [
    ...selectedRows,
    ...nonSelectedTags,
  ]

  const toolbarContent = (
    <div className="flex items-center gap-2">
      {selectedRows.length >= 2 && (
        <Button onClick={openMergeDialog} size="sm" variant="outline">
          <Merge className="mr-1 size-4" />
          Merge ({selectedRows.length})
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Tags</h1>
        <p className="text-sm text-muted-foreground">
          Tag management with merge, rename, and usage tracking. Click a name to rename.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={tags}
        searchColumn="name"
        searchPlaceholder="Search tags..."
        isLoading={isLoading}
        enableRowSelection
        onSelectionChange={setSelectedRows}
        toolbarContent={toolbarContent}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete Tag"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              All resources from the selected tags will be reassigned to the target
              tag. Source tags will be deleted.
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedRows.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name} ({tag._count.resources})
                </Badge>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Merge into:</label>
              <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target tag..." />
                </SelectTrigger>
                <SelectContent>
                  {mergeTargetOptions.map((tag) => (
                    <SelectItem key={tag.id} value={String(tag.id)}>
                      {tag.name} ({tag._count.resources} resources)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMergeDialogOpen(false)}
              disabled={isMerging}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={!mergeTargetId || isMerging}
            >
              {isMerging ? "Merging..." : "Merge Tags"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
