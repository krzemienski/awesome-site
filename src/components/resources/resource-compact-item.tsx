"use client"

import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ResourceWithRelations } from "@/features/resources/resource-types"

export interface ResourceCompactItemProps {
  resource: ResourceWithRelations
}

export function ResourceCompactItem({ resource }: ResourceCompactItemProps) {
  return (
    <div className="hover:bg-accent/50 flex items-center gap-3 rounded-md px-3 py-2 transition-colors">
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {resource.title}
      </span>
      <Badge variant="secondary" className="shrink-0 text-xs">
        {resource.category.name}
      </Badge>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-primary shrink-0 transition-colors"
        aria-label={`Visit ${resource.title}`}
      >
        <ExternalLink className="size-4" />
      </a>
    </div>
  )
}
