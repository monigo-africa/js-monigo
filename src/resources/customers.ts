import type { MonigoClient, MutationOptions } from '../client.js'
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ListCustomersResponse,
} from '../types.js'

/** Manage end-customers in your Monigo organisation. */
export class CustomersResource {
  constructor(private readonly client: MonigoClient) {}

  /**
   * Register a new customer.
   *
   * **Requires `write` scope.**
   *
   * @example
   * ```ts
   * const customer = await monigo.customers.create({
   *   external_id: 'usr_12345',
   *   name: 'Acme Corp',
   *   email: 'billing@acme.com',
   *   metadata: { plan_tier: 'enterprise' },
   * })
   * ```
   */
  async create(request: CreateCustomerRequest, options?: MutationOptions): Promise<Customer> {
    const wrapper = await this.client._request<{ customer: Customer }>(
      'POST',
      '/v1/customers',
      { body: request, idempotencyKey: options?.idempotencyKey },
    )
    return wrapper.customer
  }

  /**
   * Return all customers in the authenticated organisation.
   *
   * **Requires `read` scope.**
   */
  async list(): Promise<ListCustomersResponse> {
    return this.client._request<ListCustomersResponse>('GET', '/v1/customers')
  }

  /**
   * Fetch a single customer by their Monigo UUID.
   *
   * **Requires `read` scope.**
   */
  async get(customerId: string): Promise<Customer> {
    const wrapper = await this.client._request<{ customer: Customer }>(
      'GET',
      `/v1/customers/${customerId}`,
    )
    return wrapper.customer
  }

  /**
   * Update a customer's name, email, or metadata.
   * Only fields that are present in `request` are updated.
   *
   * **Requires `write` scope.**
   *
   * @example
   * ```ts
   * const updated = await monigo.customers.update(customerId, {
   *   email: 'new@acme.com',
   * })
   * ```
   */
  async update(
    customerId: string,
    request: UpdateCustomerRequest,
    options?: MutationOptions,
  ): Promise<Customer> {
    const wrapper = await this.client._request<{ customer: Customer }>(
      'PUT',
      `/v1/customers/${customerId}`,
      { body: request, idempotencyKey: options?.idempotencyKey },
    )
    return wrapper.customer
  }

  /**
   * Permanently delete a customer record.
   *
   * **Requires `write` scope.**
   */
  async delete(customerId: string): Promise<void> {
    await this.client._request<void>('DELETE', `/v1/customers/${customerId}`)
  }
}
