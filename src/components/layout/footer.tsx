import Link from "next/link"
import { Container } from "@/components/layout/container"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <Container>
        <div className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          {/* System status */}
          <div className="flex items-center gap-2 font-heading text-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            <span className="uppercase tracking-wider text-green-500">
              System Status: Operational
            </span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="font-heading text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms_of_Service
            </Link>
            <Link
              href="/privacy"
              className="font-heading text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy_Protocol
            </Link>
            <Link
              href="/about"
              className="font-heading text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact_Admin
            </Link>
          </div>
        </div>

        <div className="border-t border-border py-4">
          <p className="text-center font-heading text-xs uppercase tracking-wider text-muted-foreground">
            &copy; {new Date().getFullYear()} AVD_SYS. All Rights Reserved.
          </p>
        </div>
      </Container>
    </footer>
  )
}
