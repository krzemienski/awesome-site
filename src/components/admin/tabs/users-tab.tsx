"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  MoreHorizontal,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle,
  Search,
} from "lucide-react"

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Label } from "@/components/ui/label"

interface AdminUser {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly image: string | null
  readonly role: string
  readonly banned: boolean
  readonly banReason: string | null
  readonly banExpires: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

interface UsersResponse {
  readonly success: boolean
  readonly data: AdminUser[]
  readonly meta: {
    readonly total: number
    readonly page: number
    readonly limit: number
    readonly hasMore: boolean
  }
}

function roleBadgeVariant(role: string) {
  switch (role) {
    case "admin":
      return "default" as const
    default:
      return "secondary" as const
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function UsersTab() {
  const queryClient = useQueryClient()

  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(20)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState("")

  const [profileUser, setProfileUser] = React.useState<AdminUser | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const [banDialogOpen, setBanDialogOpen] = React.useState(false)
  const [banTarget, setBanTarget] = React.useState<AdminUser | null>(null)
  const [banReason, setBanReason] = React.useState("")

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  React.useEffect(() => {
    setPage(0)
  }, [debouncedSearch, roleFilter, pageSize])

  const queryParams = React.useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page + 1))
    params.set("limit", String(pageSize))
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (roleFilter && roleFilter !== "all") params.set("role", roleFilter)
    return params.toString()
  }, [page, pageSize, debouncedSearch, roleFilter])

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ["admin-users", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?${queryParams}`)
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
    staleTime: 60_000,
  })

  const users = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  function invalidateUsers() {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] })
  }

  const roleChangeMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to change role")
      }
      return res.json()
    },
    onSuccess: invalidateUsers,
  })

  const banMutation = useMutation({
    mutationFn: async ({
      userId,
      action,
      reason,
    }: {
      userId: string
      action: "ban" | "unban"
      reason?: string
    }) => {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to ban/unban user")
      }
      return res.json()
    },
    onSuccess: () => {
      invalidateUsers()
      setBanDialogOpen(false)
      setBanTarget(null)
      setBanReason("")
    },
  })

  function handleRoleChange(user: AdminUser, newRole: string) {
    if (newRole === user.role) return
    roleChangeMutation.mutate({ userId: user.id, role: newRole })
  }

  function handleBanClick(user: AdminUser) {
    setBanTarget(user)
    setBanReason("")
    setBanDialogOpen(true)
  }

  function handleBanConfirm() {
    if (!banTarget) return
    banMutation.mutate({
      userId: banTarget.id,
      action: "ban",
      reason: banReason || undefined,
    })
  }

  function handleUnban(user: AdminUser) {
    banMutation.mutate({ userId: user.id, action: "unban" })
  }

  function handleViewProfile(user: AdminUser) {
    setProfileUser(user)
    setSheetOpen(true)
  }

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarImage src={row.original.image ?? undefined} alt={row.original.name} />
            <AvatarFallback className="text-xs">
              {getInitials(row.original.name)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[150px] truncate font-medium">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="max-w-[180px] truncate text-sm text-muted-foreground">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={roleBadgeVariant(row.original.role)}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.banned ? (
          <Badge variant="destructive">Banned</Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-green-500/15 text-green-700 dark:text-green-400"
          >
            Active
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
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Last Active",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.updatedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewProfile(u)}>
                <Search className="mr-2 size-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {u.role === "user" ? (
                <DropdownMenuItem onClick={() => handleRoleChange(u, "admin")}>
                  <Shield className="mr-2 size-4" />
                  Promote to Admin
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleRoleChange(u, "user")}>
                  <ShieldOff className="mr-2 size-4" />
                  Demote to User
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {u.banned ? (
                <DropdownMenuItem onClick={() => handleUnban(u)}>
                  <CheckCircle className="mr-2 size-4" />
                  Unban User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleBanClick(u)}
                  className="text-destructive"
                >
                  <Ban className="mr-2 size-4" />
                  Ban User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const toolbarContent = (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-[220px]"
      />
      <Select value={roleFilter} onValueChange={setRoleFilter}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="All roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage users, change roles, and handle bans.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={users}
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

      {/* Ban Confirm Dialog */}
      <ConfirmDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        title={`Ban ${banTarget?.name ?? "user"}?`}
        description="This will prevent the user from accessing the platform. You can unban them later."
        confirmLabel="Ban User"
        variant="destructive"
        isLoading={banMutation.isPending}
        onConfirm={handleBanConfirm}
      />

      {/* Profile Side Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>User Profile</SheetTitle>
            <SheetDescription>
              Detailed information about the selected user.
            </SheetDescription>
          </SheetHeader>
          {profileUser && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage
                    src={profileUser.image ?? undefined}
                    alt={profileUser.name}
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials(profileUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{profileUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {profileUser.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <div className="mt-1">
                    <Badge variant={roleBadgeVariant(profileUser.role)}>
                      {profileUser.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <div className="mt-1">
                    {profileUser.banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-green-500/15 text-green-700 dark:text-green-400"
                      >
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Created
                  </Label>
                  <p className="mt-1 text-sm">
                    {formatDate(profileUser.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Last Active
                  </Label>
                  <p className="mt-1 text-sm">
                    {formatDate(profileUser.updatedAt)}
                  </p>
                </div>
              </div>

              {profileUser.banned && profileUser.banReason && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Ban Reason
                  </Label>
                  <p className="mt-1 text-sm">{profileUser.banReason}</p>
                </div>
              )}

              {profileUser.banned && profileUser.banExpires && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Ban Expires
                  </Label>
                  <p className="mt-1 text-sm">
                    {formatDate(profileUser.banExpires)}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {profileUser.role === "user" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleRoleChange(profileUser, "admin")
                      setSheetOpen(false)
                    }}
                  >
                    <Shield className="mr-1 size-4" />
                    Promote to Admin
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleRoleChange(profileUser, "user")
                      setSheetOpen(false)
                    }}
                  >
                    <ShieldOff className="mr-1 size-4" />
                    Demote to User
                  </Button>
                )}
                {profileUser.banned ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleUnban(profileUser)
                      setSheetOpen(false)
                    }}
                  >
                    <CheckCircle className="mr-1 size-4" />
                    Unban
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      handleBanClick(profileUser)
                      setSheetOpen(false)
                    }}
                  >
                    <Ban className="mr-1 size-4" />
                    Ban
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
