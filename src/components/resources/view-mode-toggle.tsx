"use client"

import { Grid3X3, List, Minus } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ViewMode } from "./resource-grid"

export interface ViewModeToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as ViewMode)
      }}
      variant="outline"
      aria-label="View mode"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <Grid3X3 className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="compact" aria-label="Compact view">
        <Minus className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
