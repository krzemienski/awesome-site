"use client"

import * as React from "react"
import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export interface ErrorDisplayProps {
  title?: string
  message: string
  retry?: () => void
}

function ErrorDisplay({ title = "Error", message, retry }: ErrorDisplayProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {retry && (
          <Button variant="outline" size="sm" onClick={retry} className="mt-3">
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export { ErrorDisplay }
