"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { ResearchJobType } from "./types"
import { JOB_TYPE_LABELS, SCOPE_ESTIMATES } from "./helpers"

// ── Types ────────────────────────────────────────────────────────────────

interface JobConfig {
  readonly type: ResearchJobType
  readonly config: {
    readonly resourceLimit?: number
    readonly categoryFilter?: string
  }
}

interface JobCreationDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (job: JobConfig) => void
  readonly isLoading: boolean
  readonly hasActiveJob: boolean
}

// ── Constants ────────────────────────────────────────────────────────────

const JOB_TYPES = Object.entries(JOB_TYPE_LABELS) as ReadonlyArray<
  readonly [ResearchJobType, string]
>

// ── Component ────────────────────────────────────────────────────────────

export function JobCreationDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  hasActiveJob,
}: JobCreationDialogProps) {
  const [selectedType, setSelectedType] = useState<ResearchJobType>("validation")
  const [resourceLimit, setResourceLimit] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  const handleSubmit = useCallback(() => {
    const parsedLimit = Number(resourceLimit.trim())
    const trimmedCategory = categoryFilter.trim()

    const config: Record<string, unknown> = {
      ...(resourceLimit.trim() !== "" && !Number.isNaN(parsedLimit) && parsedLimit > 0
        ? { resourceLimit: parsedLimit }
        : {}),
      ...(trimmedCategory !== "" ? { categoryFilter: trimmedCategory } : {}),
    }

    onSubmit({
      type: selectedType,
      config,
    })

    toast.success("Research job started")

    setResourceLimit("")
    setCategoryFilter("")
  }, [selectedType, resourceLimit, categoryFilter, onSubmit])

  const handleTypeChange = useCallback((value: string) => {
    setSelectedType(value as ResearchJobType)
  }, [])

  const handleResourceLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setResourceLimit(e.target.value)
    },
    [],
  )

  const handleCategoryFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCategoryFilter(e.target.value)
    },
    [],
  )

  const isSubmitDisabled = hasActiveJob || isLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Research Job</DialogTitle>
          <DialogDescription>
            Choose a research type and configure optional parameters.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Job Type Selector */}
          <div className="grid gap-2">
            <Label htmlFor="job-type">Job Type</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a job type" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {SCOPE_ESTIMATES[selectedType]}
            </p>
          </div>

          {/* Resource Limit */}
          <div className="grid gap-2">
            <Label htmlFor="resource-limit">Resource Limit (optional)</Label>
            <Input
              id="resource-limit"
              type="number"
              min={1}
              placeholder="e.g. 100"
              value={resourceLimit}
              onChange={handleResourceLimitChange}
            />
          </div>

          {/* Category Filter */}
          <div className="grid gap-2">
            <Label htmlFor="category-filter">Category Filter (optional)</Label>
            <Input
              id="category-filter"
              type="text"
              placeholder="e.g. streaming"
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
            />
          </div>

          {/* Active Job Warning */}
          {hasActiveJob && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              A research job is already running. Wait for it to complete before
              starting another.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isLoading ? "Starting..." : "Start Research"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
