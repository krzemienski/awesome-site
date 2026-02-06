import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

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

export default async function middleware(
  request: NextRequest
): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  const session = await auth.api.getSession({
    headers: request.headers,
  })

  const hasSession = Boolean(session?.user)

  if (isAdminRoute(pathname)) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (session?.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }

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
