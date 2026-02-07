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
  GitBranch,
  Key,
  BarChart3,
  Tag,
  GraduationCap,
  Settings,
  Download,
  Database,
  CheckCircle,
  Link,
  ScrollText,
  FlaskConical,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"

interface AdminNavItem {
  readonly key: string
  readonly label: string
  readonly icon: LucideIcon
}

interface AdminNavGroup {
  readonly label: string
  readonly defaultOpen: boolean
  readonly collapsible: boolean
  readonly items: readonly AdminNavItem[]
}

const NAV_GROUPS: readonly AdminNavGroup[] = [
  {
    label: "Overview",
    defaultOpen: true,
    collapsible: false,
    items: [
      { key: "overview", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content Management",
    defaultOpen: true,
    collapsible: true,
    items: [
      { key: "resources", label: "Resources", icon: FileText },
      { key: "categories", label: "Categories", icon: FolderTree },
      { key: "subcategories", label: "Subcategories", icon: FolderOpen },
      { key: "sub-subcategories", label: "Sub-subcategories", icon: Folder },
      { key: "tags", label: "Tags", icon: Tag },
      { key: "edit-suggestions", label: "Edit Suggestions", icon: GitPullRequest },
    ],
  },
  {
    label: "AI & Intelligence",
    defaultOpen: false,
    collapsible: true,
    items: [
      { key: "enrichment", label: "Enrichment", icon: Sparkles },
      { key: "research", label: "Research", icon: FlaskConical },
    ],
  },
  {
    label: "Operations",
    defaultOpen: false,
    collapsible: true,
    items: [
      { key: "github-sync", label: "GitHub Sync", icon: GitBranch },
      { key: "export", label: "Export", icon: Download },
      { key: "validation", label: "Validation", icon: CheckCircle },
      { key: "link-health", label: "Link Health", icon: Link },
      { key: "database", label: "Database", icon: Database },
      { key: "audit", label: "Audit", icon: ScrollText },
    ],
  },
  {
    label: "System",
    defaultOpen: false,
    collapsible: true,
    items: [
      { key: "users", label: "Users", icon: Users },
      { key: "api-keys", label: "API Keys", icon: Key },
      { key: "analytics", label: "Analytics", icon: BarChart3 },
      { key: "learning-journeys", label: "Learning Journeys", icon: GraduationCap },
      { key: "settings", label: "Settings", icon: Settings },
    ],
  },
] as const

function groupContainsTab(group: AdminNavGroup, tab: string): boolean {
  return group.items.some((item) => item.key === tab)
}

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
    <>
      <SidebarHeader className="flex items-center px-4" style={{ height: 'var(--sidebar-header-height)' }}>
        <h2 className="font-heading text-lg font-bold tracking-tight">
          Admin Panel
        </h2>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        {NAV_GROUPS.map((group) => {
          const isGroupActive = groupContainsTab(group, activeTab)
          const shouldOpen = group.defaultOpen || isGroupActive

          if (!group.collapsible) {
            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const isActive = activeTab === item.key
                      return (
                        <SidebarMenuItem key={item.key}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => handleNavClick(item.key)}
                            tooltip={item.label}
                          >
                            <Icon className="size-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          }

          return (
            <Collapsible
              key={group.label}
              defaultOpen={shouldOpen}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    {group.label}
                    <ChevronRight className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.key
                        return (
                          <SidebarMenuItem key={item.key}>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => handleNavClick(item.key)}
                              tooltip={item.label}
                            >
                              <Icon className="size-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        })}
      </SidebarContent>
      <SidebarFooter />
    </>
  )
}

export { NAV_GROUPS }
export type { AdminNavItem, AdminNavGroup }
