"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Search, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import { Container } from "@/components/layout/container"
import { MobileNav } from "@/components/layout/mobile-nav"

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/resources", label: "Resources" },
  { href: "/categories", label: "Categories" },
  { href: "/journeys", label: "Journeys" },
] as const

export function TopBar() {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: hamburger + logo */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>

              <Link
                href="/"
                className="font-heading text-lg font-bold tracking-tight transition-colors hover:text-primary"
              >
                Awesome Videos
              </Link>
            </div>

            {/* Center: desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right: search + theme + user */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="hidden h-8 w-48 justify-start gap-2 text-muted-foreground lg:flex"
                aria-label="Search"
              >
                <Search className="size-3.5" />
                <span className="text-xs">Search...</span>
                <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                  <span className="text-xs">&#8984;</span>K
                </kbd>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Search"
              >
                <Search className="size-4" />
              </Button>

              <ThemeSwitcher />

              <Button
                variant="ghost"
                size="icon"
                aria-label="User menu"
              >
                <User className="size-4" />
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </>
  )
}
