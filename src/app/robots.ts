import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://awesome.video"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/admin",
          "/profile",
          "/bookmarks",
          "/favorites",
          "/history",
          "/api/",
        ],
        allow: [
          "/",
          "/api/resources",
          "/api/categories",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
