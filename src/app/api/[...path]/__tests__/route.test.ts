// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The storefront's proxy had no tests, and the failure it shipped was one a
 * test would have caught immediately: with LOQAL_API_ORIGIN unset in
 * production it dialled its own loopback, fetch threw, and Next answered 500
 * with an empty body. The shop list rendered "we cannot reach the shops" while
 * the API was healthy, and neither the status, the body nor the logs named the
 * missing variable.
 */

const params = (...path: string[]) => ({ params: Promise.resolve({ path }) });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  // The proxy logs the reason on purpose; the test asserts it, and keeping it
  // out of the run's output stops a passing suite looking like a failing one.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("storefront BFF proxy", () => {
  it("refuses in production when the API origin is not configured", async () => {
    vi.stubEnv("LOQAL_API_ORIGIN", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { GET } = await import("../route");

    const response = await GET(
      new Request("http://localhost:3000/api/v1/brands"),
      params("v1", "brands")
    );

    expect(response.status).toBe(503);
    // Refusing beats guessing: dialling loopback is what made this silent.
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({ statusCode: 503 });
    expect(console.error).toHaveBeenCalled();
  });

  it("answers 502 when the API cannot be reached", async () => {
    vi.stubEnv("LOQAL_API_ORIGIN", "http://10.0.0.4:4000");
    vi.resetModules();
    const { GET } = await import("../route");
    fetchMock.mockRejectedValue(
      Object.assign(new Error("fetch failed"), { code: "ECONNREFUSED" })
    );

    const response = await GET(
      new Request("http://localhost:3000/api/v1/brands"),
      params("v1", "brands")
    );

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toMatchObject({ statusCode: 502 });
    // Keeping the API origin off the client is the reason this proxy exists,
    // and an error body is still a response.
    expect(JSON.stringify(body)).not.toContain("10.0.0.4");
  });

  it("forwards to the configured origin under the API's /api prefix", async () => {
    vi.stubEnv("LOQAL_API_ORIGIN", "http://10.0.0.4:4000");
    vi.resetModules();
    const { GET } = await import("../route");
    fetchMock.mockResolvedValue(new Response("{}"));

    await GET(
      new Request("http://localhost:3000/api/v1/brands?page=2"),
      params("v1", "brands")
    );

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://10.0.0.4:4000/api/v1/brands?page=2"
    );
  });
});
