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
 * Report a failed database call without handing the caller the raw message.
 *
 * Postgres errors name tables, columns, constraints and sometimes row values.
 * Returning `error.message` verbatim leaked the schema to anyone who could
 * provoke a failure, and told the user nothing they could act on. The detail
 * goes to the server log, keyed by `context`, so it is still one grep away.
 */
export function dbError(context: string, error: { message: string }): Response {
  console.error(`[db] ${context}: ${error.message}`);
  return apiError(
    500,
    "Something went wrong on our end. Please try again.",
    "DB_ERROR",
  );
}

/**
 * Report an unhandled exception without echoing it back to the caller.
 *
 * The thrown message can carry file paths, driver internals or fragments of the
 * offending value. None of it helps the caller, and some of it helps an
 * attacker. Log it with a route label; return something a person can read.
 */
export function unexpectedError(context: string, err: unknown): Response {
  const detail = err instanceof Error ? err.stack ?? err.message : String(err);
  console.error(`[api] ${context}: ${detail}`);
  return apiError(
    500,
    "Something went wrong on our end. Please try again.",
    "INTERNAL_ERROR",
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
