import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://awesome.video"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/resources`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/journeys`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]

  // Categories with nested subcategories and sub-subcategories
  // These models lack updatedAt, so derive lastModified from latest child resource
  const categories = await prisma.category.findMany({
    select: {
      slug: true,
      resources: {
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      subcategories: {
        select: {
          slug: true,
          resources: {
            select: { updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
          subSubcategories: {
            select: {
              slug: true,
              resources: {
                select: { updatedAt: true },
                orderBy: { updatedAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  const categoryPages: MetadataRoute.Sitemap = categories.flatMap(
    (category) => {
      const categoryEntry: MetadataRoute.Sitemap[number] = {
        url: `${BASE_URL}/categories/${category.slug}`,
        lastModified: category.resources[0]?.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }

      const subcategoryEntries: MetadataRoute.Sitemap = category.subcategories.flatMap(
        (sub) => {
          const subEntry: MetadataRoute.Sitemap[number] = {
            url: `${BASE_URL}/categories/${category.slug}/${sub.slug}`,
            lastModified: sub.resources[0]?.updatedAt,
            changeFrequency: "weekly",
            priority: 0.7,
          }

          const subSubEntries: MetadataRoute.Sitemap = sub.subSubcategories.map(
            (subSub) => ({
              url: `${BASE_URL}/categories/${category.slug}/${sub.slug}/${subSub.slug}`,
              lastModified: subSub.resources[0]?.updatedAt,
              changeFrequency: "weekly",
              priority: 0.6,
            })
          )

          return [subEntry, ...subSubEntries]
        }
      )

      return [categoryEntry, ...subcategoryEntries]
    }
  )

  // Approved resources
  const resources = await prisma.resource.findMany({
    where: { status: "approved" },
    select: {
      id: true,
      updatedAt: true,
    },
  })

  const resourcePages: MetadataRoute.Sitemap = resources.map((resource) => ({
    url: `${BASE_URL}/resources/${resource.id}`,
    lastModified: resource.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  // Published journeys
  const journeys = await prisma.learningJourney.findMany({
    where: { status: "published" },
    select: {
      id: true,
      updatedAt: true,
    },
  })

  const journeyPages: MetadataRoute.Sitemap = journeys.map((journey) => ({
    url: `${BASE_URL}/journeys/${journey.id}`,
    lastModified: journey.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  return [
    ...staticPages,
    ...categoryPages,
    ...resourcePages,
    ...journeyPages,
  ]
}
