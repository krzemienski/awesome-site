// ── ReportViewer ─────────────────────────────────────────────────────────────
// Renders a JobReport as a structured Card with key-value pairs.
// Shows destructive Alert if the report contains an error.

import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { JobReport } from "./types"

interface ReportViewerProps {
  readonly report: JobReport | null
}

function ReportRow({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

export function ReportViewer({ report }: ReportViewerProps) {
  if (!report) {
    return null
  }

  const completedDate = new Date(report.completedAt)
  const formattedDate = completedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {report.error ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{report.error}</AlertDescription>
          </Alert>
        ) : null}

        <ReportRow label="Type" value={report.type} />
        <ReportRow
          label="Total Findings"
          value={String(report.totalFindings)}
        />
        <ReportRow label="Completed At" value={formattedDate} />
      </CardContent>
    </Card>
  )
}
