import { describe, it, expect } from 'vitest'
import { mockClient, jsonResponse } from './helpers.js'
import type { UsageQueryResult, UsageRollup } from '../src/types.js'

const ROLLUP: UsageRollup = {
  id: 'rollup_1',
  org_id: 'org_1',
  customer_id: 'cust_1',
  metric_id: 'metric_1',
  period_start: '2025-01-01T00:00:00Z',
  period_end: '2025-01-31T23:59:59Z',
  aggregation: 'count',
  value: 1500,
  event_count: 1500,
  last_event_at: '2025-01-28T10:00:00Z',
  is_test: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-28T10:00:00Z',
}

describe('usage.query', () => {
  it('gets /v1/usage and returns rollups', async () => {
    const result: UsageQueryResult = { rollups: [ROLLUP], count: 1 }
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse(result)
    })
    const response = await client.usage.query()
    expect(capturedURL).toContain('/v1/usage')
    expect(response.rollups).toHaveLength(1)
    expect(response.rollups[0].value).toBe(1500)
  })

  it('passes customer_id as query param', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ rollups: [], count: 0 })
    })
    await client.usage.query({ customer_id: 'cust_1' })
    expect(capturedURL).toContain('customer_id=cust_1')
  })

  it('passes metric_id as query param', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ rollups: [], count: 0 })
    })
    await client.usage.query({ metric_id: 'metric_1' })
    expect(capturedURL).toContain('metric_id=metric_1')
  })

  it('converts Date from/to to ISO strings', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ rollups: [], count: 0 })
    })
    await client.usage.query({
      from: new Date('2025-01-01T00:00:00.000Z'),
      to: new Date('2025-01-31T23:59:59.000Z'),
    })
    expect(capturedURL).toContain('from=2025-01-01T00%3A00%3A00.000Z')
    expect(capturedURL).toContain('to=2025-01-31T23%3A59%3A59.000Z')
  })

  it('passes string from/to directly', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ rollups: [], count: 0 })
    })
    await client.usage.query({
      from: '2025-01-01T00:00:00Z',
      to: '2025-01-31T00:00:00Z',
    })
    expect(capturedURL).toContain('from=')
    expect(capturedURL).toContain('to=')
  })

  it('returns empty rollups when no data', async () => {
    const client = mockClient(() =>
      jsonResponse({ rollups: [], count: 0 } satisfies UsageQueryResult),
    )
    const result = await client.usage.query({ customer_id: 'unknown' })
    expect(result.rollups).toHaveLength(0)
    expect(result.count).toBe(0)
  })
})
