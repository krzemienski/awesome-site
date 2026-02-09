"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

/**
 * Global error boundary for root layout errors.
 * This component renders when the root layout itself throws.
 * It must provide its own <html> and <body> tags with inline styles only
 * (no Tailwind, no external CSS, no layout imports).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0f",
          color: "#e4e4e7",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: "480px",
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 1.5rem",
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
            }}
          >
            !
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              margin: "0 0 0.5rem",
              letterSpacing: "-0.025em",
              color: "#f4f4f5",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: "#a1a1aa",
              margin: "0 0 2rem",
            }}
          >
            A critical error occurred while loading the page. Please try again
            or come back later.
          </p>

          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#0a0a0f",
              backgroundColor: "#f4f4f5",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.opacity = "0.9"
            }}
            onMouseOut={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.opacity = "1"
            }}
          >
            ↻ Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
