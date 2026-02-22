import { MonigoClient } from '../client.js'
import type { UsageQueryParams, UsageQueryResult } from '../types.js'

/** Query aggregated usage rollups from the Monigo metering pipeline. */
export class UsageResource {
  constructor(private readonly client: MonigoClient) {}

  /**
   * Return per-customer, per-metric usage rollups for the organisation.
   * All parameters are optional — omitting them returns the full current
   * billing period for all customers and metrics.
   *
   * **Requires `read` scope.**
   *
   * @example
   * ```ts
   * // All usage for one customer this period
   * const { rollups } = await monigo.usage.query({
   *   customer_id: 'cust_abc',
   * })
   *
   * // Filtered by metric and custom date range
   * const { rollups: filtered } = await monigo.usage.query({
   *   metric_id: 'metric_xyz',
   *   from: '2025-01-01T00:00:00Z',
   *   to: '2025-01-31T23:59:59Z',
   * })
   * ```
   */
  async query(params: UsageQueryParams = {}): Promise<UsageQueryResult> {
    const query: Record<string, string | undefined> = {
      customer_id: params.customer_id,
      metric_id: params.metric_id,
    }
    if (params.from !== undefined) {
      query.from = MonigoClient.toISOString(params.from)
    }
    if (params.to !== undefined) {
      query.to = MonigoClient.toISOString(params.to)
    }
    return this.client._request<UsageQueryResult>('GET', '/v1/usage', { query })
  }
}
