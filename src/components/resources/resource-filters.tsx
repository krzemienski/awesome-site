"use client"

import { useState, useEffect, useCallback } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ResourceStatus } from "@/features/resources/resource-types"

export interface CategoryOption {
  id: number
  name: string
}

export interface TagOption {
  id: number
  name: string
  slug: string
}

export interface ResourceFiltersValue {
  search?: string
  categoryId?: number
  status?: ResourceStatus
  tags?: string[]
}

export interface ResourceFiltersProps {
  value: ResourceFiltersValue
  onChange: (filters: ResourceFiltersValue) => void
  categories?: CategoryOption[]
  tags?: TagOption[]
  showStatus?: boolean
}

export function ResourceFilters({
  value,
  onChange,
  categories = [],
  tags = [],
  showStatus = false,
}: ResourceFiltersProps) {
  const [searchInput, setSearchInput] = useState(value.search ?? "")

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (value.search ?? "")) {
        onChange({ ...value, search: searchInput || undefined })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput, onChange, value])

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      onChange({
        ...value,
        categoryId: categoryId === "all" ? undefined : Number(categoryId),
      })
    },
    [value, onChange]
  )

  const handleStatusChange = useCallback(
    (status: string) => {
      onChange({
        ...value,
        status: status === "all" ? undefined : (status as ResourceStatus),
      })
    },
    [value, onChange]
  )

  const handleTagToggle = useCallback(
    (tagSlug: string) => {
      const current = value.tags ?? []
      const next = current.includes(tagSlug)
        ? current.filter((t) => t !== tagSlug)
        : [...current, tagSlug]
      onChange({ ...value, tags: next.length > 0 ? next : undefined })
    },
    [value, onChange]
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search resources..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={value.categoryId?.toString() ?? "all"}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id.toString()}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showStatus && (
        <Select
          value={value.status ?? "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => {
            const isActive = value.tags?.includes(tag.slug) ?? false
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.slug)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
