"use client"

import { useEffect } from "react"

/**
 * Client component that fires a POST to /api/history on mount
 * to record a view for authenticated users. Fire and forget --
 * silently ignores errors (unauthenticated users get 401 which is fine).
 * Renders nothing.
 */
export function ViewTracker({ resourceId }: { resourceId: number }) {
  useEffect(() => {
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId }),
    }).catch(() => {})
  }, [resourceId])

  return null
}
