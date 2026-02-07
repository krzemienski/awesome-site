import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Suggest Edit | Awesome Video Dashboard",
  description: "Suggest improvements to this resource.",
  openGraph: {
    title: "Suggest Edit | Awesome Video Dashboard",
    description: "Suggest improvements to this resource.",
  },
}

export default function SuggestEditLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return children
}
