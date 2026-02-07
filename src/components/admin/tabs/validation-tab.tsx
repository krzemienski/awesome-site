"use client"

import * as React from "react"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import {
  CheckCircle,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/admin/data-table"

type Severity = "error" | "warning"

interface ValidationIssue {
  id: string
  line: number
  rule: string
  severity: Severity
  message: string
}

interface LintResult {
  valid: boolean
  errors: ReadonlyArray<{ line: number; rule: string; message: string }>
  warnings: ReadonlyArray<{ line: number; rule: string; message: string }>
}

interface ValidateResponse {
  success: boolean
  data: LintResult
}

function transformLintResult(result: LintResult): ReadonlyArray<ValidationIssue> {
  const errors: ReadonlyArray<ValidationIssue> = result.errors.map(
    (err, idx) => ({
      id: `error-${idx}`,
      line: err.line,
      rule: err.rule,
      severity: "error" as const,
      message: err.message,
    })
  )

  const warnings: ReadonlyArray<ValidationIssue> = result.warnings.map(
    (warn, idx) => ({
      id: `warning-${idx}`,
      line: warn.line,
      rule: warn.rule,
      severity: "warning" as const,
      message: warn.message,
    })
  )

  return [...errors, ...warnings]
}

function getUniqueIssueTypes(
  issues: ReadonlyArray<ValidationIssue>
): ReadonlyArray<string> {
  const types = new Set(issues.map((issue) => issue.rule))
  return Array.from(types).sort()
}

const severityBadgeVariant: Record<
  Severity,
  "destructive" | "secondary"
> = {
  error: "destructive",
  warning: "secondary",
}

const columns: ColumnDef<ValidationIssue, unknown>[] = [
  {
    accessorKey: "line",
    header: "Line",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.line}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "rule",
    header: "Issue Type",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.rule}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
      const severity = row.original.severity
      return (
        <Badge variant={severityBadgeVariant[severity]}>
          {severity === "error" ? (
            <XCircle className="mr-1 size-3" />
          ) : (
            <AlertTriangle className="mr-1 size-3" />
          )}
          {severity}
        </Badge>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.message}</span>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild>
        <a
          href={`#line-${row.original.line}`}
          title={`Go to line ${row.original.line}`}
        >
          <ExternalLink className="mr-1 size-3" />
          View
        </a>
      </Button>
    ),
    enableSorting: false,
  },
]

export function ValidationTab() {
  const [filterType, setFilterType] = React.useState<string>("all")

  const validateMutation = useMutation({
    mutationFn: async (): Promise<LintResult> => {
      // First fetch the current markdown export
      const exportRes = await fetch("/api/admin/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!exportRes.ok) throw new Error("Failed to fetch markdown for validation")
      const exportJson = (await exportRes.json()) as {
        data: { markdown: string }
      }

      // Then validate it
      const res = await fetch("/api/admin/export/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: exportJson.data.markdown }),
      })
      if (!res.ok) throw new Error("Validation request failed")
      const json = (await res.json()) as ValidateResponse
      return json.data
    },
    onError: () => toast.error("Validation failed"),
  })

  const allIssues = validateMutation.data
    ? transformLintResult(validateMutation.data)
    : []

  const issueTypes = getUniqueIssueTypes(allIssues)

  const filteredIssues =
    filterType === "all"
      ? allIssues
      : allIssues.filter((issue) => issue.rule === filterType)

  // Skeleton loading state while validation is running
  if (validateMutation.isPending) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Validation</h1>
          <p className="text-sm text-muted-foreground">
            Validating awesome-list markdown against lint rules...
          </p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Validation</h1>
        <p className="text-sm text-muted-foreground">
          Validate the awesome-list markdown against lint rules and best
          practices.
        </p>
      </div>

      {/* Run Validation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Awesome-Lint Validation
          </CardTitle>
          <CardDescription>
            Run validation checks against the current awesome-list export to
            find formatting issues, broken links, and missing sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => validateMutation.mutate()}
              disabled={validateMutation.isPending}
              size="lg"
            >
              {validateMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 size-4" />
              )}
              {validateMutation.isPending
                ? "Validating..."
                : "Run Validation"}
            </Button>

            {validateMutation.data && (
              <Badge
                variant={
                  validateMutation.data.valid ? "secondary" : "destructive"
                }
                className="text-sm"
              >
                {validateMutation.data.valid ? (
                  <>
                    <CheckCircle className="mr-1 size-3.5" />
                    Valid
                  </>
                ) : (
                  <>
                    <XCircle className="mr-1 size-3.5" />
                    {validateMutation.data.errors.length} error(s),{" "}
                    {validateMutation.data.warnings.length} warning(s)
                  </>
                )}
              </Badge>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Results */}
      {validateMutation.data && allIssues.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="size-12 text-green-500" />
            <h2 className="mt-4 text-lg font-semibold">
              No validation issues found
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your awesome-list passes all lint checks.
            </p>
          </CardContent>
        </Card>
      )}

      {validateMutation.data && allIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>
              {allIssues.length} issue(s) found across{" "}
              {issueTypes.length} rule(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={[...filteredIssues]}
              toolbarContent={
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Filter by issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Issue Types</SelectItem>
                    {issueTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
