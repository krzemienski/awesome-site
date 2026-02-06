"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Activity,
  Heart,
  Globe,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
]

interface TopViewedItem {
  readonly id: number
  readonly title: string
  readonly views: number
}

interface MostFavoritedItem {
  readonly id: number
  readonly title: string
  readonly favorites: number
}

interface DateCount {
  readonly date: string
  readonly count: number
}

interface CategoryDist {
  readonly name: string
  readonly count: number
}

interface ApiUsageItem {
  readonly endpoint: string
  readonly method: string
  readonly requests: number
  readonly avgResponseTime: number
}

interface AnalyticsData {
  readonly topViewed: readonly TopViewedItem[]
  readonly mostFavorited: readonly MostFavoritedItem[]
  readonly userGrowth: readonly DateCount[]
  readonly submissionTrends: readonly DateCount[]
  readonly categoryDistribution: readonly CategoryDist[]
  readonly apiUsage: readonly ApiUsageItem[]
  readonly days: number
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[380px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function EmptyChart({ message }: { readonly message: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function truncateLabel(label: string, maxLen = 20): string {
  return label.length > maxLen ? label.slice(0, maxLen) + "..." : label
}

function TopViewedChart({ data }: { readonly data: readonly TopViewedItem[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No view data for this period" />
  }

  const chartData = data.map((item) => ({
    ...item,
    shortTitle: truncateLabel(item.title),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" />
        <YAxis type="category" dataKey="shortTitle" width={140} tick={{ fontSize: 12 }} />
        <Tooltip
          labelFormatter={(label: string) => label}
          content={({ payload }) => {
            if (!payload || payload.length === 0) return null
            const item = payload[0]?.payload as TopViewedItem | undefined
            return (
              <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-sm shadow-md">
                <p className="font-medium">{item?.title}</p>
                <p className="text-muted-foreground">{item?.views} views</p>
              </div>
            )
          }}
        />
        <Bar dataKey="views" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function MostFavoritedChart({ data }: { readonly data: readonly MostFavoritedItem[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No favorite data for this period" />
  }

  const chartData = data.map((item) => ({
    ...item,
    shortTitle: truncateLabel(item.title),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" />
        <YAxis type="category" dataKey="shortTitle" width={140} tick={{ fontSize: 12 }} />
        <Tooltip
          content={({ payload }) => {
            if (!payload || payload.length === 0) return null
            const item = payload[0]?.payload as MostFavoritedItem | undefined
            return (
              <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-sm shadow-md">
                <p className="font-medium">{item?.title}</p>
                <p className="text-muted-foreground">{item?.favorites} favorites</p>
              </div>
            )
          }}
        />
        <Bar dataKey="favorites" fill={COLORS[5]} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function UserGrowthChart({ data }: { readonly data: readonly DateCount[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No user registration data for this period" />
  }

  const chartData = data.map((item) => ({
    ...item,
    label: formatDateLabel(item.date),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} />
        <Tooltip
          content={({ payload }) => {
            if (!payload || payload.length === 0) return null
            const item = payload[0]?.payload as DateCount | undefined
            return (
              <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-sm shadow-md">
                <p className="font-medium">{item?.date}</p>
                <p className="text-muted-foreground">{item?.count} new users</p>
              </div>
            )
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke={COLORS[1]}
          strokeWidth={2}
          dot={{ r: 3 }}
          name="New Users"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function SubmissionTrendChart({ data }: { readonly data: readonly DateCount[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No submission data for this period" />
  }

  const chartData = data.map((item) => ({
    ...item,
    label: formatDateLabel(item.date),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} />
        <Tooltip
          content={({ payload }) => {
            if (!payload || payload.length === 0) return null
            const item = payload[0]?.payload as DateCount | undefined
            return (
              <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-sm shadow-md">
                <p className="font-medium">{item?.date}</p>
                <p className="text-muted-foreground">{item?.count} submissions</p>
              </div>
            )
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={COLORS[2]}
          fill={COLORS[2]}
          fillOpacity={0.2}
          strokeWidth={2}
          name="Submissions"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function CategoryDistributionChart({ data }: { readonly data: readonly CategoryDist[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No category data available" />
  }

  const chartData = [...data]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={2}
          label={({ name, percent }: { name: string; percent: number }) =>
            `${truncateLabel(name, 15)} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

function ApiUsageChart({ data }: { readonly data: readonly ApiUsageItem[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No API usage data for this period" />
  }

  const chartData = data.map((item) => ({
    ...item,
    label: `${item.method} ${truncateLabel(item.endpoint, 25)}`,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" />
        <YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 11 }} />
        <Tooltip
          content={({ payload }) => {
            if (!payload || payload.length === 0) return null
            const item = payload[0]?.payload as ApiUsageItem | undefined
            return (
              <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-sm shadow-md">
                <p className="font-medium">{item?.method} {item?.endpoint}</p>
                <p className="text-muted-foreground">{item?.requests} requests</p>
                <p className="text-muted-foreground">{item?.avgResponseTime}ms avg</p>
              </div>
            )
          }}
        />
        <Bar dataKey="requests" fill={COLORS[6]} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AnalyticsTab() {
  const [days, setDays] = React.useState<string>("30")

  const { data, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ["admin", "analytics", { days }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?days=${days}`)
      if (!res.ok) {
        throw new Error("Failed to fetch analytics")
      }
      const json = await res.json()
      return json.data as AnalyticsData
    },
    staleTime: 60_000,
  })

  if (isLoading) {
    return <AnalyticsSkeleton />
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        <p className="text-destructive">
          Failed to load analytics data. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with time window selector */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Time window" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Viewed Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="size-5" />
              Top Viewed Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopViewedChart data={data.topViewed} />
          </CardContent>
        </Card>

        {/* Most Favorited Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="size-5" />
              Most Favorited Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MostFavoritedChart data={data.mostFavorited} />
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserGrowthChart data={data.userGrowth} />
          </CardContent>
        </Card>

        {/* Submission Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="size-5" />
              Submission Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubmissionTrendChart data={data.submissionTrends} />
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChartIcon className="size-5" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDistributionChart data={data.categoryDistribution} />
          </CardContent>
        </Card>

        {/* API Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="size-5" />
              API Usage by Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApiUsageChart data={data.apiUsage} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
