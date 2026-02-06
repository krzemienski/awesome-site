"use client"

import { useCallback, useSyncExternalStore } from "react"
import type { ViewMode } from "@/components/resources/resource-grid"

const STORAGE_KEY = "resource-view-mode"
const DEFAULT_MODE: ViewMode = "grid"
const VALID_MODES: ViewMode[] = ["grid", "list", "compact"]

function isValidMode(value: unknown): value is ViewMode {
  return typeof value === "string" && VALID_MODES.includes(value as ViewMode)
}

function getSnapshot(): ViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isValidMode(stored)) {
      return stored
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_MODE
}

function getServerSnapshot(): ViewMode {
  return DEFAULT_MODE
}

function subscribe(callback: () => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback()
    }
  }
  window.addEventListener("storage", handler)
  // Also listen for custom event for same-tab updates
  window.addEventListener("viewmode-change", callback)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener("viewmode-change", callback)
  }
}

/**
 * Persist view mode to localStorage.
 * Returns [viewMode, setViewMode] tuple.
 * Defaults to "grid" when no stored preference exists.
 */
export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const viewMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setViewMode = useCallback((mode: ViewMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // localStorage unavailable
    }
    // Trigger re-render for same-tab listeners
    window.dispatchEvent(new Event("viewmode-change"))
  }, [])

  return [viewMode, setViewMode]
}
