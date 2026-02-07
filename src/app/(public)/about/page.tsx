import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Github,
  Globe,
  Layers,
  Search,
  Sparkles,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Container } from "@/components/layout/container"

export const metadata: Metadata = {
  title: "About | Awesome Video Dashboard",
  description:
    "Learn about Awesome Video Dashboard — a curated collection of the best video tools, platforms, and resources. Discover how we organize, enrich, and surface quality content.",
  openGraph: {
    title: "About | Awesome Video Dashboard",
    description:
      "A curated collection of the best video tools, platforms, and resources with AI-enriched metadata and community curation.",
    type: "website",
    url: "/about",
  },
}

const features = [
  {
    icon: Layers,
    title: "Organized by Category",
    description:
      "Resources are organized into dozens of categories and subcategories so you can find exactly what you need.",
  },
  {
    icon: Sparkles,
    title: "AI-Enriched Metadata",
    description:
      "Every resource is enriched with AI-generated descriptions, tags, and quality scores to help you evaluate options quickly.",
  },
  {
    icon: Search,
    title: "Powerful Search",
    description:
      "Full-text fuzzy search across titles, descriptions, and tags. Filter by category, type, and more.",
  },
  {
    icon: Users,
    title: "Community Curated",
    description:
      "Anyone can submit new resources or suggest edits. Community contributions keep the collection fresh and comprehensive.",
  },
  {
    icon: BookOpen,
    title: "Learning Journeys",
    description:
      "Guided learning paths that connect related resources into structured curricula for skill development.",
  },
  {
    icon: Globe,
    title: "Open Source",
    description:
      "Built in the open. The entire codebase and resource data are available on GitHub for transparency and collaboration.",
  },
] as const

export default function AboutPage() {
  return (
    <main className="flex flex-col gap-16 py-12">
      {/* Hero */}
      <section>
        <Container className="flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-heading">
            About{" "}
            <span className="bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
              Awesome Video Dashboard
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            A curated collection of the best video tools, platforms, and
            resources — organized by category, enriched with AI, and maintained
            by the community.
          </p>
        </Container>
      </section>

      {/* What is this project */}
      <section>
        <Container>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-heading">
                What is Awesome Video Dashboard?
              </CardTitle>
              <CardDescription className="text-base">
                The story behind this project
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-muted-foreground">
              <p>
                Awesome Video Dashboard started as an{" "}
                <strong className="text-foreground">awesome-list</strong> — a
                community-curated catalog of video-related tools, libraries,
                platforms, and educational content. Over time it grew into a
                full-featured web application with search, filtering,
                AI-powered enrichment, and guided learning journeys.
              </p>
              <p>
                Today the dashboard indexes thousands of resources across dozens
                of categories. Whether you are a developer building video
                infrastructure, a creator looking for editing tools, or a
                learner exploring the video ecosystem, this site is designed to
                help you discover what matters.
              </p>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* How it works */}
      <section>
        <Container>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight font-heading">
              How It Works
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Resources flow through a pipeline of curation, enrichment, and
              organization before reaching you.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Submit or Import",
                text: "Resources are submitted by community members or imported from the GitHub awesome-list repository.",
              },
              {
                step: "2",
                title: "Enrich & Categorize",
                text: "AI enrichment adds descriptions, tags, and quality scores. Admins review and assign categories.",
              },
              {
                step: "3",
                title: "Discover & Learn",
                text: "Browse, search, and filter the catalog. Follow learning journeys for structured exploration.",
              },
            ].map((item) => (
              <Card key={item.step} className="text-center">
                <CardHeader>
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {item.step}
                  </div>
                  <CardTitle className="mt-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Feature highlights */}
      <section>
        <Container>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight font-heading">
              Feature Highlights
            </h2>
            <p className="text-muted-foreground mt-2">
              Everything you need to discover and organize video resources.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="size-8 text-primary" />
                  <CardTitle className="mt-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Contributing */}
      <section>
        <Container>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-heading">
                Contributing
              </CardTitle>
              <CardDescription className="text-base">
                Help grow the collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Awesome Video Dashboard thrives on community contributions. There
                are several ways to help:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-foreground">Submit a resource</strong>{" "}
                  — Found a great video tool or platform?{" "}
                  <Link
                    href="/submit"
                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Submit it
                  </Link>{" "}
                  to the catalog.
                </li>
                <li>
                  <strong className="text-foreground">Suggest edits</strong> —
                  See outdated info? Use the &ldquo;Suggest Edit&rdquo; button on any
                  resource page to propose corrections.
                </li>
                <li>
                  <strong className="text-foreground">
                    Contribute on GitHub
                  </strong>{" "}
                  — Report issues, submit pull requests, or help improve the
                  codebase.
                </li>
              </ul>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* CTA */}
      <section>
        <Container className="flex flex-col items-center text-center gap-6 pb-8">
          <h2 className="text-2xl font-bold tracking-tight font-heading">
            Ready to explore?
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/resources">
                Browse Resources
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/categories">
                View Categories
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="size-4" />
                GitHub
              </a>
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
