import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  ExternalLink,
  Heart,
  Calendar,
  Tag as TagIcon,
  Brain,
  Star,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  CategoryBreadcrumb,
  type BreadcrumbEntry,
} from "@/components/categories/category-breadcrumb"
import { getResource } from "@/features/resources/resource-service"
import { getRelatedResources } from "@/features/resources/related-resources"
import { ViewTracker } from "@/components/resources/view-tracker"
import { ResourceDetailActions } from "@/components/resources/resource-detail-actions"
import { JsonLdScript, articleJsonLd } from "@/lib/json-ld"
import { RecommendationsPanel } from "@/components/resources/recommendations-panel"

export const revalidate = 300

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const resourceId = Number(id)

  if (!Number.isInteger(resourceId) || resourceId <= 0) {
    return { title: "Resource Not Found" }
  }

  try {
    const resource = await getResource(resourceId)
    return {
      title: resource.title,
      description: resource.description?.slice(0, 160),
      openGraph: {
        title: resource.title,
        description: resource.description?.slice(0, 160),
        type: "article",
      },
    }
  } catch {
    return { title: "Resource Not Found" }
  }
}

export default async function ResourceDetailPage({ params }: PageProps) {
  const { id } = await params
  const resourceId = Number(id)

  if (!Number.isInteger(resourceId) || resourceId <= 0) {
    notFound()
  }

  let resource
  try {
    resource = await getResource(resourceId)
  } catch {
    notFound()
  }

  const relatedResources = await getRelatedResources(resource.id, undefined, 6)

  const breadcrumbItems: BreadcrumbEntry[] = [
    {
      label: resource.category.name,
      href: `/categories/${resource.category.slug}`,
    },
  ]

  if (resource.subcategory) {
    breadcrumbItems.push({
      label: resource.subcategory.name,
      href: `/categories/${resource.category.slug}/${resource.subcategory.slug}`,
    })
  }

  if (resource.subSubcategory && resource.subcategory) {
    breadcrumbItems.push({
      label: resource.subSubcategory.name,
      href: `/categories/${resource.category.slug}/${resource.subcategory.slug}/${resource.subSubcategory.slug}`,
    })
  }

  breadcrumbItems.push({ label: resource.title })

  const metadata = resource.metadata as Record<string, unknown> | null
  const isEnriched = metadata && Object.keys(metadata).length > 0
  const suggestedTags = isEnriched
    ? (metadata.suggestedTags as string[] | undefined)
    : undefined
  const keyTopics = isEnriched
    ? (metadata.keyTopics as string[] | undefined)
    : undefined
  const difficulty = isEnriched
    ? (metadata.difficulty as string | undefined)
    : undefined

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <JsonLdScript
        data={articleJsonLd({
          title: resource.title,
          description: resource.description,
          url: resource.url,
          createdAt: resource.createdAt,
          updatedAt: resource.updatedAt,
          tags: resource.tags.map(({ tag }) => tag.name),
          categoryName: resource.category.name,
          resourceId: resource.id,
        })}
      />
      <ViewTracker resourceId={resource.id} />
      <CategoryBreadcrumb items={breadcrumbItems} />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {resource.title}
            </h1>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline"
            >
              {resource.url}
              <ExternalLink className="size-3.5" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={resource.status === "approved" ? "default" : "secondary"}
            >
              {resource.status}
            </Badge>
          </div>
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            {new Date(resource.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="size-3.5" />
            {resource._count.favorites} favorite{resource._count.favorites === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <Separator />

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-base leading-relaxed">{resource.description}</p>
      </div>

      {resource.tags.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <TagIcon className="size-4" />
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {resource.tags.map(({ tag }) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Category</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>{resource.category.name}</Badge>
          {resource.subcategory && (
            <Badge variant="secondary">{resource.subcategory.name}</Badge>
          )}
          {resource.subSubcategory && (
            <Badge variant="outline">{resource.subSubcategory.name}</Badge>
          )}
        </div>
      </div>

      <ResourceDetailActions resourceId={resource.id} />

      {isEnriched && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="size-4" />
              AI Enrichment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {difficulty && (
              <div className="flex items-center gap-2">
                <Star className="text-muted-foreground size-4" />
                <span className="text-sm font-medium">Difficulty:</span>
                <Badge variant="secondary">{difficulty}</Badge>
              </div>
            )}
            {keyTopics && keyTopics.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm font-medium">Key Topics</span>
                <div className="flex flex-wrap gap-1.5">
                  {keyTopics.map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {suggestedTags && suggestedTags.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm font-medium">Suggested Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {relatedResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedResources.map((r) => (
                <a
                  key={r.id}
                  href={`/resources/${r.id}`}
                  className="flex flex-col gap-1 rounded-md border p-3 transition-colors hover:bg-accent/50"
                >
                  <span className="text-sm font-medium leading-tight">
                    {r.title}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="text-xs">
                      {r.category.name}
                    </Badge>
                    <span className="flex items-center gap-0.5">
                      <Heart className="size-3" />
                      {r.favoriteCount}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <RecommendationsPanel resourceId={resource.id} />
    </div>
  )
}
