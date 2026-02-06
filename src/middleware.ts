import { NextRequest, NextResponse } from "next/server"

const PROTECTED_ROUTES = [
  "/profile",
  "/favorites",
  "/bookmarks",
  "/history",
  "/submit",
]

const ADMIN_ROUTES = ["/admin"]

const AUTH_ROUTES = ["/login", "/register"]

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route))
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

export default async function middleware(
  request: NextRequest
): Promise<NextResponse> {
  const { pathname } = request.nextUrl
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
}
