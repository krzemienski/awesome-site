"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, FolderOpen, Layers, Route, Info, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/resources", label: "Resources", icon: FolderOpen },
  { href: "/categories", label: "Categories", icon: Layers },
  { href: "/journeys", label: "Journeys", icon: Route },
  { href: "/about", label: "About", icon: Info },
] as const

interface MobileNavProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-background border-r border-border">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-heading text-lg">
            <Terminal className="size-4 text-primary" />
            <span className="text-primary">AVD_SYS</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation menu
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-3 py-2 text-sm font-medium uppercase tracking-wider transition-colors font-heading",
                  isActive
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
