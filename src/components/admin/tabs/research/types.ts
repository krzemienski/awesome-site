// ── Research Tab Types ─────────────────────────────────────────────────────

export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"

export type ResearchJobType =
  | "validation"
  | "enrichment"
  | "discovery"
  | "trend_analysis"
  | "comprehensive"

export interface ResearchJob {
  readonly id: number
  readonly type: ResearchJobType
  readonly status: JobStatus
  readonly config: Record<string, unknown>
  readonly report: Record<string, unknown> | null
  readonly startedAt: string | null
  readonly completedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly _count: { readonly findings: number }
}

export interface ResearchFinding {
  readonly id: number
  readonly jobId: number
  readonly type: string
  readonly title: string
  readonly description: string
  readonly confidence: number
  readonly data: Record<string, unknown>
  readonly applied: boolean
  readonly dismissed: boolean
  readonly createdAt: string
}

export interface DailyCostEntry {
  readonly date: string
  readonly model: string
  readonly requestCount: number
  readonly totalTokens: number
  readonly estimatedCostUsd: number
}

export interface CostBreakdownResponse {
  readonly days: number
  readonly totalCost: number
  readonly byModel: Record<
    string,
    {
      readonly requestCount: number
      readonly totalTokens: number
      readonly estimatedCostUsd: number
    }
  >
  readonly dailyUsage: readonly DailyCostEntry[]
}

export interface JobReport {
  readonly type: string
  readonly totalFindings: number
  readonly completedAt: string
  readonly error?: string
}

export interface ApiResponse<T> {
  readonly success: boolean
  readonly data: T
}
