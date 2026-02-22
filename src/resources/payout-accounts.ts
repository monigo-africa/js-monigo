import type { MonigoClient } from '../client.js'
import type {
  PayoutAccount,
  CreatePayoutAccountRequest,
  UpdatePayoutAccountRequest,
  ListPayoutAccountsResponse,
} from '../types.js'

/** Manage bank and mobile-money payout accounts for customers. */
export class PayoutAccountsResource {
  constructor(private readonly client: MonigoClient) {}

  /**
   * Add a payout account for a customer.
   *
   * **Requires `write` scope.**
   *
   * @example
   * ```ts
   * const account = await monigo.payoutAccounts.create('cust_abc', {
   *   account_name: 'Acme Corp',
   *   payout_method: 'bank_transfer',
   *   bank_name: 'Zenith Bank',
   *   bank_code: '057',
   *   account_number: '1234567890',
   *   currency: 'NGN',
   *   is_default: true,
   * })
   * ```
   */
  async create(
    customerId: string,
    request: CreatePayoutAccountRequest,
  ): Promise<PayoutAccount> {
    const wrapper = await this.client._request<{ payout_account: PayoutAccount }>(
      'POST',
      `/v1/customers/${customerId}/payout-accounts`,
      { body: request },
    )
    return wrapper.payout_account
  }

  /**
   * Return all payout accounts for a customer.
   *
   * **Requires `read` scope.**
   */
  async list(customerId: string): Promise<ListPayoutAccountsResponse> {
    return this.client._request<ListPayoutAccountsResponse>(
      'GET',
      `/v1/customers/${customerId}/payout-accounts`,
    )
  }

  /**
   * Fetch a single payout account by its UUID.
   *
   * **Requires `read` scope.**
   */
  async get(customerId: string, accountId: string): Promise<PayoutAccount> {
    const wrapper = await this.client._request<{ payout_account: PayoutAccount }>(
      'GET',
      `/v1/customers/${customerId}/payout-accounts/${accountId}`,
    )
    return wrapper.payout_account
  }

  /**
   * Update a payout account's details.
   *
   * **Requires `write` scope.**
   */
  async update(
    customerId: string,
    accountId: string,
    request: UpdatePayoutAccountRequest,
  ): Promise<PayoutAccount> {
    const wrapper = await this.client._request<{ payout_account: PayoutAccount }>(
      'PUT',
      `/v1/customers/${customerId}/payout-accounts/${accountId}`,
      { body: request },
    )
    return wrapper.payout_account
  }

  /**
   * Delete a payout account.
   *
   * **Requires `write` scope.**
   */
  async delete(customerId: string, accountId: string): Promise<void> {
    await this.client._request<void>(
      'DELETE',
      `/v1/customers/${customerId}/payout-accounts/${accountId}`,
    )
  }
}
