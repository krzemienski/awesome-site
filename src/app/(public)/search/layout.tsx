import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Search | Awesome Video Dashboard",
  description: "Search and filter resources by category, tags, and more.",
  openGraph: {
    title: "Search | Awesome Video Dashboard",
    description: "Search and filter resources by category, tags, and more.",
  },
}

export default function SearchLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return children
}
