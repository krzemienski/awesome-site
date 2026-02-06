import Link from "next/link"
import { Github, BookOpen } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="border-t bg-background/95">
      <Container>
        <div className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-heading text-sm font-semibold">
              Awesome Video Dashboard
            </p>
            <p className="text-xs text-muted-foreground">
              Curated collection of video streaming and development resources.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="size-4" />
              <span>GitHub</span>
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="size-4" />
              <span>API Docs</span>
            </Link>
          </div>
        </div>

        <Separator />

        <div className="py-4">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Awesome Video Dashboard. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  )
}
