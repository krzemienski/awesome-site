/**
 * JSON-LD structured data helpers for SEO.
 * Each function returns a schema.org-conformant object ready for JSON.stringify.
 */

const SITE_NAME = "Awesome Video Dashboard"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awesome-video-dashboard.vercel.app"

// ---------------------------------------------------------------------------
// Shared Component
// ---------------------------------------------------------------------------

export function JsonLdScript({ data }: { readonly data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ---------------------------------------------------------------------------
// Organization (Home page)
// ---------------------------------------------------------------------------

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Curated collection of the best video resources, organized by category with AI-enriched metadata.",
    logo: `${SITE_URL}/icon.png`,
    sameAs: [] as string[],
  }
}

// ---------------------------------------------------------------------------
// WebSite (Home page — enables sitelinks search)
// ---------------------------------------------------------------------------

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/resources?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

// ---------------------------------------------------------------------------
// Article (Resource detail page)
// ---------------------------------------------------------------------------

export interface ArticleJsonLdInput {
  readonly title: string
  readonly description: string | null
  readonly url: string
  readonly createdAt: Date | string
  readonly updatedAt: Date | string
  readonly tags: readonly string[]
  readonly categoryName: string
  readonly resourceId: number
}

export function articleJsonLd(input: ArticleJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description ?? undefined,
    url: `${SITE_URL}/resources/${input.resourceId}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/resources/${input.resourceId}`,
    },
    datePublished: new Date(input.createdAt).toISOString(),
    dateModified: new Date(input.updatedAt).toISOString(),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    keywords: input.tags.join(", "),
    articleSection: input.categoryName,
  }
}

// ---------------------------------------------------------------------------
// CollectionPage (Category / Subcategory / Sub-subcategory pages)
// ---------------------------------------------------------------------------

export interface CollectionPageJsonLdInput {
  readonly name: string
  readonly description: string | null
  readonly url: string
  readonly resourceCount: number
}

export function collectionPageJsonLd(input: CollectionPageJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description ?? `Browse ${input.name} resources.`,
    url: `${SITE_URL}${input.url}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.resourceCount,
    },
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

// ---------------------------------------------------------------------------
// Course (Journey pages)
// ---------------------------------------------------------------------------

export interface CourseJsonLdInput {
  readonly title: string
  readonly description: string
  readonly difficulty: string
  readonly category: string | null
  readonly estimatedDuration: string | null
  readonly journeyId: number
  readonly steps: readonly {
    readonly title: string
    readonly stepOrder: number
    readonly description: string | null
  }[]
}

export function courseJsonLd(input: CourseJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.title,
    description: input.description,
    url: `${SITE_URL}/journeys/${input.journeyId}`,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    educationalLevel: input.difficulty,
    ...(input.category ? { about: input.category } : {}),
    ...(input.estimatedDuration
      ? { timeRequired: input.estimatedDuration }
      : {}),
    hasPart: input.steps.map((step) => ({
      "@type": "CreativeWork",
      name: step.title,
      position: step.stepOrder,
      description: step.description ?? undefined,
    })),
  }
}

// ---------------------------------------------------------------------------
// BreadcrumbList helper
// ---------------------------------------------------------------------------

export function breadcrumbJsonLd(
  items: readonly { readonly name: string; readonly url?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: `${SITE_URL}${item.url}` } : {}),
    })),
  }
}
