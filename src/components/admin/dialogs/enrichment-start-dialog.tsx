"use client"

import * as React from "react"
import { Play, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EnrichmentStartDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onStart: (filter: "all" | "unenriched") => void
  readonly isLoading?: boolean
}

export function EnrichmentStartDialog({
  open,
  onOpenChange,
  onStart,
  isLoading = false,
}: EnrichmentStartDialogProps) {
  const [filter, setFilter] = React.useState<"all" | "unenriched">("unenriched")

  function handleStart() {
    onStart(filter)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start AI Enrichment</DialogTitle>
          <DialogDescription>
            Run AI analysis on resources to generate metadata, tags, and
            descriptions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="enrichment-filter">
              Resource Filter
            </label>
            <Select
              value={filter}
              onValueChange={(value) => setFilter(value as "all" | "unenriched")}
            >
              <SelectTrigger id="enrichment-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unenriched">
                  Unenriched Only
                </SelectItem>
                <SelectItem value="all">All Resources</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {filter === "unenriched"
                ? "Only process resources that haven't been enriched yet."
                : "Re-process all resources, including previously enriched ones."}
            </p>
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
          <Button onClick={handleStart} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Play className="mr-2 size-4" />
            )}
            Start Enrichment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
