import { NextRequest, NextResponse } from "next/server"
import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit"

/**
 * Generate a per-request nonce for CSP script-src.
 * Uses crypto.randomUUID() encoded as base64.
 */
function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64")
}

/**
 * Build a Content-Security-Policy header string with a nonce for scripts.
 * Keeps style-src 'unsafe-inline' for Tailwind CSS compatibility.
 */
function buildCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com https://avatars.githubusercontent.com https://github.com https://img.youtube.com https://i.ytimg.com",
    "font-src 'self' data:",
    "connect-src 'self' https://api.anthropic.com https://api.github.com https://*.sentry.io https://*.vercel-insights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")
}

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

/** Auth endpoint rate limits per minute per IP */
const AUTH_LOGIN_RATE_LIMIT = 5
const AUTH_GENERAL_RATE_LIMIT = 10
const AUTH_RATE_WINDOW_MS = 60 * 1000

/** Login-sensitive auth paths (stricter limits) */
const AUTH_LOGIN_PATHS = ["/sign-in", "/sign-up"]

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

/**
 * Apply CSP and nonce headers to a NextResponse.
 */
function applyCspHeaders(response: NextResponse, nonce: string, cspHeader: string): NextResponse {
  response.headers.set("Content-Security-Policy", cspHeader)
  response.headers.set("x-nonce", nonce)
  return response
}

export default async function middleware(
  request: NextRequest
): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Generate a per-request nonce for CSP
  const nonce = generateNonce()
  const cspHeader = buildCspHeader(nonce)

  // API versioning: rewrite /api/v1/* to /api/* with version header
  if (pathname.startsWith("/api/v1/")) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = pathname.replace("/api/v1/", "/api/")
    const response = NextResponse.rewrite(rewriteUrl)
    response.headers.set("X-API-Version", "1")
    return applyCspHeaders(response, nonce, cspHeader)
  }

  // Anonymous rate limiting on API routes
  if (isApiRoute(pathname)) {
    // Auth endpoint rate limiting (stricter than anonymous)
    if (pathname.startsWith("/api/auth/")) {
      const ip = getClientIp(request)
      const isLoginPath = AUTH_LOGIN_PATHS.some((p) =>
        pathname.includes(p)
      )
      const authLimit = isLoginPath ? AUTH_LOGIN_RATE_LIMIT : AUTH_GENERAL_RATE_LIMIT
      const authKey = `auth:${isLoginPath ? "login" : "general"}:${ip}`
      const authResult = await checkRateLimit(authKey, authLimit, AUTH_RATE_WINDOW_MS)

      if (!authResult.allowed) {
        const retryAfterSeconds = Math.ceil(
          (authResult.resetAt - Date.now()) / 1000
        )

        return NextResponse.json(
          {
            success: false,
            error: "Rate limit exceeded",
            code: "RATE_LIMITED",
          },
          {
            status: 429,
            headers: {
              ...rateLimitHeaders(authResult),
              "Retry-After": String(Math.max(1, retryAfterSeconds)),
            },
          }
        )
      }

      const authResponse = NextResponse.next()
      const authHeaders = rateLimitHeaders(authResult)
      for (const [key, value] of Object.entries(authHeaders)) {
        authResponse.headers.set(key, value)
      }
      return applyCspHeaders(authResponse, nonce, cspHeader)
    }

    const ip = getClientIp(request)
    const rateLimitKey = `anon:${ip}`
    const result = await checkRateLimit(rateLimitKey, ANON_RATE_LIMIT, ANON_RATE_WINDOW_MS)

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
    return applyCspHeaders(response, nonce, cspHeader)
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
    return applyCspHeaders(NextResponse.next(), nonce, cspHeader)
  }

  if (isProtectedRoute(pathname)) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    return applyCspHeaders(NextResponse.next(), nonce, cspHeader)
  }

  if (isAuthRoute(pathname)) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return applyCspHeaders(NextResponse.next(), nonce, cspHeader)
  }

  return applyCspHeaders(NextResponse.next(), nonce, cspHeader)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
