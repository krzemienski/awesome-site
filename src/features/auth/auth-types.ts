import type { NextRequest } from "next/server"
import type { User } from "@/lib/auth"

/**
 * Authenticated user attached to route context by withAuth middleware.
 * Mirrors Better Auth's User type with the additional fields we configured.
 */
export type AuthUser = User

/**
 * Base route context for Next.js App Router dynamic routes.
 * Params is a Promise in Next.js 15+ App Router.
 */
export interface RouteContext {
  params: Promise<Record<string, string>>
}

/**
 * Route context after withAuth middleware has validated the session.
 * Guarantees `user` is present and authenticated.
 */
export interface AuthenticatedRouteContext extends RouteContext {
  user: AuthUser
}

/**
 * Route context after withValidation middleware has parsed the request body.
 * Includes the validated and typed data from the Zod schema.
 */
export interface ValidatedRouteContext<T> extends RouteContext {
  validated: T
}

/**
 * Route context after both withAuth and withValidation.
 */
export interface AuthenticatedValidatedRouteContext<T>
  extends AuthenticatedRouteContext {
  validated: T
}

/**
 * API key information attached to context by withApiKey middleware.
 */
export interface ApiKeyInfo {
  id: string
  userId: string
  tier: string
  scopes: string[]
  keyPrefix: string
}

/**
 * Route context after withApiKey middleware has validated the API key.
 */
export interface ApiKeyRouteContext extends RouteContext {
  apiKey: ApiKeyInfo
}

/**
 * Base route handler signature for Next.js App Router.
 */
export type RouteHandler = (
  req: NextRequest,
  ctx: RouteContext
) => Promise<Response>

/**
 * Authenticated route handler -- user guaranteed on context.
 */
export type AuthenticatedRouteHandler = (
  req: NextRequest,
  ctx: AuthenticatedRouteContext
) => Promise<Response>

/**
 * Validated route handler -- validated data guaranteed on context.
 */
export type ValidatedRouteHandler<T> = (
  req: NextRequest,
  ctx: RouteContext & { validated: T }
) => Promise<Response>

/**
 * API key route handler -- apiKey guaranteed on context.
 */
export type ApiKeyRouteHandler = (
  req: NextRequest,
  ctx: ApiKeyRouteContext
) => Promise<Response>
