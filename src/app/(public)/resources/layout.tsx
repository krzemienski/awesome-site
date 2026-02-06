import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Resources",
  description:
    "Browse and discover curated video resources. Filter by category, tags, and more.",
  openGraph: {
    title: "Browse Resources | Awesome Video Dashboard",
    description:
      "Browse and discover curated video resources. Filter by category, tags, and more.",
  },
}

export default function ResourcesLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return children
}
