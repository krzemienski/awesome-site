"use client"

import { useState } from "react"
import { ChevronDown, History } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LinkHealthHistoryEntry } from "@/features/admin/link-health-service"

// ── Format Helpers ───────────────────────────────────────────────────────

function formatTimestamp(ts: string): string {
  const date = new Date(ts)
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// ── Component ────────────────────────────────────────────────────────────

interface JobHistoryProps {
  readonly history: readonly LinkHealthHistoryEntry[]
}

function JobHistory({ history }: JobHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (history.length === 0) {
    return null
  }

  const reversed = [...history].reverse()

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              Past Runs ({history.length})
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
                <span className="sr-only">Toggle history</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium text-right">Total</th>
                    <th className="pb-2 pr-4 font-medium text-right">Healthy</th>
                    <th className="pb-2 pr-4 font-medium text-right">Broken</th>
                    <th className="pb-2 font-medium text-right">Timeout</th>
                  </tr>
                </thead>
                <tbody>
                  {reversed.map((entry) => (
                    <tr
                      key={entry.timestamp}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {entry.totalChecked}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-green-600">
                        {entry.healthy}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-red-600">
                        {entry.broken}
                      </td>
                      <td className="py-2 text-right tabular-nums text-orange-600">
                        {entry.timeout}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export { JobHistory }
