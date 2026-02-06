import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen } from "lucide-react"

import { Container } from "@/components/layout/container"
import { JourneyCard } from "@/components/journeys/journey-card"
import { Badge } from "@/components/ui/badge"
import { listPublished } from "@/features/journeys/journey-service"
import { JsonLdScript, collectionPageJsonLd } from "@/lib/json-ld"
import type { JourneyDifficulty } from "@/generated/prisma/client"

export const metadata: Metadata = {
  title: "Learning Journeys | Awesome Video Dashboard",
  description:
    "Explore guided learning paths with step-by-step progress tracking.",
  openGraph: {
    title: "Learning Journeys | Awesome Video Dashboard",
    description: "Explore guided learning paths.",
  },
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function JourneysPage({ searchParams }: PageProps) {
  const params = await searchParams
  const difficulty = (params.difficulty as JourneyDifficulty) || undefined
  const category = (params.category as string) || undefined

  const [allResult, featuredResult] = await Promise.all([
    listPublished({ difficulty, category, limit: 50 }),
    listPublished({ featured: true, limit: 6 }),
  ])

  const journeys = allResult.items
  const featured = !difficulty && !category ? featuredResult.items : []

  const difficulties: JourneyDifficulty[] = [
    "beginner",
    "intermediate",
    "advanced",
  ]

  return (
    <main className="flex flex-col gap-8 py-8">
      <JsonLdScript
        data={collectionPageJsonLd({
          name: "Learning Journeys",
          description: "Explore guided learning paths with step-by-step progress tracking.",
          url: "/journeys",
          resourceCount: journeys.length,
        })}
      />
      <Container>
        <div className="flex items-center gap-3">
          <BookOpen className="text-primary size-8" />
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              Learning Journeys
            </h1>
            <p className="text-muted-foreground mt-1">
              Guided learning paths with step-by-step progress tracking.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Difficulty:</span>
          <Link href="/journeys">
            <Badge variant={!difficulty ? "default" : "outline"}>All</Badge>
          </Link>
          {difficulties.map((d) => (
            <Link key={d} href={`/journeys?difficulty=${d}${category ? `&category=${category}` : ""}`}>
              <Badge variant={difficulty === d ? "default" : "outline"}>
                {d}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Featured Section */}
        {featured.length > 0 && (
          <section className="mt-8">
            <h2 className="font-heading mb-4 text-xl font-semibold">
              Featured Journeys
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((journey) => (
                <JourneyCard key={journey.id} journey={journey} />
              ))}
            </div>
          </section>
        )}

        {/* All Journeys */}
        <section className="mt-8">
          <h2 className="font-heading mb-4 text-xl font-semibold">
            {difficulty || category ? "Filtered Journeys" : "All Journeys"}
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ({journeys.length} journey{journeys.length === 1 ? "" : "s"})
            </span>
          </h2>
          {journeys.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {journeys.map((journey) => (
                <JourneyCard key={journey.id} journey={journey} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="text-muted-foreground mb-4 size-12" />
              <p className="text-muted-foreground text-lg">
                No journeys found.
              </p>
              {(difficulty || category) && (
                <Link
                  href="/journeys"
                  className="text-primary mt-2 text-sm hover:underline"
                >
                  Clear filters
                </Link>
              )}
            </div>
          )}
        </section>
      </Container>
    </main>
  )
}
