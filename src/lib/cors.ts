import { NextRequest, NextResponse } from "next/server"

interface CorsConfig {
  readonly allowedOrigins?: readonly string[]
  readonly allowedMethods?: string
  readonly allowedHeaders?: string
  readonly maxAge?: number
}

const DEFAULT_ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS"
const DEFAULT_ALLOWED_HEADERS = "Content-Type, x-api-key, Authorization"
const DEFAULT_MAX_AGE = 86400

function resolveOrigin(
  requestOrigin: string | null,
  allowedOrigins?: readonly string[]
): string {
  if (!requestOrigin) return "*"
  if (!allowedOrigins || allowedOrigins.length === 0) return "*"
  if (allowedOrigins.includes(requestOrigin)) return requestOrigin
  return ""
}

export function corsHeaders(
  origin: string | null,
  config?: CorsConfig
): Record<string, string> {
  const resolvedOrigin = resolveOrigin(origin, config?.allowedOrigins)
  if (!resolvedOrigin) return {}

  return {
    "Access-Control-Allow-Origin": resolvedOrigin,
    "Access-Control-Allow-Methods":
      config?.allowedMethods ?? DEFAULT_ALLOWED_METHODS,
    "Access-Control-Allow-Headers":
      config?.allowedHeaders ?? DEFAULT_ALLOWED_HEADERS,
    "Access-Control-Max-Age": String(config?.maxAge ?? DEFAULT_MAX_AGE),
  }
}

export function handlePreflight(
  request: NextRequest,
  config?: CorsConfig
): NextResponse {
  const origin = request.headers.get("origin")
  const headers = corsHeaders(origin, config)

  return new NextResponse(null, {
    status: 204,
    headers,
  })
}
