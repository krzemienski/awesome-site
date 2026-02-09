"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchTriggerProps {
  onOpen: () => void
}

/**
 * Terminal-styled search trigger button.
 * Desktop shows command-line style, mobile shows icon only.
 */
export function SearchTrigger({ onOpen }: SearchTriggerProps) {
  return (
    <>
      {/* Desktop: terminal command style */}
      <Button
        variant="outline"
        size="sm"
        className="hidden h-8 w-56 justify-start gap-2 text-muted-foreground font-heading text-xs lg:flex"
        onClick={onOpen}
        aria-label="Search"
      >
        <Search className="size-3.5" />
        <span className="tracking-wider">Search database...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-0.5 border border-border bg-muted px-1.5 font-heading text-[10px] font-medium text-muted-foreground sm:flex">
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
