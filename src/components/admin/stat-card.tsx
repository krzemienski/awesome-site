"use client"

import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; label: string }
  className?: string
}

function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  const isPositive = trend ? trend.value >= 0 : undefined

  return (
    <Card className={cn("gap-4 py-4", className)}>
      <CardContent className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            {icon}
            {label}
          </div>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {isPositive ? (
                <TrendingUp className="size-3.5 text-green-500" />
              ) : (
                <TrendingDown className="size-3.5 text-red-500" />
              )}
              <span className={cn(isPositive ? "text-green-500" : "text-red-500")}>
                {isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { StatCard }
