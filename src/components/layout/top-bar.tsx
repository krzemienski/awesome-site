"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import { Container } from "@/components/layout/container"
import { MobileNav } from "@/components/layout/mobile-nav"
import { SearchDialog } from "@/components/search/search-dialog"
import { SearchTrigger } from "@/components/search/search-trigger"
import { UserMenu } from "@/components/auth/user-menu"

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/resources", label: "Resources" },
  { href: "/categories", label: "Categories" },
  { href: "/journeys", label: "Journeys" },
  { href: "/about", label: "About" },
] as const

export function TopBar() {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                className="flex items-center gap-2 font-heading font-bold tracking-tight transition-colors hover:text-primary"
              >
                <Terminal className="size-4 text-primary" />
                <span className="text-primary text-lg">AVD_SYS</span>
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
                      "px-3 py-2 text-sm font-medium uppercase tracking-wider transition-colors font-heading",
                      isActive
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right: search + theme + user */}
            <div className="flex items-center gap-2">
              <SearchTrigger onOpen={() => setSearchOpen(true)} />
              <ThemeSwitcher />
              <UserMenu />
            </div>
          </div>
        </Container>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </>
  )
}
