import { describe, it, expect } from 'vitest'
import { mockClient, jsonResponse, errorResponse } from './helpers.js'
import type { Plan, ListPlansResponse } from '../src/types.js'

const PLAN: Plan = {
  id: 'plan_1',
  org_id: 'org_1',
  name: 'Pro',
  currency: 'NGN',
  plan_type: 'collection',
  billing_period: 'monthly',
  trial_period_days: 14,
  prices: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('plans.create', () => {
  it('posts to /v1/plans and unwraps plan', async () => {
    let capturedURL = ''
    let capturedMethod = ''
    let capturedBody = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      capturedBody = init?.body as string
      return jsonResponse({ plan: PLAN })
    })
    const result = await client.plans.create({
      name: 'Pro',
      currency: 'NGN',
      billing_period: 'monthly',
      prices: [{ metric_id: 'metric_1', model: 'flat_unit', unit_price: '2.50' }],
    })
    expect(capturedMethod).toBe('POST')
    expect(capturedURL).toContain('/v1/plans')
    expect(JSON.parse(capturedBody)).toMatchObject({ name: 'Pro' })
    expect(result.id).toBe('plan_1')
  })
})

describe('plans.list', () => {
  it('returns all plans', async () => {
    const listResponse: ListPlansResponse = { plans: [PLAN], count: 1 }
    const client = mockClient(() => jsonResponse(listResponse))
    const result = await client.plans.list()
    expect(result.plans).toHaveLength(1)
    expect(result.count).toBe(1)
  })
})

describe('plans.get', () => {
  it('gets /v1/plans/:id and unwraps plan', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ plan: PLAN })
    })
    const result = await client.plans.get('plan_1')
    expect(capturedURL).toContain('/v1/plans/plan_1')
    expect(result.billing_period).toBe('monthly')
  })

  it('throws 404 for unknown plan', async () => {
    const client = mockClient(() => errorResponse('not found', 404))
    await expect(client.plans.get('bad')).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('plans.update', () => {
  it('puts /v1/plans/:id', async () => {
    let capturedMethod = ''
    const client = mockClient((_url, init) => {
      capturedMethod = init?.method ?? ''
      return jsonResponse({ plan: { ...PLAN, name: 'Enterprise' } })
    })
    const result = await client.plans.update('plan_1', { name: 'Enterprise' })
    expect(capturedMethod).toBe('PUT')
    expect(result.name).toBe('Enterprise')
  })
})

describe('plans.delete', () => {
  it('sends DELETE /v1/plans/:id', async () => {
    let capturedMethod = ''
    const client = mockClient((_url, init) => {
      capturedMethod = init?.method ?? ''
      return new Response(null, { status: 204 })
    })
    await client.plans.delete('plan_1')
    expect(capturedMethod).toBe('DELETE')
  })
})
