import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Container } from "@/components/layout/container"
import { CategoryBreadcrumb } from "@/components/categories/category-breadcrumb"
import { ResourceGrid } from "@/components/resources/resource-grid"
import { prisma } from "@/lib/prisma"
import { listResources } from "@/features/resources/resource-service"

interface PageProps {
  params: Promise<{ slug: string; subSlug: string; subSubSlug: string }>
}

async function getSubSubcategoryBySlug(
  categorySlug: string,
  subSlug: string,
  subSubSlug: string
) {
  const subSubcategory = await prisma.subSubcategory.findFirst({
    where: {
      slug: subSubSlug,
      subcategory: {
        slug: subSlug,
        category: { slug: categorySlug },
      },
    },
    include: {
      subcategory: { include: { category: true } },
      _count: { select: { resources: true } },
    },
  })
  return subSubcategory
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, subSlug, subSubSlug } = await params

  const subSub = await getSubSubcategoryBySlug(slug, subSlug, subSubSlug)
  if (!subSub) {
    return { title: "Sub-subcategory Not Found" }
  }

  const title = `${subSub.name} - ${subSub.subcategory.name} - ${subSub.subcategory.category.name}`
  const description =
    subSub.description ?? `Browse ${subSub.name} resources.`

  return {
    title: `${title} | Awesome Video Dashboard`,
    description,
    openGraph: { title: `${title} | Awesome Video Dashboard`, description },
  }
}

export default async function SubSubcategoryPage({ params }: PageProps) {
  const { slug, subSlug, subSubSlug } = await params

  const subSub = await getSubSubcategoryBySlug(slug, subSlug, subSubSlug)
  if (!subSub) {
    notFound()
  }

  const { items: resources } = await listResources({
    subSubcategoryId: subSub.id,
    status: "approved",
    limit: 50,
  })

  return (
    <main className="flex flex-col gap-8 py-8">
      <Container>
        <CategoryBreadcrumb
          items={[
            {
              label: subSub.subcategory.category.name,
              href: `/categories/${slug}`,
            },
            {
              label: subSub.subcategory.name,
              href: `/categories/${slug}/${subSlug}`,
            },
            { label: subSub.name },
          ]}
        />

        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight font-heading">
            {subSub.name}
          </h1>
          {subSub.description && (
            <p className="text-muted-foreground mt-1">
              {subSub.description}
            </p>
          )}
          <p className="text-muted-foreground mt-1 text-sm">
            {subSub._count.resources}{" "}
            {subSub._count.resources === 1 ? "resource" : "resources"}
          </p>
        </div>

        {/* Resources */}
        {resources.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-semibold font-heading mb-4">
              Resources
            </h2>
            <ResourceGrid resources={resources} viewMode="grid" />
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground text-lg">
              No resources in this sub-subcategory yet.
            </p>
          </div>
        )}
      </Container>
    </main>
  )
}
