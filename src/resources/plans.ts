import type { MonigoClient } from '../client.js'
import type {
  Plan,
  CreatePlanRequest,
  UpdatePlanRequest,
  ListPlansResponse,
} from '../types.js'

/** Manage billing plans and their prices. */
export class PlansResource {
  constructor(private readonly client: MonigoClient) {}

  /**
   * Create a new billing plan, optionally with prices attached.
   *
   * **Requires `write` scope.**
   *
   * @example
   * ```ts
   * const plan = await monigo.plans.create({
   *   name: 'Pro',
   *   currency: 'NGN',
   *   billing_period: 'monthly',
   *   prices: [{
   *     metric_id: 'metric_abc',
   *     model: 'flat',
   *     unit_price: '2.500000',
   *   }],
   * })
   * ```
   */
  async create(request: CreatePlanRequest): Promise<Plan> {
    const wrapper = await this.client._request<{ plan: Plan }>(
      'POST',
      '/v1/plans',
      { body: request },
    )
    return wrapper.plan
  }

  /**
   * Return all billing plans in the authenticated organisation.
   *
   * **Requires `read` scope.**
   */
  async list(): Promise<ListPlansResponse> {
    return this.client._request<ListPlansResponse>('GET', '/v1/plans')
  }

  /**
   * Fetch a single plan by its UUID, including its prices.
   *
   * **Requires `read` scope.**
   */
  async get(planId: string): Promise<Plan> {
    const wrapper = await this.client._request<{ plan: Plan }>(
      'GET',
      `/v1/plans/${planId}`,
    )
    return wrapper.plan
  }

  /**
   * Update a plan's name, description, currency, or prices.
   *
   * **Requires `write` scope.**
   */
  async update(planId: string, request: UpdatePlanRequest): Promise<Plan> {
    const wrapper = await this.client._request<{ plan: Plan }>(
      'PUT',
      `/v1/plans/${planId}`,
      { body: request },
    )
    return wrapper.plan
  }

  /**
   * Permanently delete a plan.
   *
   * **Requires `write` scope.**
   */
  async delete(planId: string): Promise<void> {
    await this.client._request<void>('DELETE', `/v1/plans/${planId}`)
  }
}
