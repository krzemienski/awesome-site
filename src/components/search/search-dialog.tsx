"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Folder, Tag } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useSearch } from "@/hooks/use-search"
import type { SearchResult, SearchResultKind } from "@/features/search/search-types"

const KIND_ICON: Record<SearchResultKind, React.ElementType> = {
  resource: FileText,
  category: Folder,
  tag: Tag,
}

const KIND_LABEL: Record<SearchResultKind, string> = {
  resource: "Resources",
  category: "Categories",
  tag: "Tags",
}

function groupByKind(results: SearchResult[]): Record<string, SearchResult[]> {
  const groups: Record<string, SearchResult[]> = {}
  for (const r of results) {
    const key = r.kind
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(r)
  }
  return groups
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const { results } = useSearch(query)

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("")
    }
  }, [open])

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false)
      setQuery("")
      router.push(href)
    },
    [router, onOpenChange]
  )

  const grouped = groupByKind(results)
  const kindOrder: SearchResultKind[] = ["resource", "category", "tag"]
  const activeGroups = kindOrder.filter(
    (k) => grouped[k] && grouped[k].length > 0
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search resources, categories, and tags"
    >
      <CommandInput
        placeholder="Search resources, categories, tags..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {activeGroups.map((kind, idx) => {
          const items = grouped[kind]
          const Icon = KIND_ICON[kind]

          return (
            <div key={kind}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={KIND_LABEL[kind]}>
                {items.map((item) => (
                  <CommandItem
                    key={`${item.kind}-${item.href}`}
                    value={`${item.label} ${item.description ?? ""}`}
                    onSelect={() => handleSelect(item.href)}
                  >
                    <Icon className="mr-2 size-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="truncate text-sm">{item.label}</span>
                      {item.description && (
                        <span className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}
