import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Profile | Awesome Video Dashboard",
  description: "Manage your profile and preferences.",
  openGraph: {
    title: "Profile | Awesome Video Dashboard",
    description: "Manage your profile and preferences.",
  },
}

export default function ProfileLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return children
}
