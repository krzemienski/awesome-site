"use client"

import { useQuery } from "@tanstack/react-query"
import { DollarSign, Cpu } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { StatCard } from "@/components/admin/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import type { ApiResponse } from "@/lib/api-response"
import type { CostBreakdownResponse, DailyCostEntry } from "./types"

// ── Chart Config ─────────────────────────────────────────────────────────

const MODEL_COLORS: Record<string, string> = {
  haiku: "hsl(var(--chart-1))",
  sonnet: "hsl(var(--chart-2))",
  opus: "hsl(var(--chart-3))",
}

function buildChartConfig(models: readonly string[]): ChartConfig {
  return Object.fromEntries(
    models.map((model) => [
      model,
      {
        label: model.charAt(0).toUpperCase() + model.slice(1),
        color: MODEL_COLORS[model] ?? "hsl(var(--chart-4))",
      },
    ])
  )
}

// ── Pivot Transform ──────────────────────────────────────────────────────

interface PivotedEntry {
  readonly date: string
  readonly [model: string]: number | string
}

function pivotDailyUsage(
  entries: readonly DailyCostEntry[]
): readonly PivotedEntry[] {
  const dateMap = new Map<string, Record<string, number>>()

  for (const entry of entries) {
    const existing = dateMap.get(entry.date) ?? {}
    dateMap.set(entry.date, {
      ...existing,
      [entry.model]: (existing[entry.model] ?? 0) + entry.estimatedCostUsd,
    })
  }

  return Array.from(dateMap.entries())
    .map(([date, models]) => ({ date, ...models }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ── Format Helpers ───────────────────────────────────────────────────────

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ── Sub-Components ──────────────────────────────────────────────────────

function ModelBreakdown({
  models,
  byModel,
}: {
  readonly models: readonly string[]
  readonly byModel: CostBreakdownResponse["byModel"]
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="size-4" />
          Model Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {models.map((model) => {
            const info = byModel[model]
            if (!info) return null
            return (
              <div
                key={model}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                <div
                  className="size-3 rounded-full"
                  style={{
                    backgroundColor:
                      MODEL_COLORS[model] ?? "hsl(var(--chart-4))",
                  }}
                />
                <div className="text-sm">
                  <span className="font-medium capitalize">{model}</span>
                  <span className="text-muted-foreground ml-2">
                    {formatUsd(info.estimatedCostUsd)}
                  </span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {info.requestCount.toLocaleString()} requests
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function DailyCostChart({
  pivotedData,
  models,
  chartConfig,
}: {
  readonly pivotedData: readonly PivotedEntry[]
  readonly models: readonly string[]
  readonly chartConfig: ChartConfig
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Daily Cost by Model</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={pivotedData as PivotedEntry[]}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatDateLabel}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              fontSize={12}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) =>
                    formatDateLabel(String(label))
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {models.map((model) => (
              <Bar
                key={model}
                dataKey={model}
                stackId="cost"
                fill={`var(--color-${model})`}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// ── Main Component ──────────────────────────────────────────────────────

function CostDashboard() {
  const { data, isLoading } = useQuery<ApiResponse<CostBreakdownResponse>>({
    queryKey: ["admin", "research", "costs"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/research/costs?days=30")
        if (!res.ok) throw new Error("Failed to fetch cost data")
        return res.json()
      } catch (error) {
        throw new Error(
          `Cost data fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      }
    },
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const costData = data?.data
  if (!costData || costData.dailyUsage.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No cost data yet</p>
        </CardContent>
      </Card>
    )
  }

  const pivotedData = pivotDailyUsage(costData.dailyUsage)
  const models = Object.keys(costData.byModel)
  const chartConfig = buildChartConfig(models)

  return (
    <div className="space-y-4">
      <StatCard
        label="Total Cost (30 days)"
        value={formatUsd(costData.totalCost)}
        icon={<DollarSign className="size-4" />}
      />
      <ModelBreakdown models={models} byModel={costData.byModel} />
      <DailyCostChart
        pivotedData={pivotedData}
        models={models}
        chartConfig={chartConfig}
      />
    </div>
  )
}

export { CostDashboard }
