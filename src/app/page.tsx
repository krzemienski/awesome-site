import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Search, Database, Layers, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { CategoryCard } from "@/components/categories/category-card"
import { getCategoryTree } from "@/features/categories/category-service"
import { JsonLdScript, organizationJsonLd, webSiteJsonLd } from "@/lib/json-ld"

export const metadata: Metadata = {
  title: "AVD_SYS | Curated Video Resources",
  description:
    "Discover, organize, and explore the best video resources across dozens of categories. AI-enriched metadata, community curation, and learning journeys.",
  openGraph: {
    title: "AVD_SYS - Awesome Video Dashboard",
    description:
      "Curated collection of the best video resources, organized by category with AI-enriched metadata.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "AVD_SYS - Awesome Video Dashboard",
    description:
      "Curated collection of the best video resources, organized by category with AI-enriched metadata.",
  },
}

export const revalidate = 600

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof getCategoryTree>> = []
  try {
    categories = await getCategoryTree()
  } catch {
    // DB unavailable — render with empty categories
  }

  const totalResources = categories.reduce(
    (sum, cat) =>
      sum +
      cat._count.resources +
      cat.subcategories.reduce(
        (subSum, sub) =>
          subSum +
          sub._count.resources +
          sub.subSubcategories.reduce(
            (subSubSum, subSub) => subSubSum + subSub._count.resources,
            0
          ),
        0
      ),
    0
  )

  return (
    <main className="flex flex-col gap-16 py-12">
      <JsonLdScript data={organizationJsonLd()} />
      <JsonLdScript data={webSiteJsonLd()} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <Container className="flex flex-col items-center text-center gap-8 py-20">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-heading">
            <span className="text-foreground">Discover the </span>
            <span className="text-primary">Best</span>
            <span className="text-foreground"> </span>
            <span className="text-primary">Video</span>
            <br />
            <span className="text-foreground">Resources</span>
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground font-heading">
            <span className="text-accent">&gt;</span> Curated feeds for the
            digital age. No noise, just signal.
          </p>

          {/* Search bar */}
          <div className="flex w-full max-w-xl">
            <Link
              href="/search"
              className="flex flex-1 items-center gap-2 border border-border bg-card px-4 py-3 text-sm text-muted-foreground font-heading transition-colors hover:border-accent"
            >
              <Search className="size-4 text-accent" />
              <span>Search database...</span>
            </Link>
            <Button
              asChild
              className="font-heading text-sm uppercase tracking-wider px-6"
            >
              <Link href="/search">Execute</Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
            <div className="flex items-center gap-2 text-accent font-heading">
              <Database className="size-4" />
              <span className="text-2xl font-bold">
                {totalResources > 0
                  ? `${Math.floor(totalResources / 100) * 100}+`
                  : "2,500+"}
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Resources
              </span>
            </div>
            <div className="flex items-center gap-2 text-accent font-heading">
              <Layers className="size-4" />
              <span className="text-2xl font-bold">{categories.length}+</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Categories
              </span>
            </div>
            <div className="flex items-center gap-2 text-accent font-heading">
              <RefreshCw className="size-4" />
              <span className="text-2xl font-bold">Daily</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Updates
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Category Grid */}
      <section>
        <Container>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight font-heading uppercase">
              Browse_Categories
            </h2>
            <Button
              variant="ghost"
              asChild
              className="hidden sm:flex font-heading text-xs uppercase tracking-wider text-primary hover:text-primary/80"
            >
              <Link href="/resources">
                View_All
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-border">
              <p className="text-muted-foreground text-lg font-heading">
                &gt; No categories found. System initializing...
              </p>
            </div>
          )}

          <div className="flex justify-center mt-8 sm:hidden">
            <Button
              variant="outline"
              asChild
              className="font-heading text-xs uppercase tracking-wider"
            >
              <Link href="/resources">
                Browse_All_Resources
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
