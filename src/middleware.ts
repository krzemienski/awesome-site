import { NextRequest, NextResponse } from "next/server"
import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit"

const PROTECTED_ROUTES = [
  "/profile",
  "/favorites",
  "/bookmarks",
  "/history",
  "/submit",
]

const ADMIN_ROUTES = ["/admin"]

const AUTH_ROUTES = ["/login", "/register"]

/** Anonymous rate limit: 30 requests per minute per IP */
const ANON_RATE_LIMIT = 30
const ANON_RATE_WINDOW_MS = 60 * 1000

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route))
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/")
}

/**
 * Lightweight session check via Better Auth session cookie.
 * Does NOT import the full auth config (which requires Prisma/Node.js modules)
 * to stay compatible with edge runtime.
 *
 * For role-based checks (admin), we use the session cookie cache token
 * which Better Auth sets alongside the session token. Full role validation
 * happens server-side in the actual route handlers via withAdmin middleware.
 */
function getSessionFromCookies(request: NextRequest): {
  hasSession: boolean
} {
  // Better Auth uses "better-auth.session_token" cookie by default
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value

  return { hasSession: Boolean(sessionToken) }
}

/**
 * Extract client IP from request headers.
 * Falls back to "unknown" if no IP header is available.
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

export default async function middleware(
  request: NextRequest
): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Anonymous rate limiting on API routes
  if (isApiRoute(pathname)) {
    // Skip rate limiting for auth endpoints (Better Auth catch-all)
    if (pathname.startsWith("/api/auth/")) {
      return NextResponse.next()
    }

    const ip = getClientIp(request)
    const rateLimitKey = `anon:${ip}`
    const result = checkRateLimit(rateLimitKey, ANON_RATE_LIMIT, ANON_RATE_WINDOW_MS)

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000)

      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          code: "RATE_LIMITED",
        },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders(result),
            "Retry-After": String(Math.max(1, retryAfterSeconds)),
          },
        }
      )
    }

    // Attach rate limit headers to successful API responses
    const response = NextResponse.next()
    const headers = rateLimitHeaders(result)
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value)
    }
    return response
  }

  const { hasSession } = getSessionFromCookies(request)

  if (isAdminRoute(pathname)) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Note: Admin role verification happens server-side in withAdmin middleware.
    // Middleware only checks for session presence to avoid importing Prisma in edge runtime.
    return NextResponse.next()
  }

  if (isProtectedRoute(pathname)) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  if (isAuthRoute(pathname)) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
