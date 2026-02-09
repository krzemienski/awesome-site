import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import {
  ExternalLink,
  Heart,
  Calendar,
  Tag as TagIcon,
  Brain,
  Star,
  ArrowRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
      title: `${resource.title} | AVD_SYS`,
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
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        {/* Main content */}
        <div className="space-y-6">
          {/* Title and URL */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight font-heading">
              {resource.title}
            </h1>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent inline-flex items-center gap-1.5 text-sm font-heading hover:underline"
            >
              {resource.url}
              <ExternalLink className="size-3.5" />
            </a>
          </div>

          {/* Metadata row */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs font-heading uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {new Date(resource.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" />
              {resource._count.favorites} favorites
            </span>
            <Badge
              variant={resource.status === "approved" ? "default" : "secondary"}
              className="font-heading text-[10px] uppercase tracking-wider"
            >
              {resource.status}
            </Badge>
          </div>

          <Separator className="border-border" />

          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-heading uppercase tracking-wider flex items-center gap-2">
              About this Resource
            </h2>
            <p className="text-sm leading-relaxed font-heading text-muted-foreground">
              {resource.description}
            </p>
          </div>

          {/* Tags */}
          {resource.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-xs font-bold font-heading uppercase tracking-wider">
                <TagIcon className="size-3.5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map(({ tag }) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="font-heading text-xs uppercase tracking-wider text-accent border-accent/30"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Visit Website CTA */}
          <Button
            asChild
            size="lg"
            className="font-heading uppercase tracking-wider"
          >
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit Website
              <ArrowRight className="size-4" />
            </a>
          </Button>

          <ResourceDetailActions resourceId={resource.id} />

          {/* AI Enrichment */}
          {isEnriched && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-heading uppercase tracking-wider">
                  <Brain className="size-4 text-primary" />
                  AI Enrichment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {difficulty && (
                  <div className="flex items-center gap-2">
                    <Star className="text-muted-foreground size-4" />
                    <span className="text-xs font-heading uppercase tracking-wider">Difficulty:</span>
                    <Badge className="font-heading text-xs">{difficulty}</Badge>
                  </div>
                )}
                {keyTopics && keyTopics.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-heading uppercase tracking-wider">Key Topics</span>
                    <div className="flex flex-wrap gap-1.5">
                      {keyTopics.map((topic) => (
                        <Badge key={topic} variant="outline" className="text-[10px] font-heading uppercase tracking-wider">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {suggestedTags && suggestedTags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-heading uppercase tracking-wider">Suggested Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] font-heading uppercase tracking-wider">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Specs */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-heading uppercase tracking-wider">
                Specs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">
                  Category
                </span>
                <div className="flex flex-wrap gap-1">
                  <Badge className="font-heading text-[10px]">{resource.category.name}</Badge>
                  {resource.subcategory && (
                    <Badge variant="secondary" className="font-heading text-[10px]">
                      {resource.subcategory.name}
                    </Badge>
                  )}
                  {resource.subSubcategory && (
                    <Badge variant="outline" className="font-heading text-[10px]">
                      {resource.subSubcategory.name}
                    </Badge>
                  )}
                </div>
              </div>

              {difficulty && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">
                    Difficulty
                  </span>
                  <Badge className="font-heading text-[10px]">{difficulty}</Badge>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">
                  Added
                </span>
                <p className="text-xs font-heading">
                  {new Date(resource.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">
                  Favorites
                </span>
                <p className="text-xs font-heading text-primary">
                  {resource._count.favorites}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Resources */}
      {relatedResources.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-heading uppercase tracking-wider">
              Related Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedResources.map((r) => (
                <Link
                  key={r.id}
                  href={`/resources/${r.id}`}
                  className="flex flex-col gap-2 border border-border p-3 transition-all hover:border-primary/60 hover:shadow-[0_0_8px_rgba(224,80,176,0.1)]"
                >
                  <span className="text-sm font-bold font-heading leading-tight line-clamp-1">
                    {r.title}
                  </span>
                  <span className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="text-[10px] font-heading uppercase tracking-wider">
                      {r.category.name}
                    </Badge>
                    <span className="flex items-center gap-0.5 text-muted-foreground font-heading">
                      <Heart className="size-3" />
                      {r.favoriteCount}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <RecommendationsPanel resourceId={resource.id} />
    </div>
  )
}
