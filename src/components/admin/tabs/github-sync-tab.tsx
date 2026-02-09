"use client"

import * as React from "react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  GitBranch,
  Github,
  Upload,
  Download,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Settings,
  Star,
  ExternalLink,
} from "lucide-react"

import { GithubImportDialog } from "@/components/admin/dialogs/github-import-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { ConflictStrategy } from "@/features/github/github-types"

// ── Types ──────────────────────────────────────────────────────────────────

interface GithubConfig {
  readonly id: number | null
  readonly repoOwner: string
  readonly repoName: string
  readonly branch: string
  readonly filePath: string
  readonly token: string
  readonly syncEnabled: boolean
  readonly lastSyncAt: string | null
}

interface SyncHistoryEntry {
  readonly id: number
  readonly listId: number
  readonly action: string
  readonly status: string
  readonly itemsAdded: number
  readonly itemsUpdated: number
  readonly itemsSkipped: number
  readonly conflicts: number
  readonly errorLog: unknown
  readonly createdAt: string
  readonly list: { readonly repoOwner: string; readonly repoName: string }
}

interface SyncStatus {
  readonly status: string
  readonly queueEntry: unknown
}

interface ImportResult {
  readonly success: boolean
  readonly itemsAdded: number
  readonly itemsUpdated: number
  readonly itemsSkipped: number
  readonly conflicts: number
  readonly errors: Array<{ url: string; error: string }>
}

interface SearchResult {
  readonly fullName: string
  readonly description: string | null
  readonly url: string
  readonly stars: number
  readonly topics: readonly string[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-500/15 text-green-700 dark:text-green-400"
    case "completed_with_errors":
      return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
    case "failed":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    case "importing":
    case "exporting":
    case "processing":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
    default:
      return "bg-gray-500/15 text-gray-700 dark:text-gray-400"
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 text-green-600" />
    case "completed_with_errors":
      return <AlertTriangle className="size-4 text-yellow-600" />
    case "failed":
      return <XCircle className="size-4 text-red-600" />
    case "importing":
    case "exporting":
    case "processing":
      return <Loader2 className="size-4 animate-spin text-blue-600" />
    case "idle":
      return <Clock className="size-4 text-gray-500" />
    default:
      return null
  }
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function GithubSyncSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function GithubSyncTab() {
  const queryClient = useQueryClient()

  // ── Config form state ──
  const [repoOwner, setRepoOwner] = React.useState("")
  const [repoName, setRepoName] = React.useState("")
  const [branch, setBranch] = React.useState("main")
  const [filePath, setFilePath] = React.useState("README.md")
  const [token, setToken] = React.useState("")
  const [syncEnabled, setSyncEnabled] = React.useState(false)

  // ── Dialog state ──
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false)
  const [importResult, setImportResult] = React.useState<ImportResult | null>(
    null
  )

  // ── Search state ──
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ── Config query ──
  const {
    data: configData,
    isLoading: configLoading,
    isError: configError,
  } = useQuery<{ data: GithubConfig }>({
    queryKey: ["admin", "github", "config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/github/config")
      if (!res.ok) throw new Error("Failed to fetch config")
      return res.json()
    },
    staleTime: 60_000,
  })

  // Sync form state when config loads
  const configDataRef = React.useRef<GithubConfig | null>(null)
  React.useEffect(() => {
    const cfg = configData?.data
    if (cfg && cfg !== configDataRef.current) {
      configDataRef.current = cfg
      setRepoOwner(cfg.repoOwner)
      setRepoName(cfg.repoName)
      setBranch(cfg.branch)
      setFilePath(cfg.filePath)
      setToken(cfg.token)
      setSyncEnabled(cfg.syncEnabled)
    }
  }, [configData])

  const config = configData?.data ?? null
  const listId = config?.id ?? null

  // ── Status query ──
  const { data: statusData } = useQuery<{ data: SyncStatus }>({
    queryKey: ["admin", "github", "status", listId],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/github/status?listId=${listId}`
      )
      if (!res.ok) throw new Error("Failed to fetch status")
      return res.json()
    },
    enabled: listId !== null,
    refetchInterval: 10_000,
  })

  const syncStatus = statusData?.data?.status ?? "idle"

  // ── History query ──
  const { data: historyData, isLoading: historyLoading } = useQuery<{
    data: { items: SyncHistoryEntry[]; total: number }
  }>({
    queryKey: ["admin", "github", "history", listId],
    queryFn: async () => {
      const url = listId
        ? `/api/admin/github/history?listId=${listId}&limit=20`
        : "/api/admin/github/history?limit=20"
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch history")
      return res.json()
    },
    staleTime: 30_000,
  })

  const historyItems = historyData?.data?.items ?? []

  // ── Search query ──
  const { data: searchData, isFetching: searchFetching } = useQuery<{
    data: SearchResult[]
  }>({
    queryKey: ["admin", "github", "search", debouncedSearch],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/github/search?q=${encodeURIComponent(debouncedSearch)}`
      )
      if (!res.ok) throw new Error("Failed to search")
      return res.json()
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 60_000,
  })

  const searchResults = searchData?.data ?? []

  // ── Save config mutation ──
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      // Validate token format if provided
      if (token.trim().length > 0) {
        const tokenPrefixes = ["ghp_", "github_pat_", "gho_", "ghu_", "ghs_", "ghr_"]
        const hasValidPrefix = tokenPrefixes.some((prefix) =>
          token.startsWith(prefix)
        )
        if (!hasValidPrefix) {
          toast.warning(
            "Token doesn't match expected GitHub format (ghp_*, github_pat_*, etc.). Saving anyway - verify if issues occur."
          )
        }
      }

      const res = await fetch("/api/admin/github/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoOwner,
          repoName,
          branch,
          filePath,
          token: token || undefined,
          syncEnabled,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to save config")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Configuration saved")
      queryClient.invalidateQueries({
        queryKey: ["admin", "github", "config"],
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // ── Import mutation ──
  const importMutation = useMutation({
    mutationFn: async (params: {
      conflictStrategy: ConflictStrategy
      autoApprove: boolean
    }) => {
      const res = await fetch("/api/admin/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId,
          ...params,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Import failed")
      }
      return res.json()
    },
    onSuccess: (data) => {
      setImportResult(data.data as ImportResult)
      queryClient.invalidateQueries({
        queryKey: ["admin", "github", "history"],
      })
      queryClient.invalidateQueries({
        queryKey: ["admin", "github", "status"],
      })
    },
  })

  // ── Export mutation ──
  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/github/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Export failed")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Export completed successfully")
      queryClient.invalidateQueries({
        queryKey: ["admin", "github", "history"],
      })
      queryClient.invalidateQueries({
        queryKey: ["admin", "github", "status"],
      })
      setExportDialogOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // ── Handlers ──
  function handleImport(params: {
    conflictStrategy: ConflictStrategy
    autoApprove: boolean
  }) {
    importMutation.mutate(params)
  }

  function handleExportConfirm() {
    exportMutation.mutate()
  }

  function handleImportDialogOpen() {
    setImportResult(null)
    setImportDialogOpen(true)
  }

  if (configLoading) {
    return <GithubSyncSkeleton />
  }

  if (configError) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">GitHub Sync</h1>
        <p className="text-destructive">
          Failed to load GitHub sync configuration. Please try again.
        </p>
      </div>
    )
  }

  const isBusy =
    syncStatus === "importing" ||
    syncStatus === "exporting" ||
    importMutation.isPending ||
    exportMutation.isPending
  const hasConfig = listId !== null && repoOwner.length > 0 && repoName.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">GitHub Sync</h1>
        <p className="text-muted-foreground text-sm">
          Import and export resources from GitHub awesome lists.
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="size-5" />
            <CardTitle className="text-lg">Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure the GitHub repository to sync with.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="repo-owner">Repository Owner</Label>
              <Input
                id="repo-owner"
                placeholder="sindresorhus"
                value={repoOwner}
                onChange={(e) => setRepoOwner(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-name">Repository Name</Label>
              <Input
                id="repo-name"
                placeholder="awesome"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <div className="flex items-center gap-2">
                <GitBranch className="text-muted-foreground size-4" />
                <Input
                  id="branch"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-path">File Path</Label>
              <Input
                id="file-path"
                placeholder="README.md"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="github-token">GitHub Token (optional)</Label>
            <Input
              id="github-token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Required for private repos and to avoid rate limits. Leave empty
              for public repos.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="sync-enabled">Auto-sync enabled</Label>
              <p className="text-muted-foreground text-xs">
                Automatic scheduling coming soon.
              </p>
            </div>
            <Switch
              id="sync-enabled"
              checked={syncEnabled}
              onCheckedChange={setSyncEnabled}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => saveConfigMutation.mutate()}
              disabled={
                saveConfigMutation.isPending ||
                repoOwner.length === 0 ||
                repoName.length === 0
              }
            >
              {saveConfigMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Github className="size-5" />
            <CardTitle className="text-lg">Actions</CardTitle>
          </div>
          <CardDescription>
            Import resources from or export to GitHub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {statusIcon(syncStatus)}
              <Badge className={statusColor(syncStatus)}>{syncStatus}</Badge>
            </div>
            {config?.lastSyncAt && (
              <span className="text-muted-foreground text-sm">
                Last synced: {formatTimeAgo(config.lastSyncAt)}
              </span>
            )}
          </div>

          <Separator />

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleImportDialogOpen}
              disabled={!hasConfig || isBusy}
            >
              {importMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Import from GitHub
            </Button>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(true)}
              disabled={!hasConfig || isBusy}
            >
              {exportMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Upload className="mr-2 size-4" />
              )}
              Export to GitHub
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                queryClient.invalidateQueries({
                  queryKey: ["admin", "github"],
                })
              }}
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>

          {!hasConfig && (
            <p className="text-muted-foreground text-sm">
              Save a valid configuration above before importing or exporting.
            </p>
          )}

        </CardContent>
      </Card>

      {/* Sync History Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="size-5" />
            <CardTitle className="text-lg">Sync History</CardTitle>
          </div>
          <CardDescription>
            Recent import and export operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : historyItems.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No sync history yet. Import or export to get started.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Skipped</TableHead>
                    <TableHead>Conflicts</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyItems.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {entry.action === "import" ? (
                            <Download className="mr-1 size-3" />
                          ) : (
                            <Upload className="mr-1 size-3" />
                          )}
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor(entry.status)}>
                          <span className="mr-1 inline-flex">
                            {statusIcon(entry.status)}
                          </span>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-green-600">
                        {entry.itemsAdded}
                      </TableCell>
                      <TableCell className="text-sm text-blue-600">
                        {entry.itemsUpdated}
                      </TableCell>
                      <TableCell className="text-sm text-yellow-600">
                        {entry.itemsSkipped}
                      </TableCell>
                      <TableCell className="text-sm text-red-600">
                        {entry.conflicts}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatTimeAgo(entry.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="size-5" />
            <CardTitle className="text-lg">Find Awesome Lists</CardTitle>
          </div>
          <CardDescription>
            Search GitHub for awesome lists to import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Search awesome lists (e.g. react, python, devops)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchFetching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}

          {!searchFetching && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.fullName}
                  className="flex items-start justify-between rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Github className="size-4 shrink-0" />
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-medium hover:underline"
                      >
                        {result.fullName}
                        <ExternalLink className="ml-1 inline size-3" />
                      </a>
                    </div>
                    {result.description && (
                      <p className="text-muted-foreground truncate text-sm">
                        {result.description}
                      </p>
                    )}
                    {result.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.topics.slice(0, 5).map((topic) => (
                          <Badge
                            key={topic}
                            variant="secondary"
                            className="text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-1 text-sm">
                    <Star className="size-3.5 text-yellow-500" />
                    <span>{result.stars.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchFetching &&
            debouncedSearch.length >= 2 &&
            searchResults.length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No awesome lists found for &ldquo;{debouncedSearch}&rdquo;.
              </p>
            )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <GithubImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImport}
        isLoading={importMutation.isPending}
        result={importResult}
      />

      {/* Export Confirmation */}
      <ConfirmDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        title="Export to GitHub"
        description="This will generate a markdown file from your resources and push it to the configured GitHub repository. Existing content will be overwritten."
        confirmLabel="Export"
        isLoading={exportMutation.isPending}
        onConfirm={handleExportConfirm}
      />
    </div>
  )
}
