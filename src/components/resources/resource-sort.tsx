"use client"

import { ArrowUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SortField = "title" | "createdAt" | "popularity"
export type SortOrder = "asc" | "desc"

export interface SortValue {
  field: SortField
  order: SortOrder
}

export interface ResourceSortProps {
  value: SortValue
  onChange: (value: SortValue) => void
}

const SORT_OPTIONS: Array<{ label: string; field: SortField; order: SortOrder }> = [
  { label: "Name (A-Z)", field: "title", order: "asc" },
  { label: "Name (Z-A)", field: "title", order: "desc" },
  { label: "Newest", field: "createdAt", order: "desc" },
  { label: "Oldest", field: "createdAt", order: "asc" },
  { label: "Most Popular", field: "popularity", order: "desc" },
  { label: "Least Popular", field: "popularity", order: "asc" },
]

function toKey(field: SortField, order: SortOrder): string {
  return `${field}:${order}`
}

function fromKey(key: string): SortValue {
  const [field, order] = key.split(":")
  return { field: field as SortField, order: order as SortOrder }
}

export function ResourceSort({ value, onChange }: ResourceSortProps) {
  return (
    <Select
      value={toKey(value.field, value.order)}
      onValueChange={(key) => onChange(fromKey(key))}
    >
      <SelectTrigger className="w-[180px]">
        <ArrowUpDown className="mr-2 size-4" />
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={toKey(opt.field, opt.order)} value={toKey(opt.field, opt.order)}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
