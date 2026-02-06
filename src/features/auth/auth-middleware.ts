import { NextRequest } from "next/server"
import { createHash } from "crypto"
import type { ZodSchema, ZodError } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { apiError, handleApiError } from "@/lib/api-response"
import type {
  RouteContext,
  RouteHandler,
  AuthenticatedRouteContext,
  ApiKeyRouteContext,
} from "@/features/auth/auth-types"

/**
 * Validates session cookie via Better Auth, attaches user to context.
 * Returns 401 if no valid session found.
 */
export function withAuth(
  handler: (
    req: NextRequest,
    ctx: AuthenticatedRouteContext
  ) => Promise<Response>
): RouteHandler {
  return async (req: NextRequest, ctx: RouteContext): Promise<Response> => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      })

      if (!session?.user) {
        return apiError("Authentication required", 401, "AUTH_REQUIRED")
      }

      if (session.user.banned) {
        const banMessage = session.user.banReason
          ? `Account suspended: ${session.user.banReason}`
          : "Account suspended"
        return apiError(banMessage, 403, "ACCOUNT_BANNED")
      }

      const authenticatedCtx: AuthenticatedRouteContext = {
        ...ctx,
        user: session.user,
      }

      return await handler(req, authenticatedCtx)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

/**
 * Wraps withAuth, then checks user.role === "admin".
 * Returns 403 if user is not an admin.
 */
export function withAdmin(
  handler: (
    req: NextRequest,
    ctx: AuthenticatedRouteContext
  ) => Promise<Response>
): RouteHandler {
  return withAuth(
    async (
      req: NextRequest,
      ctx: AuthenticatedRouteContext
    ): Promise<Response> => {
      if (ctx.user.role !== "admin") {
        return apiError("Insufficient permissions", 403, "FORBIDDEN")
      }

      return await handler(req, ctx)
    }
  )
}

/**
 * Format Zod validation errors into field-level error details.
 */
function formatZodErrors(
  error: ZodError
): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }))
}

/**
 * Parses request body with a Zod schema, attaches validated data to context.
 * Returns 422 with field-level errors on validation failure.
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (
    req: NextRequest,
    ctx: RouteContext & { validated: T }
  ) => Promise<Response>
): RouteHandler {
  return async (req: NextRequest, ctx: RouteContext): Promise<Response> => {
    try {
      let body: unknown

      try {
        body = await req.json()
      } catch {
        return apiError("Invalid JSON body", 422, "VALIDATION_ERROR")
      }

      const result = schema.safeParse(body)

      if (!result.success) {
        const fieldErrors = formatZodErrors(result.error)
        return Response.json(
          {
            success: false,
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: fieldErrors,
          },
          { status: 422 }
        )
      }

      const validatedCtx = {
        ...ctx,
        validated: result.data,
      }

      return await handler(req, validatedCtx)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

/**
 * Validates x-api-key header via SHA-256 hash lookup in the ApiKey table.
 * Checks key is active and not expired.
 * Attaches API key info to context.
 */
export function withApiKey(
  handler: (
    req: NextRequest,
    ctx: ApiKeyRouteContext
  ) => Promise<Response>
): RouteHandler {
  return async (req: NextRequest, ctx: RouteContext): Promise<Response> => {
    try {
      const apiKeyHeader = req.headers.get("x-api-key")

      if (!apiKeyHeader) {
        return apiError(
          "API key required. Provide x-api-key header.",
          401,
          "API_KEY_REQUIRED"
        )
      }

      const keyHash = createHash("sha256")
        .update(apiKeyHeader)
        .digest("hex")

      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { keyHash },
      })

      if (!apiKeyRecord) {
        return apiError("Invalid API key", 401, "API_KEY_INVALID")
      }

      if (apiKeyRecord.revokedAt) {
        return apiError("API key has been revoked", 401, "API_KEY_REVOKED")
      }

      if (
        apiKeyRecord.expiresAt &&
        new Date() > new Date(apiKeyRecord.expiresAt)
      ) {
        return apiError("API key has expired", 401, "API_KEY_EXPIRED")
      }

      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      })

      const apiKeyCtx: ApiKeyRouteContext = {
        ...ctx,
        apiKey: {
          id: apiKeyRecord.id,
          userId: apiKeyRecord.userId,
          tier: apiKeyRecord.tier,
          scopes: apiKeyRecord.scopes,
          keyPrefix: apiKeyRecord.keyPrefix,
        },
      }

      return await handler(req, apiKeyCtx)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
