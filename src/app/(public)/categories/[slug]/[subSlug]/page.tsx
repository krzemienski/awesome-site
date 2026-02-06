import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/layout/container"
import { CategoryBreadcrumb } from "@/components/categories/category-breadcrumb"
import { ResourceGrid } from "@/components/resources/resource-grid"
import { prisma } from "@/lib/prisma"
import { listResources } from "@/features/resources/resource-service"

interface PageProps {
  params: Promise<{ slug: string; subSlug: string }>
}

async function getSubcategoryBySlug(categorySlug: string, subSlug: string) {
  const subcategory = await prisma.subcategory.findFirst({
    where: { slug: subSlug, category: { slug: categorySlug } },
    include: {
      category: true,
      subSubcategories: {
        orderBy: { displayOrder: "asc" },
        include: { _count: { select: { resources: true } } },
      },
      _count: { select: { resources: true } },
    },
  })
  return subcategory
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, subSlug } = await params

  const subcategory = await getSubcategoryBySlug(slug, subSlug)
  if (!subcategory) {
    return { title: "Subcategory Not Found" }
  }

  const title = `${subcategory.name} - ${subcategory.category.name}`
  const description =
    subcategory.description ?? `Browse ${subcategory.name} resources.`

  return {
    title: `${title} | Awesome Video Dashboard`,
    description,
    openGraph: { title: `${title} | Awesome Video Dashboard`, description },
  }
}

export default async function SubcategoryPage({ params }: PageProps) {
  const { slug, subSlug } = await params

  const subcategory = await getSubcategoryBySlug(slug, subSlug)
  if (!subcategory) {
    notFound()
  }

  const { items: resources } = await listResources({
    subcategoryId: subcategory.id,
    status: "approved",
    limit: 20,
  })

  const totalResources =
    subcategory._count.resources +
    subcategory.subSubcategories.reduce(
      (sum, s) => sum + s._count.resources,
      0
    )

  return (
    <main className="flex flex-col gap-8 py-8">
      <Container>
        <CategoryBreadcrumb
          items={[
            {
              label: subcategory.category.name,
              href: `/categories/${slug}`,
            },
            { label: subcategory.name },
          ]}
        />

        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight font-heading">
            {subcategory.name}
          </h1>
          {subcategory.description && (
            <p className="text-muted-foreground mt-1">
              {subcategory.description}
            </p>
          )}
          <p className="text-muted-foreground mt-1 text-sm">
            {totalResources} {totalResources === 1 ? "resource" : "resources"}
            {subcategory.subSubcategories.length > 0 &&
              ` across ${subcategory.subSubcategories.length} sub-subcategories`}
          </p>
        </div>

        {/* Sub-subcategories Grid */}
        {subcategory.subSubcategories.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold font-heading mb-4">
              Sub-subcategories
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subcategory.subSubcategories.map((subSub) => (
                <Link
                  key={subSub.id}
                  href={`/categories/${slug}/${subSlug}/${subSub.slug}`}
                  className="group block"
                >
                  <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {subSub.name}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {subSub._count.resources}{" "}
                          {subSub._count.resources === 1
                            ? "resource"
                            : "resources"}
                        </Badge>
                      </div>
                    </CardHeader>
                    {subSub.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {subSub.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold font-heading mb-4">
              Resources
            </h2>
            <ResourceGrid resources={resources} viewMode="grid" />
          </section>
        )}

        {subcategory.subSubcategories.length === 0 &&
          resources.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-lg">
                No resources in this subcategory yet.
              </p>
            </div>
          )}
      </Container>
    </main>
  )
}
