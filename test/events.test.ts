import { describe, it, expect } from 'vitest'
import { mockClient, jsonResponse, errorResponse } from './helpers.js'
import type { IngestResponse, EventReplayJob } from '../src/types.js'

const INGEST_RESPONSE: IngestResponse = {
  ingested: ['key-1', 'key-2'],
  duplicates: [],
}

const REPLAY_JOB: EventReplayJob = {
  id: 'job_1',
  org_id: 'org_1',
  initiated_by: 'user_1',
  status: 'pending',
  from_timestamp: '2025-01-01T00:00:00Z',
  to_timestamp: '2025-01-31T23:59:59Z',
  event_name: null,
  is_test: false,
  events_total: 0,
  events_replayed: 0,
  error_message: null,
  started_at: null,
  completed_at: null,
  created_at: '2025-02-01T00:00:00Z',
  updated_at: '2025-02-01T00:00:00Z',
}

describe('events.ingest', () => {
  it('posts to /v1/ingest and returns response', async () => {
    let capturedURL = ''
    let capturedMethod = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return jsonResponse(INGEST_RESPONSE)
    })

    const result = await client.events.ingest({
      events: [
        {
          event_name: 'api_call',
          customer_id: 'cust_1',
          idempotency_key: 'key-1',
        },
      ],
    })

    expect(capturedMethod).toBe('POST')
    expect(capturedURL).toContain('/v1/ingest')
    expect(result.ingested).toEqual(['key-1', 'key-2'])
    expect(result.duplicates).toEqual([])
  })

  it('includes default timestamp when none is provided', async () => {
    let capturedBody = ''
    const client = mockClient((_url, init) => {
      capturedBody = init?.body as string
      return jsonResponse(INGEST_RESPONSE)
    })
    await client.events.ingest({
      events: [{ event_name: 'e', customer_id: 'c', idempotency_key: 'k' }],
    })
    const body = JSON.parse(capturedBody) as { events: Array<{ timestamp: string }> }
    expect(body.events[0].timestamp).toBeTruthy()
  })

  it('converts Date timestamp to ISO string', async () => {
    let capturedBody = ''
    const client = mockClient((_url, init) => {
      capturedBody = init?.body as string
      return jsonResponse(INGEST_RESPONSE)
    })
    const d = new Date('2025-06-01T12:00:00.000Z')
    await client.events.ingest({
      events: [
        { event_name: 'e', customer_id: 'c', idempotency_key: 'k', timestamp: d },
      ],
    })
    const body = JSON.parse(capturedBody) as { events: Array<{ timestamp: string }> }
    expect(body.events[0].timestamp).toBe('2025-06-01T12:00:00.000Z')
  })

  it('throws MonigoAPIError on non-2xx', async () => {
    const client = mockClient(() => errorResponse('quota exceeded', 402))
    await expect(
      client.events.ingest({
        events: [{ event_name: 'e', customer_id: 'c', idempotency_key: 'k' }],
      }),
    ).rejects.toMatchObject({ statusCode: 402 })
  })
})

describe('events.startReplay', () => {
  it('posts to /v1/events/replay and unwraps job', async () => {
    const client = mockClient(() => jsonResponse({ job: REPLAY_JOB }))
    const job = await client.events.startReplay({
      from: '2025-01-01T00:00:00Z',
      to: '2025-01-31T23:59:59Z',
    })
    expect(job.id).toBe('job_1')
    expect(job.status).toBe('pending')
  })

  it('includes event_name when provided', async () => {
    let capturedBody = ''
    const client = mockClient((_url, init) => {
      capturedBody = init?.body as string
      return jsonResponse({ job: REPLAY_JOB })
    })
    await client.events.startReplay({
      from: '2025-01-01T00:00:00Z',
      to: '2025-01-31T23:59:59Z',
      event_name: 'api_call',
    })
    expect(JSON.parse(capturedBody)).toMatchObject({ event_name: 'api_call' })
  })

  it('converts Date values to ISO strings', async () => {
    let capturedBody = ''
    const client = mockClient((_url, init) => {
      capturedBody = init?.body as string
      return jsonResponse({ job: REPLAY_JOB })
    })
    await client.events.startReplay({
      from: new Date('2025-01-01T00:00:00.000Z'),
      to: new Date('2025-01-31T00:00:00.000Z'),
    })
    const body = JSON.parse(capturedBody) as { from: string; to: string }
    expect(body.from).toBe('2025-01-01T00:00:00.000Z')
    expect(body.to).toBe('2025-01-31T00:00:00.000Z')
  })
})

describe('events.getReplay', () => {
  it('gets /v1/events/replay/:id and unwraps job', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ job: { ...REPLAY_JOB, status: 'completed' } })
    })
    const job = await client.events.getReplay('job_1')
    expect(capturedURL).toContain('/v1/events/replay/job_1')
    expect(job.status).toBe('completed')
  })
})
