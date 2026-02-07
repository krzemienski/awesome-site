"use client"

import * as React from "react"
import { Download, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

import type { ConflictStrategy } from "@/features/github/github-types"

interface ImportResult {
  readonly success: boolean
  readonly itemsAdded: number
  readonly itemsUpdated: number
  readonly itemsSkipped: number
  readonly conflicts: number
  readonly errors: ReadonlyArray<{ url: string; error: string }>
}

interface GithubImportDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onImport: (config: {
    conflictStrategy: ConflictStrategy
    autoApprove: boolean
  }) => void
  readonly isLoading: boolean
  readonly result: ImportResult | null
}

export function GithubImportDialog({
  open,
  onOpenChange,
  onImport,
  isLoading,
  result,
}: GithubImportDialogProps) {
  const [conflictStrategy, setConflictStrategy] =
    React.useState<ConflictStrategy>("skip")
  const [autoApprove, setAutoApprove] = React.useState(false)

  function handleImport() {
    onImport({ conflictStrategy, autoApprove })
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!isLoading) {
      onOpenChange(nextOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from GitHub</DialogTitle>
          <DialogDescription>
            Import resources from the configured awesome-list repository.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? "Import Complete" : "Import Failed"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3 text-center">
                <div className="text-lg font-bold text-green-600">
                  {result.itemsAdded}
                </div>
                <div className="text-muted-foreground text-xs">Added</div>
              </div>
              <div className="rounded-md border p-3 text-center">
                <div className="text-lg font-bold text-blue-600">
                  {result.itemsUpdated}
                </div>
                <div className="text-muted-foreground text-xs">Updated</div>
              </div>
              <div className="rounded-md border p-3 text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {result.itemsSkipped}
                </div>
                <div className="text-muted-foreground text-xs">Skipped</div>
              </div>
              <div className="rounded-md border p-3 text-center">
                <div className="text-lg font-bold text-red-600">
                  {result.conflicts}
                </div>
                <div className="text-muted-foreground text-xs">Conflicts</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-600">
                  Errors ({result.errors.length}):
                </p>
                <div className="max-h-32 overflow-y-auto rounded-md border p-2">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-500">
                      {e.url ? `${e.url}: ` : ""}
                      {e.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="conflict-strategy">Conflict Strategy</Label>
                <Select
                  value={conflictStrategy}
                  onValueChange={(v) =>
                    setConflictStrategy(v as ConflictStrategy)
                  }
                >
                  <SelectTrigger id="conflict-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">
                      Skip existing resources
                    </SelectItem>
                    <SelectItem value="update">
                      Update existing resources
                    </SelectItem>
                    <SelectItem value="create">
                      Create duplicates (conflicts)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  {conflictStrategy === "skip"
                    ? "Resources that already exist in the database will be skipped."
                    : conflictStrategy === "update"
                      ? "Existing resources will be updated with data from GitHub."
                      : "Existing resources will be flagged as conflicts."}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-approve">Auto-approve imports</Label>
                  <p className="text-muted-foreground text-xs">
                    Automatically approve imported resources without review.
                  </p>
                </div>
                <Switch
                  id="auto-approve"
                  checked={autoApprove}
                  onCheckedChange={setAutoApprove}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                Start Import
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
