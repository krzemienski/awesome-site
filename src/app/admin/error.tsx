"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, LayoutDashboard, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Container } from "@/components/layout/container"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin error:", error)
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
          An unexpected error occurred in the admin panel. You can try again or
          return to the dashboard.
        </p>
        <p className="text-sm text-muted-foreground">
          If this persists, check server logs.
        </p>
        {process.env.NODE_ENV === "development" && (
          <Card className="mt-2 max-w-lg">
            <CardContent className="px-4 py-2">
              <p className="text-sm text-muted-foreground font-mono break-all text-left">
                {error.message}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="size-4" />
          Try again
        </Button>
        <Button asChild>
          <Link href="/admin">
            <LayoutDashboard className="size-4" />
            Return to Dashboard
          </Link>
        </Button>
      </div>
    </Container>
  )
}
