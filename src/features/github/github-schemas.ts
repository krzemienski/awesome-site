import { z } from "zod"

export const githubConfigSchema = z.object({
  repoOwner: z.string().min(1),
  repoName: z.string().min(1),
  branch: z.string().default("main"),
  filePath: z.string().default("README.md"),
  syncEnabled: z.boolean().default(false),
})

export const importRequestSchema = z.object({
  listId: z.number().int().positive(),
  conflictStrategy: z.enum(["skip", "update", "create"]).default("skip"),
  autoApprove: z.boolean().default(false),
  validateLinks: z.boolean().default(false),
})

export type GithubConfigInput = z.infer<typeof githubConfigSchema>
export type ImportRequestInput = z.infer<typeof importRequestSchema>
