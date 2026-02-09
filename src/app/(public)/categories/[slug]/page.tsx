import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/layout/container"
import { CategoryBreadcrumb } from "@/components/categories/category-breadcrumb"
import { ResourceGrid } from "@/components/resources/resource-grid"
import { getCategoryBySlug } from "@/features/categories/category-service"
import { listResources } from "@/features/resources/resource-service"
import { JsonLdScript, collectionPageJsonLd } from "@/lib/json-ld"
import type { SubcategoryWithChildren } from "@/features/categories/category-types"

export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const category = await getCategoryBySlug(slug)
    return {
      title: `${category.name} | AVD_SYS`,
      description:
        category.description ??
        `Browse ${category.name} resources and subcategories.`,
      openGraph: {
        title: `${category.name} | AVD_SYS`,
        description:
          category.description ??
          `Browse ${category.name} resources and subcategories.`,
      },
    }
  } catch {
    return { title: "Category Not Found" }
  }
}

function computeSubcategoryTotal(sub: SubcategoryWithChildren): number {
  return (
    sub._count.resources +
    sub.subSubcategories.reduce((sum, s) => sum + s._count.resources, 0)
  )
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params

  let category
  try {
    category = await getCategoryBySlug(slug)
  } catch {
    notFound()
  }

  const { items: resources } = await listResources({
    categoryId: category.id,
    status: "approved",
    limit: 20,
  })

  const totalResources =
    category._count.resources +
    category.subcategories.reduce(
      (sum, sub) => sum + computeSubcategoryTotal(sub),
      0
    )

  return (
    <main className="flex flex-col gap-8 py-8">
      <JsonLdScript
        data={collectionPageJsonLd({
          name: category.name,
          description: category.description,
          url: `/categories/${slug}`,
          resourceCount: totalResources,
        })}
      />
      <Container>
        <CategoryBreadcrumb items={[{ label: category.name }]} />

        {/* Category Header */}
        <div className="mt-6">
          <div className="flex items-start gap-3">
            {category.icon && (
              <span className="text-4xl" aria-hidden="true">
                {category.icon}
              </span>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-heading uppercase">
                {category.name.replace(/\s+/g, "_")}
              </h1>
              {category.description && (
                <p className="text-muted-foreground mt-2 font-heading text-sm">
                  {category.description}
                </p>
              )}
              <p className="text-muted-foreground mt-1 text-xs font-heading uppercase tracking-wider">
                Showing {totalResources}{" "}
                {totalResources === 1 ? "resource" : "resources"} across{" "}
                {category.subcategories.length} subcategories
              </p>
            </div>
          </div>
        </div>

        {/* Subcategory Filter Tabs */}
        {category.subcategories.length > 0 && (
          <section className="mt-6">
            <div className="flex flex-wrap gap-2">
              <Badge className="font-heading text-xs uppercase tracking-wider px-3 py-1 cursor-default">
                All
              </Badge>
              {category.subcategories.map((sub) => {
                const subTotal = computeSubcategoryTotal(sub)
                return (
                  <Link
                    key={sub.id}
                    href={`/categories/${slug}/${sub.slug}`}
                  >
                    <Badge
                      variant="outline"
                      className="font-heading text-xs uppercase tracking-wider px-3 py-1 hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                    >
                      {sub.name}
                      <span className="ml-1.5 text-muted-foreground">
                        {subTotal}
                      </span>
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Subcategories Grid */}
        {category.subcategories.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold font-heading uppercase tracking-wider mb-4">
              Subcategories
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.subcategories.map((sub) => {
                const subTotal = computeSubcategoryTotal(sub)
                return (
                  <Link
                    key={sub.id}
                    href={`/categories/${slug}/${sub.slug}`}
                    className="group block"
                  >
                    <Card className="h-full border-border transition-all hover:border-primary/60 hover:shadow-[0_0_12px_rgba(224,80,176,0.15)]">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-bold uppercase tracking-wider font-heading group-hover:text-primary transition-colors">
                            {sub.name}
                          </CardTitle>
                          <Badge variant="secondary" className="text-[10px] font-heading uppercase tracking-wider">
                            {subTotal} {subTotal === 1 ? "item" : "items"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {sub.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-2 font-heading">
                            {sub.description}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/60 font-heading">
                            {sub.subSubcategories.length} sub-subcategories
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Resources in this category */}
        {resources.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-heading uppercase tracking-wider">
                Resources
              </h2>
              <span className="text-xs text-muted-foreground font-heading uppercase tracking-wider">
                Showing 1-{resources.length} of {totalResources}
              </span>
            </div>
            <ResourceGrid resources={resources} viewMode="grid" />
          </section>
        )}

        {category.subcategories.length === 0 && resources.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-border mt-8">
            <p className="text-muted-foreground text-lg font-heading">
              &gt; No resources in this category yet. Awaiting data...
            </p>
          </div>
        )}
      </Container>
    </main>
  )
}
