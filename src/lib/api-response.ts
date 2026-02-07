import { AppError } from "@/lib/api-error"

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  meta?: PaginationMeta
}

export function apiSuccess<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
  }
  return Response.json(body, { status })
}

export function apiError(
  message: string,
  status: number,
  code?: string
): Response {
  const body: ApiResponse<never> = {
    success: false,
    error: message,
    code,
  }
  return Response.json(body, { status })
}

export function apiPaginated<T>(data: T[], meta: PaginationMeta): Response {
  const body: ApiResponse<T[]> = {
    success: true,
    data,
    meta,
  }
  return Response.json(body, { status: 200 })
}

export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return apiError(error.message, error.statusCode, error.code)
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred"

  return apiError(message, 500, "INTERNAL_ERROR")
}
