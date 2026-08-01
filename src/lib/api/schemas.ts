import { z } from "zod";
import { apiError } from "./errors";

/**
 * Request-body schemas for the v1 API.
 *
 * `zod` was already a dependency but imported nowhere — every route parsed
 * `await request.json()` straight into a type assertion, so anything a client
 * sent reached the database unchecked.
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

/**
 * A destination a browser will be redirected to.
 *
 * Scheme is allow-listed: the scan route hands this value to
 * `NextResponse.redirect()`, so accepting `javascript:` or `data:` would turn
 * every dynamic QR code into a stored-XSS delivery mechanism.
 */
export const destinationUrlSchema = z
  .string()
  .trim()
  .min(1, "A destination URL is required")
  .max(2048, "That URL is too long")
  .transform((value) =>
    /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`,
  )
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a valid http:// or https:// URL");

export const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

// ---------------------------------------------------------------------------
// QR codes
// ---------------------------------------------------------------------------

export const qrContentTypeSchema = z.enum([
  "url",
  "text",
  "email",
  "phone",
  "sms",
  "wifi",
  "vcard",
  "geo",
  "event",
  "app_store",
]);

/**
 * Accept `null` as "absent" as well as `undefined`.
 *
 * Rows read back from Postgres carry `null` for unset columns, so any client
 * that round-trips a record — duplicating a code, for instance — will send
 * `null` rather than omitting the key. A bare `.optional()` rejects that and
 * fails the request with a validation error the user cannot act on.
 */
const absentable = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().transform((v) => v ?? undefined);

export const createQRSchema = z
  .object({
    name: z.string().trim().min(1, "Give the code a name").max(120),
    contentType: qrContentTypeSchema,
    type: z.enum(["static", "dynamic"]).default("static"),
    destinationUrl: absentable(destinationUrlSchema),
    staticData: absentable(z.record(z.string(), jsonValueSchema)),
    style: absentable(z.record(z.string(), jsonValueSchema)),
    projectId: absentable(z.uuid()),
    /**
     * Create the code unpublished. Duplicating sends `false` so the copy is
     * editable before anyone can reach it — a hosted contact card is live from
     * the moment it exists, and a copy starts out holding somebody else's
     * details.
     */
    isActive: z.boolean().optional(),
    tags: z
      .array(z.string().trim().min(1).max(40))
      .max(20)
      .nullish()
      .transform((v) => v ?? []),
  })
  .refine(
    (body) => body.type !== "dynamic" || !!body.destinationUrl,
    {
      message: "Dynamic codes need a destination URL",
      path: ["destinationUrl"],
    },
  );

export type CreateQRInput = z.infer<typeof createQRSchema>;

export const updateQRSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  destinationUrl: destinationUrlSchema.optional(),
  staticData: z.record(z.string(), jsonValueSchema).optional(),
  style: z.record(z.string(), jsonValueSchema).optional(),
  projectId: z.uuid().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.iso.datetime().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Give the project a name").max(80),
  description: z.string().trim().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #7C5CFF")
    .optional(),
  icon: z.string().trim().max(40).optional(),
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

/**
 * Parse and validate a JSON request body.
 *
 * Returns a 400 with the first field-level message rather than zod's raw issue
 * tree, so the client can surface something a person can act on.
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: apiError(400, "Expected a JSON body", "INVALID_JSON"),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const field = first?.path.join(".");
    const message = first?.message ?? "Invalid request body";
    return {
      ok: false,
      response: apiError(
        400,
        field ? `${field}: ${message}` : message,
        "VALIDATION_ERROR",
      ),
    };
  }

  return { ok: true, data: result.data };
}
