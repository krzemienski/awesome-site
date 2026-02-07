import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Favorites | Awesome Video Dashboard",
  description: "Your favorited resources.",
  openGraph: {
    title: "Favorites | Awesome Video Dashboard",
    description: "Your favorited resources.",
  },
}

export default function FavoritesLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return children
}
