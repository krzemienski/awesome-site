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

interface AdminSubSubcategory {
  id: number
  name: string
  slug: string
  description: string | null
  displayOrder: number
  subcategoryId: number
  subcategory: {
    id: number
    name: string
    category: { id: number; name: string }
  }
  _count: { resources: number }
}

export function SubSubcategoriesTab() {
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<AdminSubSubcategory | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<AdminSubSubcategory | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const { data, isLoading } = useQuery<{ success: boolean; data: AdminSubSubcategory[] }>({
    queryKey: ["admin-sub-subcategories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sub-subcategories")
      if (!res.ok) throw new Error("Failed to fetch sub-subcategories")
      return res.json()
    },
    staleTime: 60_000,
  })

  const subSubcategories = data?.data ?? []

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-sub-subcategories"] })
    queryClient.invalidateQueries({ queryKey: ["categories"] })
  }

  function handleCreate() {
    setEditItem(null)
    setDialogOpen(true)
  }

  function handleEdit(item: AdminSubSubcategory) {
    setEditItem(item)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/sub-subcategories/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to delete sub-subcategory")
      }
      invalidate()
      setDeleteTarget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: ColumnDef<AdminSubSubcategory>[] = [
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
      id: "parentSubcategory",
      header: "Parent Subcategory",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.subcategory.name}</Badge>
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.subcategory.category.name}
        </span>
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
        Add Sub-subcategory
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Sub-subcategories</h1>
        <p className="text-sm text-muted-foreground">
          Third-level category management with parent subcategory association.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={subSubcategories}
        searchColumn="name"
        searchPlaceholder="Search sub-subcategories..."
        isLoading={isLoading}
        toolbarContent={toolbarContent}
      />

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        level="sub-subcategory"
        item={editItem ? {
          id: editItem.id,
          name: editItem.name,
          slug: editItem.slug,
          description: editItem.description,
          displayOrder: editItem.displayOrder,
          subcategoryId: editItem.subcategoryId,
          categoryId: editItem.subcategory.category.id,
        } : null}
        onSuccess={invalidate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete Sub-subcategory"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone. Sub-subcategories with resources cannot be deleted.`
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
