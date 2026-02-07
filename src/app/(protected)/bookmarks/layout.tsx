import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bookmarks | Awesome Video Dashboard",
  description: "Your bookmarked resources.",
  openGraph: {
    title: "Bookmarks | Awesome Video Dashboard",
    description: "Your bookmarked resources.",
  },
}

export default function BookmarksLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return children
}
