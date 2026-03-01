/**
 * Custom error class for API route handlers.
 * Carries an HTTP status code and optional machine-readable error code.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Return a JSON error response in the standard envelope format.
 *
 * ```json
 * { "data": null, "error": { "code": "NOT_FOUND", "message": "..." } }
 * ```
 */
export function apiError(
  statusCode: number,
  message: string,
  code?: string,
): Response {
  return Response.json(
    {
      data: null,
      error: { code: code ?? "ERROR", message },
    },
    { status: statusCode },
  );
}

/**
 * Return a JSON success response in the standard envelope format.
 *
 * ```json
 * { "data": T, "error": null }
 * ```
 *
 * An optional `meta` object (e.g. pagination info) is spread at the top level.
 */
export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
): Response {
  return Response.json({
    data,
    error: null,
    ...(meta ? { meta } : {}),
  });
}
