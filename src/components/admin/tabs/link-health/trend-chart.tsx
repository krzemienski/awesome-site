"use client"

import {
  AreaChart,
  Area,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LinkHealthHistoryEntry } from "@/features/admin/link-health-service"

// ── Chart Config ─────────────────────────────────────────────────────────

const chartConfig: ChartConfig = {
  healthy: {
    label: "Healthy",
    color: "hsl(var(--chart-1))",
  },
  broken: {
    label: "Broken",
    color: "hsl(var(--chart-2))",
  },
  timeout: {
    label: "Timeout",
    color: "hsl(var(--chart-3))",
  },
}

// ── Format Helpers ───────────────────────────────────────────────────────

function formatTimestamp(ts: string): string {
  const date = new Date(ts)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ── Component ────────────────────────────────────────────────────────────

interface TrendChartProps {
  readonly history: readonly LinkHealthHistoryEntry[]
}

function TrendChart({ history }: TrendChartProps) {
  if (history.length < 2) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">
            Not enough data for trend chart
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Link Health Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart data={history as LinkHealthHistoryEntry[]}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTimestamp}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => formatTimestamp(String(label))}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="healthy"
              type="monotone"
              fill="var(--color-healthy)"
              stroke="var(--color-healthy)"
              fillOpacity={0.3}
              stackId="status"
            />
            <Area
              dataKey="broken"
              type="monotone"
              fill="var(--color-broken)"
              stroke="var(--color-broken)"
              fillOpacity={0.3}
              stackId="status"
            />
            <Area
              dataKey="timeout"
              type="monotone"
              fill="var(--color-timeout)"
              stroke="var(--color-timeout)"
              fillOpacity={0.3}
              stackId="status"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export { TrendChart }
