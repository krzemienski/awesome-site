import { z } from "zod"

export const analyzeUrlSchema = z.object({
  url: z.string().url(),
})

export const enrichmentJobConfigSchema = z.object({
  filter: z.enum(["all", "unenriched"]).default("unenriched"),
  batchSize: z.number().int().min(1).max(100).default(20),
})

export type AnalyzeUrlInput = z.infer<typeof analyzeUrlSchema>
export type EnrichmentJobConfig = z.infer<typeof enrichmentJobConfigSchema>
