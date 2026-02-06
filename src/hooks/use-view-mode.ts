"use client"

import { useState, useEffect, useCallback } from "react"
import type { ViewMode } from "@/components/resources/resource-grid"

const STORAGE_KEY = "resource-view-mode"
const DEFAULT_MODE: ViewMode = "grid"
const VALID_MODES: ViewMode[] = ["grid", "list", "compact"]

function isValidMode(value: unknown): value is ViewMode {
  return typeof value === "string" && VALID_MODES.includes(value as ViewMode)
}

/**
 * Persist view mode to localStorage.
 * Returns [viewMode, setViewMode] tuple.
 * Defaults to "grid" when no stored preference exists.
 */
export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>(DEFAULT_MODE)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (isValidMode(stored)) {
        setViewModeState(stored)
      }
    } catch {
      // localStorage unavailable (SSR or privacy mode)
    }
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // localStorage unavailable
    }
  }, [])

  return [viewMode, setViewMode]
}
