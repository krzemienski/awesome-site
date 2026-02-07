"use client"

import * as React from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

type ExportFormat = "json" | "csv" | "markdown"

interface AdminCategory {
  id: number
  name: string
  slug: string
}

export function ExportTab() {
  const [format, setFormat] = React.useState<ExportFormat>("json")
  const [categoryId, setCategoryId] = React.useState<string>("all")

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<{
    success: boolean
    data: AdminCategory[]
  }>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories")
      if (!res.ok) throw new Error("Failed to fetch categories")
      return res.json()
    },
    staleTime: 60_000,
  })

  const categories = categoriesData?.data ?? []

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (format === "markdown") {
        const res = await fetch("/api/admin/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        if (!res.ok) throw new Error("Export failed")
        const json = await res.json() as { data: { markdown: string } }
        return {
          blob: new Blob([json.data.markdown], { type: "text/markdown; charset=utf-8" }),
          filename: "resources.md",
        }
      }

      const params = new URLSearchParams({ format })
      if (categoryId !== "all") {
        params.set("categoryId", categoryId)
      }

      const res = await fetch(`/api/admin/export?${params.toString()}`)
      if (!res.ok) throw new Error("Export failed")

      if (format === "csv") {
        const text = await res.text()
        return {
          blob: new Blob([text], { type: "text/csv; charset=utf-8" }),
          filename: "resources.csv",
        }
      }

      const json = await res.json()
      const jsonStr = JSON.stringify(json.data ?? json, null, 2)
      return {
        blob: new Blob([jsonStr], { type: "application/json; charset=utf-8" }),
        filename: "resources.json",
      }
    },
    onSuccess: (result) => {
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement("a")
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
  })

  if (categoriesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Export</h1>
        <p className="text-sm text-muted-foreground">
          Export resources in JSON, CSV, or Markdown format.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="size-5" />
            Export Resources
          </CardTitle>
          <CardDescription>
            Choose a format and optionally filter by category before exporting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format selector */}
          <div className="space-y-3">
            <Label>Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(val) => setFormat(val as ExportFormat)}
              className="flex flex-col gap-3 sm:flex-row sm:gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="json" id="format-json" />
                <Label htmlFor="format-json" className="flex items-center gap-1.5 cursor-pointer">
                  <FileJson className="size-4 text-muted-foreground" />
                  JSON
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label htmlFor="format-csv" className="flex items-center gap-1.5 cursor-pointer">
                  <FileSpreadsheet className="size-4 text-muted-foreground" />
                  CSV
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="markdown" id="format-markdown" />
                <Label htmlFor="format-markdown" className="flex items-center gap-1.5 cursor-pointer">
                  <FileText className="size-4 text-muted-foreground" />
                  Markdown
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Category filter (not applicable for markdown - whole export) */}
          {format !== "markdown" && (
            <div className="space-y-2">
              <Label htmlFor="category-filter">Category Filter</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category-filter" className="w-[280px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optionally filter exported resources by category.
              </p>
            </div>
          )}

          {/* Export button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              size="lg"
            >
              {exportMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              {exportMutation.isPending ? "Exporting..." : "Export"}
            </Button>
          </div>

          {/* Status messages */}
          {exportMutation.isSuccess && (
            <p className="text-sm text-green-600">
              Export downloaded successfully.
            </p>
          )}
          {exportMutation.isError && (
            <p className="text-sm text-destructive">
              Export failed. Please try again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
