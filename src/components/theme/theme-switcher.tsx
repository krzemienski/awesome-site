"use client"

import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"
import { Paintbrush } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const THEME_OPTIONS = [
  { value: "cyberpunk", label: "Cyberpunk", color: "oklch(0.75 0.3225 328.36)" },
  { value: "modern-light", label: "Modern Light", color: "oklch(0.55 0.2 250)" },
  { value: "modern-dark", label: "Modern Dark", color: "oklch(0.65 0.2 250)" },
  { value: "high-contrast", label: "High Contrast", color: "oklch(0.4 0.2 250)" },
] as const

const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Switch theme">
        <Paintbrush className="size-4" />
      </Button>
    )
  }

  const currentOption = THEME_OPTIONS.find((opt) => opt.value === theme) ?? THEME_OPTIONS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Switch theme">
          <span
            className="size-4 rounded-full border border-border"
            style={{ backgroundColor: currentOption.color }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className="flex items-center gap-2"
          >
            <span
              className="size-3 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: option.color }}
            />
            <span>{option.label}</span>
            {theme === option.value && (
              <span className="ml-auto text-xs text-muted-foreground">Active</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
