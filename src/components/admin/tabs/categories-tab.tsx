"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react"

import { DataTable, DataTableColumnHeader } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryDialog } from "@/components/admin/dialogs/category-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

interface AdminCategory {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  displayOrder: number
  _count: { resources: number; subcategories: number }
}

export function CategoriesTab() {
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<AdminCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<AdminCategory | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const { data, isLoading } = useQuery<{ success: boolean; data: AdminCategory[] }>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories")
      if (!res.ok) throw new Error("Failed to fetch categories")
      return res.json()
    },
    staleTime: 60_000,
  })

  const categories = data?.data ?? []

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
    queryClient.invalidateQueries({ queryKey: ["categories"] })
  }

  function handleCreate() {
    setEditItem(null)
    setDialogOpen(true)
  }

  function handleEdit(item: AdminCategory) {
    setEditItem(item)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to delete category")
      }
      invalidate()
      setDeleteTarget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: ColumnDef<AdminCategory>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium">
          {row.original.name}
        </div>
      ),
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
      accessorKey: "icon",
      header: "Icon",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.icon ?? "-"}</span>
      ),
    },
    {
      id: "resources",
      header: "Resources",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original._count.resources}</Badge>
      ),
    },
    {
      id: "subcategories",
      header: "Subcategories",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original._count.subcategories}</Badge>
      ),
    },
    {
      accessorKey: "displayOrder",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.displayOrder}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(item)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteTarget(item)}
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
    <div className="flex items-center gap-2">
      <Button onClick={handleCreate} size="sm" className="ml-auto">
        <Plus className="mr-1 size-4" />
        Add Category
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Top-level category management with CRUD operations.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        searchColumn="name"
        searchPlaceholder="Search categories..."
        isLoading={isLoading}
        toolbarContent={toolbarContent}
      />

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        level="category"
        item={editItem}
        onSuccess={invalidate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete Category"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone. Categories with resources or subcategories cannot be deleted.`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
