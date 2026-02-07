"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MoreHorizontal, ShieldAlert, ShieldCheck } from "lucide-react"

import {
  DataTable,
  DataTableColumnHeader,
} from "@/components/admin/data-table"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

interface AdminApiKey {
  readonly id: string
  readonly keyPrefix: string
  readonly name: string
  readonly tier: string
  readonly scopes: string[]
  readonly lastUsedAt: string | null
  readonly expiresAt: string | null
  readonly revokedAt: string | null
  readonly createdAt: string
  readonly userId: string
  readonly user: {
    readonly id: string
    readonly name: string
    readonly email: string
  }
}

interface ApiKeysResponse {
  readonly success: boolean
  readonly data: AdminApiKey[]
  readonly meta: {
    readonly total: number
    readonly page: number
    readonly limit: number
    readonly hasMore: boolean
  }
}

function tierBadgeVariant(tier: string) {
  switch (tier) {
    case "premium":
      return "default" as const
    case "standard":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

function getKeyStatus(key: AdminApiKey): "active" | "revoked" | "expired" {
  if (key.revokedAt) return "revoked"
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return "expired"
  return "active"
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const
    case "revoked":
      return "destructive" as const
    case "expired":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ApiKeysTab() {
  const queryClient = useQueryClient()

  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(20)
  const [tierFilter, setTierFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const [revokeTarget, setRevokeTarget] = React.useState<AdminApiKey | null>(
    null
  )
  const [tierChangeTarget, setTierChangeTarget] =
    React.useState<AdminApiKey | null>(null)
  const [newTier, setNewTier] = React.useState<string>("")

  const queryParams = new URLSearchParams()
  queryParams.set("page", String(page + 1))
  queryParams.set("limit", String(pageSize))
  if (tierFilter !== "all") queryParams.set("tier", tierFilter)
  if (statusFilter !== "all") queryParams.set("status", statusFilter)

  const { data, isLoading } = useQuery<ApiKeysResponse>({
    queryKey: ["admin-api-keys", page, pageSize, tierFilter, statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/api-keys?${queryParams.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch API keys")
      return res.json()
    },
    staleTime: 60_000,
  })

  const keys = data?.data ?? []
  const totalPages = data?.meta
    ? Math.ceil(data.meta.total / data.meta.limit)
    : 1

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to revoke key")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] })
      setRevokeTarget(null)
    },
  })

  const tierChangeMutation = useMutation({
    mutationFn: async ({
      keyId,
      tier,
    }: {
      keyId: string
      tier: string
    }) => {
      const res = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Failed to change tier")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] })
      setTierChangeTarget(null)
      setNewTier("")
    },
  })

  function openTierChange(key: AdminApiKey) {
    setTierChangeTarget(key)
    setNewTier(key.tier)
  }

  const columns: ColumnDef<AdminApiKey>[] = [
    {
      accessorKey: "keyPrefix",
      header: "Prefix",
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
          {row.original.keyPrefix}...
        </code>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate font-medium">
          {row.original.name}
        </span>
      ),
    },
    {
      id: "user",
      header: "User",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.user.email}
        </span>
      ),
    },
    {
      accessorKey: "tier",
      header: "Tier",
      cell: ({ row }) => (
        <Badge variant={tierBadgeVariant(row.original.tier)}>
          {row.original.tier}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getKeyStatus(row.original)
        return <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
      },
    },
    {
      id: "lastUsed",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Used" />
      ),
      accessorFn: (row) => row.lastUsedAt,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.lastUsedAt)}
        </span>
      ),
    },
    {
      id: "created",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      accessorFn: (row) => row.createdAt,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const key = row.original
        const status = getKeyStatus(key)
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openTierChange(key)}>
                <ShieldCheck className="mr-2 size-4" />
                Change Tier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setRevokeTarget(key)}
                disabled={status !== "active"}
                className="text-destructive"
              >
                <ShieldAlert className="mr-2 size-4" />
                Revoke
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const toolbarContent = (
    <div className="flex items-center gap-2">
      <Select value={tierFilter} onValueChange={setTierFilter}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tiers</SelectItem>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="premium">Premium</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="revoked">Revoked</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">API Keys</h1>
        <p className="text-sm text-muted-foreground">
          Manage API keys with tier-based rate limiting. View usage and revoke
          keys.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={keys}
        pageCount={totalPages}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
        searchColumn="name"
        searchPlaceholder="Search by name..."
        isLoading={isLoading}
        toolbarContent={toolbarContent}
      />

      {/* Revoke confirmation */}
      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null)
        }}
        title="Revoke API Key"
        description={
          revokeTarget
            ? `Are you sure you want to revoke "${revokeTarget.name}" (${revokeTarget.keyPrefix}...)? This action cannot be undone.`
            : ""
        }
        confirmLabel="Revoke"
        variant="destructive"
        isLoading={revokeMutation.isPending}
        onConfirm={() => {
          if (revokeTarget) {
            revokeMutation.mutate(revokeTarget.id)
          }
        }}
      />

      {/* Tier change dialog */}
      {tierChangeTarget && (
        <ConfirmDialog
          open={!!tierChangeTarget}
          onOpenChange={(open) => {
            if (!open) {
              setTierChangeTarget(null)
              setNewTier("")
            }
          }}
          title="Change API Key Tier"
          description={`Change tier for "${tierChangeTarget.name}" from ${tierChangeTarget.tier} to:`}
          confirmLabel="Update Tier"
          variant="default"
          isLoading={tierChangeMutation.isPending}
          onConfirm={() => {
            if (tierChangeTarget && newTier && newTier !== tierChangeTarget.tier) {
              tierChangeMutation.mutate({
                keyId: tierChangeTarget.id,
                tier: newTier,
              })
            }
          }}
        />
      )}
    </div>
  )
}
