"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, Home, RotateCcw } from "lucide-react"
import * as Sentry from "@sentry/nextjs"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"

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
    <Container className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-8 text-destructive" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight font-heading">
          Something went wrong
        </h1>
        <p className="max-w-md text-muted-foreground">
          An unexpected error occurred. You can try again or return to the home
          page.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="mt-2 max-w-lg rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground font-mono break-all">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="size-4" />
          Try again
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="size-4" />
            Go Home
          </Link>
        </Button>
      </div>
    </Container>
  )
}
