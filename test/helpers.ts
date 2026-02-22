import { MonigoClient } from '../src/client.js'

/** Handler receives the resolved URL string and fetch init options. */
export type MockHandler = (
  url: string,
  init?: RequestInit,
) => Response | Promise<Response>

/**
 * Create a MonigoClient wired to a mock fetch handler.
 * The client uses baseURL "https://api.monigo.co" and apiKey "test_key_abc".
 */
export function mockClient(handler: MockHandler): MonigoClient {
  const mockFetch = (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const url =
      input instanceof Request
        ? input.url
        : input instanceof URL
          ? input.toString()
          : input
    return Promise.resolve(handler(url, init))
  }

  return new MonigoClient({
    apiKey: 'test_key_abc',
    baseURL: 'https://api.monigo.co',
    fetch: mockFetch as typeof globalThis.fetch,
  })
}

/** Build a JSON Response with the given data and status code. */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Build an error Response matching the Monigo API error shape. */
export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status)
}

/** Assert that a request has the correct Authorization header. */
export function assertAuth(init?: RequestInit): void {
  const auth = (init?.headers as Record<string, string>)?.['Authorization']
  if (auth !== 'Bearer test_key_abc') {
    throw new Error(`Expected Authorization: Bearer test_key_abc, got: ${auth}`)
  }
}
