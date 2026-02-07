export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message)
    this.name = "AppError"
  }
}

export const Errors = {
  UNAUTHORIZED: new AppError("Authentication required", 401, "AUTH_REQUIRED"),
  FORBIDDEN: new AppError("Insufficient permissions", 403, "FORBIDDEN"),
  NOT_FOUND: (entity: string) =>
    new AppError(`${entity} not found`, 404, "NOT_FOUND"),
  DUPLICATE: (field: string) =>
    new AppError(`${field} already exists`, 409, "DUPLICATE"),
  VALIDATION: (details: string) =>
    new AppError(details, 422, "VALIDATION_ERROR"),
  RATE_LIMITED: new AppError("Rate limit exceeded", 429, "RATE_LIMITED"),
} as const
