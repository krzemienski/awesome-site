import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { CategoryCard } from "@/components/categories/category-card"
import { CategoryBreadcrumb } from "@/components/categories/category-breadcrumb"
import { getCategoryTree } from "@/features/categories/category-service"
import { JsonLdScript, collectionPageJsonLd } from "@/lib/json-ld"

export const metadata: Metadata = {
  title: "All Categories | Awesome Video Dashboard",
  description:
    "Browse all resource categories. Discover curated video resources organized into dozens of topics.",
  openGraph: {
    title: "All Categories | Awesome Video Dashboard",
    description:
      "Browse all resource categories organized by topic.",
  },
}

export default async function CategoriesPage() {
  const categories = await getCategoryTree()

  return (
    <main className="flex flex-col gap-8 py-8">
      <JsonLdScript
        data={collectionPageJsonLd({
          name: "All Categories",
          description: "Browse all resource categories organized by topic.",
          url: "/categories",
          resourceCount: categories.length,
        })}
      />
      <Container>
        <CategoryBreadcrumb items={[]} />

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">
              All Categories
            </h1>
            <p className="text-muted-foreground mt-1">
              {categories.length} categories to explore
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link href="/resources">
              Browse resources
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {categories.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      </Container>
    </main>
  )
}
