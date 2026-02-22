import { describe, it, expect } from 'vitest'
import { MonigoClient } from '../src/client.js'
import { MonigoAPIError } from '../src/errors.js'
import { jsonResponse, errorResponse, mockClient } from './helpers.js'

describe('MonigoClient constructor', () => {
  it('throws when apiKey is missing', () => {
    expect(() => new MonigoClient({ apiKey: '' })).toThrow('apiKey is required')
  })

  it('uses default baseURL', () => {
    const client = new MonigoClient({ apiKey: 'test' })
    expect(client._baseURL).toBe('https://api.monigo.co')
  })

  it('trims trailing slash from baseURL', () => {
    const client = new MonigoClient({
      apiKey: 'test',
      baseURL: 'https://self-hosted.example.com/',
    })
    expect(client._baseURL).toBe('https://self-hosted.example.com')
  })

  it('uses custom baseURL', () => {
    const client = new MonigoClient({
      apiKey: 'test',
      baseURL: 'http://localhost:8080',
    })
    expect(client._baseURL).toBe('http://localhost:8080')
  })

  it('uses custom timeout', () => {
    const client = new MonigoClient({ apiKey: 'test', timeout: 5000 })
    expect(client._timeout).toBe(5000)
  })

  it('mounts all resource services', () => {
    const client = new MonigoClient({ apiKey: 'test' })
    expect(client.events).toBeDefined()
    expect(client.customers).toBeDefined()
    expect(client.metrics).toBeDefined()
    expect(client.plans).toBeDefined()
    expect(client.subscriptions).toBeDefined()
    expect(client.payoutAccounts).toBeDefined()
    expect(client.invoices).toBeDefined()
    expect(client.usage).toBeDefined()
  })
})

describe('MonigoClient._request', () => {
  it('sends Authorization header', async () => {
    let capturedHeaders: HeadersInit | undefined
    const client = mockClient((_url, init) => {
      capturedHeaders = init?.headers
      return jsonResponse({ ok: true })
    })
    await client._request('GET', '/v1/test')
    const headers = capturedHeaders as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer test_key_abc')
  })

  it('appends query params to the URL', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ ok: true })
    })
    await client._request('GET', '/v1/test', {
      query: { foo: 'bar', baz: 'qux' },
    })
    expect(capturedURL).toContain('foo=bar')
    expect(capturedURL).toContain('baz=qux')
  })

  it('omits undefined query params', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ ok: true })
    })
    await client._request('GET', '/v1/test', {
      query: { foo: 'bar', missing: undefined },
    })
    expect(capturedURL).not.toContain('missing')
  })

  it('serialises request body as JSON', async () => {
    let capturedBody = ''
    const client = mockClient((_url, init) => {
      capturedBody = init?.body as string
      return jsonResponse({ ok: true })
    })
    await client._request('POST', '/v1/test', { body: { hello: 'world' } })
    expect(JSON.parse(capturedBody)).toEqual({ hello: 'world' })
  })

  it('returns undefined for empty response body', async () => {
    const client = mockClient(() => new Response('', { status: 200 }))
    const result = await client._request<unknown>('DELETE', '/v1/test')
    expect(result).toBeUndefined()
  })

  it('throws MonigoAPIError for 4xx responses', async () => {
    const client = mockClient(() => errorResponse('not found', 404))
    await expect(client._request('GET', '/v1/test')).rejects.toBeInstanceOf(
      MonigoAPIError,
    )
  })

  it('includes statusCode on the error', async () => {
    const client = mockClient(() => errorResponse('not found', 404))
    try {
      await client._request('GET', '/v1/test')
    } catch (err) {
      expect(err).toBeInstanceOf(MonigoAPIError)
      expect((err as MonigoAPIError).statusCode).toBe(404)
      expect((err as MonigoAPIError).message).toBe('not found')
    }
  })

  it('throws MonigoAPIError for 5xx responses', async () => {
    const client = mockClient(() => errorResponse('internal error', 500))
    await expect(client._request('GET', '/v1/test')).rejects.toBeInstanceOf(
      MonigoAPIError,
    )
  })
})

describe('MonigoClient.toISOString', () => {
  it('converts a Date to ISO string', () => {
    const d = new Date('2025-06-15T12:00:00.000Z')
    expect(MonigoClient.toISOString(d)).toBe('2025-06-15T12:00:00.000Z')
  })

  it('passes through a string unchanged', () => {
    expect(MonigoClient.toISOString('2025-01-01T00:00:00Z')).toBe(
      '2025-01-01T00:00:00Z',
    )
  })
})
