import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "History | Awesome Video Dashboard",
  description: "Your recently viewed resources.",
  openGraph: {
    title: "History | Awesome Video Dashboard",
    description: "Your recently viewed resources.",
  },
}

export default function HistoryLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return children
}
