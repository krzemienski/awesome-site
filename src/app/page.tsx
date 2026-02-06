import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { CategoryCard } from "@/components/categories/category-card"
import { getCategoryTree } from "@/features/categories/category-service"
import { JsonLdScript, organizationJsonLd, webSiteJsonLd } from "@/lib/json-ld"

export const metadata: Metadata = {
  title: "Awesome Video Dashboard | Curated Video Resources",
  description:
    "Discover, organize, and explore the best video resources across dozens of categories. AI-enriched metadata, community curation, and learning journeys.",
  openGraph: {
    title: "Awesome Video Dashboard",
    description:
      "Curated collection of the best video resources, organized by category with AI-enriched metadata.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Awesome Video Dashboard",
    description:
      "Curated collection of the best video resources, organized by category with AI-enriched metadata.",
  },
}

export default async function HomePage() {
  const categories = await getCategoryTree()

  return (
    <main className="flex flex-col gap-16 py-12">
      <JsonLdScript data={organizationJsonLd()} />
      <JsonLdScript data={webSiteJsonLd()} />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <Container className="flex flex-col items-center text-center gap-6 py-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-heading">
            <span className="bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
              Awesome Video
            </span>
            <br />
            <span className="text-foreground">Dashboard</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Discover, organize, and explore the best video resources across
            dozens of categories. AI-enriched metadata, community curation, and
            guided learning journeys.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/resources">
                <Search className="size-4" />
                Browse Resources
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/resources">
                Explore All
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Category Grid */}
      <section>
        <Container>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight font-heading">
                Browse by Category
              </h2>
              <p className="text-muted-foreground mt-1">
                Explore resources organized into {categories.length} categories
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link href="/resources">
                View all resources
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-lg">
                No categories yet. Check back soon!
              </p>
            </div>
          )}

          <div className="flex justify-center mt-8 sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/resources">
                Browse All Resources
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
