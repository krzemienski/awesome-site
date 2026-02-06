"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

import { DataTable } from "@/components/admin/data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { JourneyDialog } from "@/components/admin/dialogs/journey-dialog"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ── Types ──────────────────────────────────────────────────────────────────

interface Journey {
  readonly id: number
  readonly title: string
  readonly description: string
  readonly difficulty: string
  readonly category: string | null
  readonly estimatedDuration: string | null
  readonly status: string
  readonly featured: boolean
  readonly createdAt: string
  readonly _count: {
    readonly steps: number
    readonly enrollments: number
  }
}

interface JourneyFormData {
  readonly id?: number
  readonly title: string
  readonly description: string
  readonly difficulty: string
  readonly category: string
  readonly estimatedDuration: string
  readonly status?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-yellow-100 text-yellow-800",
}

// ── Main Component ─────────────────────────────────────────────────────────

export function LearningJourneysTab() {
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingJourney, setEditingJourney] = React.useState<JourneyFormData | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  // Fetch all journeys (admin sees all statuses)
  const {
    data: journeysData,
    isLoading,
    isError,
  } = useQuery<Journey[]>({
    queryKey: ["admin", "journeys"],
    queryFn: async () => {
      // Use the public endpoint but admin will eventually see all.
      // For now, fetch all via a broader query. Since no admin list endpoint exists,
      // we fetch published + draft + archived by using the public API.
      // Admin API routes are for CRUD only, list uses public route.
      const res = await fetch("/api/journeys?limit=200")
      if (!res.ok) throw new Error("Failed to fetch journeys")
      const json = await res.json()
      return json.data?.items ?? json.data ?? []
    },
    staleTime: 60_000,
  })

  const journeys = journeysData ?? []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: JourneyFormData) => {
      const res = await fetch("/api/admin/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          category: data.category,
          estimatedDuration: data.estimatedDuration || undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to create journey")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "journeys"] })
      setDialogOpen(false)
      setEditingJourney(null)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: JourneyFormData) => {
      const res = await fetch(`/api/admin/journeys/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          category: data.category,
          estimatedDuration: data.estimatedDuration || undefined,
          status: data.status,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to update journey")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "journeys"] })
      setDialogOpen(false)
      setEditingJourney(null)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/journeys/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to delete journey")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "journeys"] })
      setDeleteDialogOpen(false)
      setDeletingId(null)
    },
  })

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      const res = await fetch(`/api/admin/journeys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to toggle featured")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "journeys"] })
    },
  })

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/journeys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to update status")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "journeys"] })
    },
  })

  function handleCreate() {
    setEditingJourney(null)
    setDialogOpen(true)
  }

  function handleEdit(journey: Journey) {
    setEditingJourney({
      id: journey.id,
      title: journey.title,
      description: journey.description,
      difficulty: journey.difficulty,
      category: journey.category ?? "",
      estimatedDuration: journey.estimatedDuration ?? "",
      status: journey.status,
    })
    setDialogOpen(true)
  }

  function handleDelete(id: number) {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  function handleDialogSubmit(data: JourneyFormData) {
    if (data.id) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  function handleDeleteConfirm() {
    if (deletingId !== null) {
      deleteMutation.mutate(deletingId)
    }
  }

  // ── Columns ────────────────────────────────────────────────────────────

  const columns: ColumnDef<Journey, unknown>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate font-medium">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "difficulty",
      header: "Difficulty",
      cell: ({ row }) => {
        const d = row.original.difficulty
        return (
          <Badge className={DIFFICULTY_STYLES[d] ?? ""}>
            {d}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-0">
                <Badge className={STATUS_STYLES[s] ?? ""}>{s}</Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["draft", "published", "archived"].map((st) => (
                <DropdownMenuItem
                  key={st}
                  disabled={st === s || toggleStatusMutation.isPending}
                  onClick={() =>
                    toggleStatusMutation.mutate({ id: row.original.id, status: st })
                  }
                >
                  {st}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
    {
      id: "steps",
      header: "Steps",
      cell: ({ row }) => (
        <span className="text-sm">{row.original._count.steps}</span>
      ),
    },
    {
      id: "enrollments",
      header: "Enrollments",
      cell: ({ row }) => (
        <span className="text-sm">{row.original._count.enrollments}</span>
      ),
    },
    {
      accessorKey: "featured",
      header: "Featured",
      cell: ({ row }) => (
        <Switch
          checked={row.original.featured}
          onCheckedChange={(checked) =>
            toggleFeaturedMutation.mutate({
              id: row.original.id,
              featured: checked,
            })
          }
          disabled={toggleFeaturedMutation.isPending}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleEdit(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="size-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Learning Journeys</h1>
        <p className="text-destructive">
          Failed to load journeys. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Learning Journeys</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage guided learning paths with step tracking.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Create Journey
        </Button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={journeys}
        searchColumn="title"
        searchPlaceholder="Search journeys..."
      />

      {/* Create/Edit Dialog */}
      <JourneyDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingJourney(null)
        }}
        journey={editingJourney}
        onSubmit={handleDialogSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Journey"
        description="Are you sure you want to delete this journey? This will also remove all steps and enrollments."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
