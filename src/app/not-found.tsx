import type { Metadata } from "next"
import Link from "next/link"
import { Home, Search, FolderTree } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"

export const metadata: Metadata = {
  title: "Page Not Found | Awesome Video Dashboard",
}

export default function NotFound() {
  return (
    <Container className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-8xl font-bold tracking-tighter font-heading bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
          404
        </span>
        <h1 className="text-2xl font-bold tracking-tight font-heading">
          Page Not Found
        </h1>
        <p className="max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Try one of the links below to get back on track.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="size-4" />
            Go Home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/resources">
            <Search className="size-4" />
            Browse Resources
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/categories">
            <FolderTree className="size-4" />
            View Categories
          </Link>
        </Button>
      </div>
    </Container>
  )
}
