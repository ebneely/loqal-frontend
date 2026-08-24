import type { z } from "zod";

import { apiErrorSchema } from "@loqal/contracts/errors";

/**
 * The typed API client, shared by server components and the browser.
 *
 * Every call takes the zod schema it expects back and returns that schema's
 * type. Nothing reaches a screen unparsed: a body that no longer matches its
 * contract fails here, once, with the path and the issues attached, instead of
 * arriving three components away as `undefined` inside a price.
 *
 * TWO CALLERS, ONE FUNCTION. On the browser the request is same-origin and
 * relative — /api/... — so it lands on the BFF proxy in
 * src/app/api/[...path]/route.ts and carries the session cookie with no CORS
 * entry, no cookie Domain and no API origin in the client bundle. On the server
 * there is no origin to be relative to, so the same path is resolved against
 * LOQAL_API_ORIGIN directly and the proxy is skipped — going back out through
 * our own public URL to reach a service on the same network is a round trip
 * that can only add latency and a failure mode.
 */

/**
 * A failure the API described. `statusCode` is the API's own number, taken from
 * its single error body ({ statusCode, message, error }) rather than guessed
 * from the transport, so a screen can branch on 403 the same way the Nest
 * RolesGuard decided it.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly error: string;

  constructor(statusCode: number, message: string, error: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.error = error;
  }

  get isUnauthenticated(): boolean {
    return this.statusCode === 401;
  }

  get isPermissionDenied(): boolean {
    return this.statusCode === 403;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /** Stock ran out, or a variant went away between browsing and checkout. */
  get isConflict(): boolean {
    return this.statusCode === 409;
  }
}

/** A success body that did not match the contract it was requested under. */
export class ApiShapeError extends Error {
  readonly path: string;
  readonly issues: readonly { path: string; message: string }[];

  constructor(path: string, issues: readonly { path: string; message: string }[]) {
    super(
      `The API answered ${path} with a body that does not match its contract: ` +
        issues.map((i) => `${i.path || "(root)"} — ${i.message}`).join("; ")
    );
    this.name = "ApiShapeError";
    this.path = path;
    this.issues = issues;
  }
}

/**
 * An array becomes a repeated parameter — see the serialiser below. Nested
 * arrays are deliberately not representable: a query string has no shape for
 * them, and allowing one here would produce "[object Object]" at the wire.
 */
export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly (string | number)[];

export type RequestOptions = {
  /** Undefined and null entries are dropped rather than sent as "undefined". */
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  headers?: HeadersInit;
  /**
   * Next's fetch cache directives. Only meaningful on the server; ignored in
   * the browser. A catalogue read passes `{ revalidate: 300 }`; anything
   * carrying a session passes nothing and stays uncached.
   */
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
};

const isServer = typeof window === "undefined";

/**
 * Where the backend lives, for SERVER-side calls only.
 *
 * Defaulting to localhost is right in development and dangerous in production:
 * a deployed storefront with this unset reaches nothing, every catalogue read
 * rejects, and the screens render their empty states — so a total outage looks
 * exactly like a marketplace with no shops in it. That is what a first deploy
 * to Vercel actually did.
 *
 * So a server call with it unset throws this sentence instead of quietly
 * dialling localhost. Resolved PER CALL rather than at module load on purpose:
 * throwing at import time would fail `next build` outright, including for the
 * static pages that need no API at all. This way the build still succeeds, the
 * screens render the error state they already have, and the reason is in the
 * server log rather than nowhere.
 */
function resolveApiOrigin(): string {
  const configured = process.env.LOQAL_API_ORIGIN;
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "LOQAL_API_ORIGIN is not set. The storefront has no backend to read from — " +
        "set it to the API's origin (for example https://api.loqal.com) in the " +
        "deployment's environment variables."
    );
  }

  // 127.0.0.1 rather than localhost: localhost resolves to ::1 first on
  // Windows and Nest listens on IPv4, so `localhost` fails to connect here for
  // no visible reason.
  return "http://127.0.0.1:3001";
}



/**
 * On the server the backend is addressed directly, mount prefix and all. In the
 * browser the same logical path goes through this app's own /api proxy, which
 * appends the backend's `api` prefix itself.
 */
const resolve = (path: string) => {
  const rooted = path.startsWith("/") ? path : `/${path}`;
  if (isServer) return `${resolveApiOrigin()}/api${rooted}`;
  return `/api${rooted}`;
};

const withQuery = (url: string, query: RequestOptions["query"]) => {
  if (!query) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    /**
     * An array becomes a REPEATED parameter — `?sizes=L&sizes=M` — which is
     * what the API's DTOs normalise. Falling through to `String(value)` would
     * also "work", because that yields "L,M" and the DTO happens to split on
     * commas, but only by accident: a value containing a comma would then
     * silently become two filters. An empty array contributes nothing rather
     * than an empty parameter, which is a cleared filter, not a filter for "".
     */
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry === undefined || entry === null || entry === "") continue;
        search.append(key, String(entry));
      }
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
};

async function request<T extends z.ZodTypeAny>(
  schema: T,
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<z.infer<T>> {
  const url = withQuery(resolve(path), options.query);

  const headers = new Headers(options.headers);
  if (body !== undefined) headers.set("content-type", "application/json");

  /**
   * A server-side call has no browser to attach the cookie for it, so the
   * incoming request's cookie header is forwarded by the caller through
   * `options.headers`. `serverApi` below does that; nothing else has to.
   */
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options.signal,
    credentials: isServer ? undefined : "include",
    ...(options.cache ? { cache: options.cache } : {}),
    ...(options.next ? { next: options.next } : {}),
  });

  if (!response.ok) {
    // The API answers every failure with one body shape. Parsing it rather than
    // reading `response.statusText` is what lets a screen branch on 403 for the
    // reason the server actually gave.
    const raw: unknown = await response.json().catch(() => null);
    const parsed = apiErrorSchema.safeParse(raw);
    if (parsed.success) {
      throw new ApiError(parsed.data.statusCode, parsed.data.message, parsed.data.error);
    }
    throw new ApiError(response.status, response.statusText || "Request failed", "Error");
  }

  // 204 and friends. `schema.parse(undefined)` is correct for z.void()/z.unknown().
  if (response.status === 204) return schema.parse(undefined) as z.infer<T>;

  const json: unknown = await response.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiShapeError(
      path,
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }))
    );
  }
  return parsed.data;
}

export const api = {
  get: <T extends z.ZodTypeAny>(schema: T, path: string, options?: RequestOptions) =>
    request(schema, "GET", path, undefined, options),
  post: <T extends z.ZodTypeAny>(
    schema: T,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ) => request(schema, "POST", path, body, options),
  patch: <T extends z.ZodTypeAny>(
    schema: T,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ) => request(schema, "PATCH", path, body, options),
  put: <T extends z.ZodTypeAny>(
    schema: T,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ) => request(schema, "PUT", path, body, options),
  delete: <T extends z.ZodTypeAny>(schema: T, path: string, options?: RequestOptions) =>
    request(schema, "DELETE", path, undefined, options),
};
