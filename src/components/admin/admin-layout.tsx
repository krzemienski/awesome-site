"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

interface AdminLayoutWrapperProps {
  readonly children: ReactNode
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin Navigation</SheetTitle>
            <SheetDescription>Navigate admin sections</SheetDescription>
          </SheetHeader>
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Mobile hamburger for admin sidebar */}
        <div className="mb-4 flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open admin menu"
          >
            <Menu className="size-5" />
          </Button>
          <h2 className="font-heading text-lg font-bold tracking-tight">
            Admin Panel
          </h2>
        </div>
        {children}
      </main>
    </div>
  )
}
