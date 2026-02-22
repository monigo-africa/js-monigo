import type { MonigoClient, MutationOptions } from '../client.js'
import type {
  Subscription,
  CreateSubscriptionRequest,
  ListSubscriptionsParams,
  ListSubscriptionsResponse,
  SubscriptionStatusValue,
} from '../types.js'

/** Link customers to billing plans and manage subscription lifecycle. */
export class SubscriptionsResource {
  constructor(private readonly client: MonigoClient) {}

  /**
   * Subscribe a customer to a plan.
   *
   * Returns a 409 Conflict error (check with `MonigoAPIError.isConflict(err)`)
   * if the customer already has an active subscription to the same plan.
   *
   * **Requires `write` scope.**
   *
   * @example
   * ```ts
   * const sub = await monigo.subscriptions.create({
   *   customer_id: 'cust_abc',
   *   plan_id: 'plan_xyz',
   * })
   * ```
   */
  async create(request: CreateSubscriptionRequest, options?: MutationOptions): Promise<Subscription> {
    const wrapper = await this.client._request<{ subscription: Subscription }>(
      'POST',
      '/v1/subscriptions',
      { body: request, idempotencyKey: options?.idempotencyKey },
    )
    return wrapper.subscription
  }

  /**
   * Return subscriptions, optionally filtered by customer, plan, or status.
   *
   * **Requires `read` scope.**
   *
   * @example
   * ```ts
   * const { subscriptions } = await monigo.subscriptions.list({
   *   customer_id: 'cust_abc',
   *   status: 'active',
   * })
   * ```
   */
  async list(params: ListSubscriptionsParams = {}): Promise<ListSubscriptionsResponse> {
    return this.client._request<ListSubscriptionsResponse>('GET', '/v1/subscriptions', {
      query: {
        customer_id: params.customer_id,
        plan_id: params.plan_id,
        status: params.status,
      },
    })
  }

  /**
   * Fetch a single subscription by its UUID.
   *
   * **Requires `read` scope.**
   */
  async get(subscriptionId: string): Promise<Subscription> {
    const wrapper = await this.client._request<{ subscription: Subscription }>(
      'GET',
      `/v1/subscriptions/${subscriptionId}`,
    )
    return wrapper.subscription
  }

  /**
   * Change the status of a subscription.
   * Use `SubscriptionStatus` constants: `"active"`, `"paused"`, `"canceled"`.
   *
   * **Requires `write` scope.**
   *
   * @example
   * ```ts
   * await monigo.subscriptions.updateStatus(subId, SubscriptionStatus.Paused)
   * ```
   */
  async updateStatus(
    subscriptionId: string,
    status: SubscriptionStatusValue,
    options?: MutationOptions,
  ): Promise<Subscription> {
    const wrapper = await this.client._request<{ subscription: Subscription }>(
      'PATCH',
      `/v1/subscriptions/${subscriptionId}`,
      { body: { status }, idempotencyKey: options?.idempotencyKey },
    )
    return wrapper.subscription
  }

  /**
   * Cancel and delete a subscription record.
   *
   * **Requires `write` scope.**
   */
  async delete(subscriptionId: string): Promise<void> {
    await this.client._request<void>('DELETE', `/v1/subscriptions/${subscriptionId}`)
  }
}
