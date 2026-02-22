import { MonigoClient } from '../client.js'
import type {
  IngestRequest,
  IngestResponse,
  StartReplayRequest,
  EventReplayJob,
} from '../types.js'

/** Handles usage event ingestion and asynchronous event replay. */
export class EventsResource {
  constructor(private readonly client: MonigoClient) {}

  /**
   * Ingest one or more usage events into the Monigo pipeline.
   *
   * Events are processed asynchronously. The response confirms receipt
   * and reports any duplicate idempotency keys.
   *
   * **Requires `ingest` scope.**
   *
   * @example
   * ```ts
   * const result = await monigo.events.ingest({
   *   events: [{
   *     event_name: 'api_call',
   *     customer_id: 'cust_abc',
   *     idempotency_key: crypto.randomUUID(),
   *     timestamp: new Date().toISOString(),
   *     properties: { endpoint: '/checkout', region: 'eu-west-1' },
   *   }],
   * })
   * console.log('Ingested:', result.ingested.length)
   * console.log('Duplicates:', result.duplicates.length)
   * ```
   */
  async ingest(request: IngestRequest): Promise<IngestResponse> {
    const body = {
      events: request.events.map((e) => ({
        ...e,
        timestamp: e.timestamp
          ? MonigoClient.toISOString(e.timestamp)
          : new Date().toISOString(),
      })),
    }
    return this.client._request<IngestResponse>('POST', '/v1/ingest', { body })
  }

  /**
   * Start an asynchronous replay of all raw events in a given time window
   * through the current processing pipeline. Useful for backfilling usage
   * data after changing metric definitions.
   *
   * Returns a replay job immediately — poll `getReplay()` to track progress.
   *
   * **Requires `ingest` scope.**
   *
   * @example
   * ```ts
   * const job = await monigo.events.startReplay({
   *   from: '2025-01-01T00:00:00Z',
   *   to: '2025-01-31T23:59:59Z',
   *   event_name: 'api_call', // omit to replay all event types
   * })
   * console.log('Replay job:', job.id, job.status)
   * ```
   */
  async startReplay(request: StartReplayRequest): Promise<EventReplayJob> {
    const body = {
      from: MonigoClient.toISOString(request.from),
      to: MonigoClient.toISOString(request.to),
      ...(request.event_name ? { event_name: request.event_name } : {}),
    }
    const wrapper = await this.client._request<{ job: EventReplayJob }>(
      'POST',
      '/v1/events/replay',
      { body },
    )
    return wrapper.job
  }

  /**
   * Fetch the current status and progress of an event replay job.
   *
   * **Requires `ingest` scope.**
   *
   * @example
   * ```ts
   * const job = await monigo.events.getReplay(jobId)
   * if (job.status === 'completed') {
   *   console.log(`Replayed ${job.events_replayed} / ${job.events_total} events`)
   * }
   * ```
   */
  async getReplay(jobId: string): Promise<EventReplayJob> {
    const wrapper = await this.client._request<{ job: EventReplayJob }>(
      'GET',
      `/v1/events/replay/${jobId}`,
    )
    return wrapper.job
  }
}
