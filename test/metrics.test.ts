import { describe, it, expect } from 'vitest'
import { mockClient, jsonResponse, errorResponse } from './helpers.js'
import type { Metric, ListMetricsResponse } from '../src/types.js'

const METRIC: Metric = {
  id: 'metric_1',
  org_id: 'org_1',
  name: 'API Calls',
  event_name: 'api_call',
  aggregation: 'count',
  description: 'Total API calls',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('metrics.create', () => {
  it('posts to /v1/metrics and unwraps metric', async () => {
    const client = mockClient(() => jsonResponse({ metric: METRIC }))
    const result = await client.metrics.create({
      name: 'API Calls',
      event_name: 'api_call',
      aggregation: 'count',
    })
    expect(result.id).toBe('metric_1')
    expect(result.aggregation).toBe('count')
  })
})

describe('metrics.list', () => {
  it('returns all metrics', async () => {
    const listResponse: ListMetricsResponse = { metrics: [METRIC], count: 1 }
    const client = mockClient(() => jsonResponse(listResponse))
    const result = await client.metrics.list()
    expect(result.metrics).toHaveLength(1)
    expect(result.count).toBe(1)
  })
})

describe('metrics.get', () => {
  it('gets /v1/metrics/:id and unwraps metric', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ metric: METRIC })
    })
    const result = await client.metrics.get('metric_1')
    expect(capturedURL).toContain('/v1/metrics/metric_1')
    expect(result.id).toBe('metric_1')
  })

  it('throws 404 for unknown metric', async () => {
    const client = mockClient(() => errorResponse('not found', 404))
    await expect(client.metrics.get('bad')).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('metrics.update', () => {
  it('puts /v1/metrics/:id and returns updated metric', async () => {
    let capturedMethod = ''
    const client = mockClient((_url, init) => {
      capturedMethod = init?.method ?? ''
      return jsonResponse({ metric: { ...METRIC, name: 'Renamed' } })
    })
    const result = await client.metrics.update('metric_1', { name: 'Renamed' })
    expect(capturedMethod).toBe('PUT')
    expect(result.name).toBe('Renamed')
  })
})

describe('metrics.delete', () => {
  it('sends DELETE /v1/metrics/:id', async () => {
    let capturedMethod = ''
    const client = mockClient((_url, init) => {
      capturedMethod = init?.method ?? ''
      return new Response(null, { status: 204 })
    })
    await client.metrics.delete('metric_1')
    expect(capturedMethod).toBe('DELETE')
  })
})
