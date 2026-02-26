import { describe, it, expect } from 'vitest'
import { mockClient, jsonResponse, errorResponse, assertAuth } from './helpers.js'
import type { PortalToken, ListPortalTokensResponse } from '../src/types.js'

const TOKEN: PortalToken = {
  id: 'tok-1',
  org_id: 'org-1',
  customer_id: 'cust-1',
  token: 'aabbccdd1122334455667788aabbccdd1122334455667788aabbccdd11223344',
  label: 'Invoice link',
  expires_at: null,
  revoked_at: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  portal_url: 'https://app.monigo.co/portal/aabbccdd1122334455667788aabbccdd1122334455667788aabbccdd11223344',
}

describe('portalTokens.create', () => {
  it('posts to /v1/portal/tokens and unwraps the token', async () => {
    let capturedURL = ''
    let capturedMethod = ''
    let capturedBody: unknown
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      capturedBody = JSON.parse(init?.body as string)
      return jsonResponse({ token: TOKEN, portal_url: TOKEN.portal_url })
    })

    const result = await client.portalTokens.create({
      customer_external_id: 'usr_abc123',
      label: 'Invoice link',
    })

    expect(capturedMethod).toBe('POST')
    expect(capturedURL).toContain('/v1/portal/tokens')
    expect((capturedBody as Record<string, string>).customer_external_id).toBe('usr_abc123')
    expect(result.id).toBe('tok-1')
    expect(result.portal_url).toContain('app.monigo.co/portal/')
  })

  it('sends Authorization header', async () => {
    const client = mockClient((_, init) => {
      assertAuth(init)
      return jsonResponse({ token: TOKEN, portal_url: TOKEN.portal_url })
    })
    await client.portalTokens.create({ customer_external_id: 'usr_abc123' })
  })

  it('includes expires_at when provided', async () => {
    let capturedBody: Record<string, string> = {}
    const client = mockClient((_, init) => {
      capturedBody = JSON.parse(init?.body as string)
      return jsonResponse({ token: TOKEN, portal_url: TOKEN.portal_url })
    })
    await client.portalTokens.create({
      customer_external_id: 'usr_abc123',
      expires_at: '2027-01-01T00:00:00Z',
    })
    expect(capturedBody.expires_at).toBe('2027-01-01T00:00:00Z')
  })

  it('throws 404 when customer is not found', async () => {
    const client = mockClient(() => errorResponse('customer not found', 404))
    await expect(
      client.portalTokens.create({ customer_external_id: 'nonexistent' }),
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('portalTokens.list', () => {
  it('gets /v1/portal/tokens with customer_id query param', async () => {
    let capturedURL = ''
    const listResponse: ListPortalTokensResponse = { tokens: [TOKEN], count: 1 }
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse(listResponse)
    })

    const result = await client.portalTokens.list('cust-1')

    expect(capturedURL).toContain('/v1/portal/tokens')
    expect(capturedURL).toContain('customer_id=cust-1')
    expect(result.tokens).toHaveLength(1)
    expect(result.count).toBe(1)
    expect(result.tokens[0].id).toBe('tok-1')
  })

  it('accepts external_id as customer identifier', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ tokens: [], count: 0 })
    })
    await client.portalTokens.list('usr_abc123')
    expect(capturedURL).toContain('customer_id=usr_abc123')
  })
})

describe('portalTokens.revoke', () => {
  it('sends DELETE /v1/portal/tokens/:tokenId', async () => {
    let capturedURL = ''
    let capturedMethod = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return jsonResponse({ message: 'Portal token revoked successfully' })
    })

    await client.portalTokens.revoke('tok-1')

    expect(capturedMethod).toBe('DELETE')
    expect(capturedURL).toContain('/v1/portal/tokens/tok-1')
  })

  it('throws 404 for unknown token', async () => {
    const client = mockClient(() => errorResponse('portal token not found', 404))
    await expect(
      client.portalTokens.revoke('missing'),
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})
