"use client"

import type { ReactNode } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

interface AdminLayoutWrapperProps {
  readonly children: ReactNode
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
