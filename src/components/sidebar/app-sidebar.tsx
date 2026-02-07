"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Library,
  FolderTree,
  Map,
  Info,
  Heart,
  Bookmark,
  Clock,
  User,
  Send,
  Search,
  LogIn,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import { UserMenu } from "@/components/auth/user-menu"
import { SearchDialog } from "@/components/search/search-dialog"

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/resources", label: "Resources", icon: Library },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/journeys", label: "Journeys", icon: Map },
  { href: "/about", label: "About", icon: Info },
] as const

const USER_NAV_ITEMS = [
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/history", label: "History", icon: Clock },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/submit", label: "Submit Resource", icon: Send },
] as const

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/"
  }
  return pathname.startsWith(href)
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <div className="flex items-center justify-between gap-2 px-2">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 font-bold text-lg",
                "group-data-[collapsible=icon]:hidden"
              )}
            >
              Awesome Video
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          {/* Navigation Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(pathname, item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Categories Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Categories</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Category tree loading...
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* User Group */}
          <SidebarGroup>
            <SidebarGroupLabel>User</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {user ? (
                  USER_NAV_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(pathname, item.href)}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Sign In">
                      <Link href="/login">
                        <LogIn />
                        <span>Sign In</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          <div className="flex items-center justify-between gap-2">
            <ThemeSwitcher />
            <UserMenu />
          </div>
        </SidebarFooter>
      </Sidebar>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
