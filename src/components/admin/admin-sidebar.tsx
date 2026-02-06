"use client"

import { useSearchParams, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  FolderOpen,
  Folder,
  Users,
  GitPullRequest,
  Sparkles,
  Github,
  Key,
  BarChart3,
  Tag,
  GraduationCap,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface AdminNavItem {
  readonly key: string
  readonly label: string
  readonly icon: LucideIcon
}

const NAV_ITEMS: readonly AdminNavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "resources", label: "Resources", icon: FileText },
  { key: "categories", label: "Categories", icon: FolderTree },
  { key: "subcategories", label: "Subcategories", icon: FolderOpen },
  { key: "sub-subcategories", label: "Sub-subcategories", icon: Folder },
  { key: "users", label: "Users", icon: Users },
  { key: "edit-suggestions", label: "Edit Suggestions", icon: GitPullRequest },
  { key: "enrichment", label: "Enrichment", icon: Sparkles },
  { key: "github-sync", label: "GitHub Sync", icon: Github },
  { key: "api-keys", label: "API Keys", icon: Key },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "tags", label: "Tags", icon: Tag },
  { key: "learning-journeys", label: "Learning Journeys", icon: GraduationCap },
  { key: "settings", label: "Settings", icon: Settings },
] as const

interface AdminSidebarProps {
  readonly onNavigate?: () => void
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps = {}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") ?? "overview"

  function handleNavClick(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", key)
    router.push(`/admin?${params.toString()}`)
    onNavigate?.()
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center px-4">
        <h2 className="font-heading text-lg font-bold tracking-tight">
          Admin Panel
        </h2>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key
            return (
              <Button
                key={item.key}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "justify-start gap-2 text-sm",
                  isActive && "font-semibold"
                )}
                onClick={() => handleNavClick(item.key)}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            )
          })}
        </nav>
      </ScrollArea>
    </aside>
  )
}

export { NAV_ITEMS }
export type { AdminNavItem }
