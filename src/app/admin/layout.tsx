import type { ReactNode } from "react"

export const metadata = {
  title: "Admin Dashboard",
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <>{children}</>
}
