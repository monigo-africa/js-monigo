import { describe, it, expect } from 'vitest'
import { mockClient, jsonResponse, errorResponse } from './helpers.js'
import type { Subscription, ListSubscriptionsResponse } from '../src/types.js'

const SUB: Subscription = {
  id: 'sub_1',
  org_id: 'org_1',
  customer_id: 'cust_1',
  plan_id: 'plan_1',
  status: 'active',
  current_period_start: '2025-01-01T00:00:00Z',
  current_period_end: '2025-01-31T23:59:59Z',
  trial_ends_at: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('subscriptions.create', () => {
  it('posts to /v1/subscriptions and unwraps subscription', async () => {
    let capturedURL = ''
    let capturedMethod = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return jsonResponse({ subscription: SUB })
    })
    const result = await client.subscriptions.create({
      customer_id: 'cust_1',
      plan_id: 'plan_1',
    })
    expect(capturedMethod).toBe('POST')
    expect(capturedURL).toContain('/v1/subscriptions')
    expect(result.id).toBe('sub_1')
    expect(result.status).toBe('active')
  })

  it('throws 409 on duplicate subscription', async () => {
    const client = mockClient(() => errorResponse('already subscribed', 409))
    await expect(
      client.subscriptions.create({ customer_id: 'c', plan_id: 'p' }),
    ).rejects.toMatchObject({ statusCode: 409 })
  })
})

describe('subscriptions.list', () => {
  it('returns all subscriptions when no params given', async () => {
    const listResponse: ListSubscriptionsResponse = { subscriptions: [SUB], count: 1 }
    const client = mockClient(() => jsonResponse(listResponse))
    const result = await client.subscriptions.list()
    expect(result.subscriptions).toHaveLength(1)
    expect(result.count).toBe(1)
  })

  it('passes query params to URL', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ subscriptions: [], count: 0 })
    })
    await client.subscriptions.list({ customer_id: 'cust_1', status: 'active' })
    expect(capturedURL).toContain('customer_id=cust_1')
    expect(capturedURL).toContain('status=active')
  })
})

describe('subscriptions.get', () => {
  it('gets /v1/subscriptions/:id and unwraps subscription', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ subscription: SUB })
    })
    const result = await client.subscriptions.get('sub_1')
    expect(capturedURL).toContain('/v1/subscriptions/sub_1')
    expect(result.id).toBe('sub_1')
  })
})

describe('subscriptions.updateStatus', () => {
  it('patches /v1/subscriptions/:id with new status', async () => {
    let capturedMethod = ''
    let capturedBody = ''
    const client = mockClient((_url, init) => {
      capturedMethod = init?.method ?? ''
      capturedBody = init?.body as string
      return jsonResponse({ subscription: { ...SUB, status: 'paused' } })
    })
    const result = await client.subscriptions.updateStatus('sub_1', 'paused')
    expect(capturedMethod).toBe('PATCH')
    expect(JSON.parse(capturedBody)).toEqual({ status: 'paused' })
    expect(result.status).toBe('paused')
  })
})

describe('subscriptions.delete', () => {
  it('sends DELETE /v1/subscriptions/:id', async () => {
    let capturedMethod = ''
    const client = mockClient((_url, init) => {
      capturedMethod = init?.method ?? ''
      return new Response(null, { status: 204 })
    })
    await client.subscriptions.delete('sub_1')
    expect(capturedMethod).toBe('DELETE')
  })
})
