export type ConflictStrategy = "skip" | "update" | "create"

export type GithubSyncStatus = "idle" | "importing" | "exporting" | "error"

export interface SyncConfig {
  repoOwner: string
  repoName: string
  branch: string
  filePath: string
  token?: string
  conflictStrategy: ConflictStrategy
  autoApprove: boolean
  validateLinks: boolean
}

export interface ImportResult {
  success: boolean
  itemsAdded: number
  itemsUpdated: number
  itemsSkipped: number
  conflicts: number
  errors: Array<{ url: string; error: string }>
  historyId: number
}

export interface GithubRepoContent {
  name: string
  path: string
  sha: string
  size: number
  content: string
  encoding: string
}

export interface GithubSearchResult {
  fullName: string
  description: string | null
  url: string
  stars: number
  topics: string[]
}
