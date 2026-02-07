/**
 * Cache-Control header helper for public API routes.
 * Adds CDN-friendly caching directives to Response objects.
 */
export function withCacheHeaders(
  response: Response,
  maxAge = 60,
  staleWhileRevalidate = 300
): Response {
  const cachedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  })

  cachedResponse.headers.set(
    "Cache-Control",
    `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  )

  return cachedResponse
}
