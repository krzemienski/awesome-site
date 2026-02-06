import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Journey Detail",
  description: "View journey details, steps, and track your learning progress.",
  openGraph: {
    title: "Journey Detail | Awesome Video Dashboard",
    description: "View journey details, steps, and track your learning progress.",
  },
}

export default function JourneyDetailLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return children
}
