/**
 * Kinds of items that appear in search results.
 */
export type SearchResultKind = "resource" | "category" | "tag"

/**
 * A single search result displayed in the Cmd+K dialog.
 */
export interface SearchResult {
  kind: SearchResultKind
  label: string
  description?: string
  href: string
}

/**
 * An item in the Fuse.js searchable index.
 * Matches SearchResult shape for direct mapping.
 */
export interface SearchableItem {
  kind: SearchResultKind
  label: string
  description?: string
  href: string
}
