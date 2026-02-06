"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchTriggerProps {
  onOpen: () => void
}

/**
 * Button that opens the search dialog.
 * Displays "Search..." text with Cmd+K shortcut hint on desktop,
 * icon-only on mobile.
 */
export function SearchTrigger({ onOpen }: SearchTriggerProps) {
  return (
    <>
      {/* Desktop: looks like a search input */}
      <Button
        variant="outline"
        size="sm"
        className="hidden h-8 w-48 justify-start gap-2 text-muted-foreground lg:flex"
        onClick={onOpen}
        aria-label="Search"
      >
        <Search className="size-3.5" />
        <span className="text-xs">Search...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </Button>

      {/* Mobile: icon only */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpen}
        aria-label="Search"
      >
        <Search className="size-4" />
      </Button>
    </>
  )
}
