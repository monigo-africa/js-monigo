import type { MonigoClient, MutationOptions } from '../client.js'
import type {
  Metric,
  CreateMetricRequest,
  UpdateMetricRequest,
  ListMetricsResponse,
} from '../types.js'

/** Manage billing metrics — what usage gets counted and how it is aggregated. */
export class MetricsResource {
  constructor(private readonly client: MonigoClient) {}

  /**
   * Create a new metric.
   *
   * **Requires `write` scope.**
   *
   * @example
   * ```ts
   * const metric = await monigo.metrics.create({
   *   name: 'API Calls',
   *   event_name: 'api_call',
   *   aggregation: 'count',
   * })
   * ```
   */
  async create(request: CreateMetricRequest, options?: MutationOptions): Promise<Metric> {
    const wrapper = await this.client._request<{ metric: Metric }>(
      'POST',
      '/v1/metrics',
      { body: request, idempotencyKey: options?.idempotencyKey },
    )
    return wrapper.metric
  }

  /**
   * Return all metrics in the authenticated organisation.
   *
   * **Requires `read` scope.**
   */
  async list(): Promise<ListMetricsResponse> {
    return this.client._request<ListMetricsResponse>('GET', '/v1/metrics')
  }

  /**
   * Fetch a single metric by its UUID.
   *
   * **Requires `read` scope.**
   */
  async get(metricId: string): Promise<Metric> {
    const wrapper = await this.client._request<{ metric: Metric }>(
      'GET',
      `/v1/metrics/${metricId}`,
    )
    return wrapper.metric
  }

  /**
   * Update a metric's name, event name, aggregation, or description.
   *
   * **Requires `write` scope.**
   */
  async update(metricId: string, request: UpdateMetricRequest, options?: MutationOptions): Promise<Metric> {
    const wrapper = await this.client._request<{ metric: Metric }>(
      'PUT',
      `/v1/metrics/${metricId}`,
      { body: request, idempotencyKey: options?.idempotencyKey },
    )
    return wrapper.metric
  }

  /**
   * Permanently delete a metric.
   *
   * **Requires `write` scope.**
   */
  async delete(metricId: string): Promise<void> {
    await this.client._request<void>('DELETE', `/v1/metrics/${metricId}`)
  }
}
