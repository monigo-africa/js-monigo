import type { MonigoClient, MutationOptions } from '../client.js'
import type {
  PortalToken,
  CreatePortalTokenRequest,
  ListPortalTokensResponse,
} from '../types.js'

/**
 * Manage customer portal access links.
 *
 * Portal tokens grant an end-customer read-only access to their invoices,
 * payout slips, subscriptions, and payout accounts in the Monigo hosted portal.
 * All operations require a write-scoped API key; the organisation is inferred
 * automatically from the key.
 */
export class PortalTokensResource {
  constructor(private readonly client: MonigoClient) {}

  /**
   * Generate a new portal link for a customer.
   *
   * **Requires `write` scope.**
   *
   * The returned `portal_url` is what you share with your customer — embed it
   * in an email, open it in an iframe, or redirect the browser to it directly.
   *
   * @example
   * ```ts
   * const { portal_url } = await monigo.portalTokens.create({
   *   customer_external_id: 'usr_abc123',
   *   label: 'March 2026 invoice link',
   * })
   * await sendEmail(customer.email, { portalLink: portal_url })
   * ```
   */
  async create(
    request: CreatePortalTokenRequest,
    options?: MutationOptions,
  ): Promise<PortalToken> {
    const wrapper = await this.client._request<{ token: PortalToken }>(
      'POST',
      '/v1/portal/tokens',
      { body: request, idempotencyKey: options?.idempotencyKey },
    )
    return wrapper.token
  }

  /**
   * List all portal tokens for a customer.
   *
   * **Requires `read` scope.**
   *
   * @param customerId - The customer's Monigo UUID or their `external_id`.
   */
  async list(customerId: string): Promise<ListPortalTokensResponse> {
    return this.client._request<ListPortalTokensResponse>(
      'GET',
      '/v1/portal/tokens',
      { query: { customer_id: customerId } },
    )
  }

  /**
   * Immediately revoke a portal token.
   *
   * **Requires `write` scope.**
   *
   * Any customer holding the corresponding URL will receive a 401 on their
   * next request. This action is irreversible.
   *
   * @param tokenId - The UUID of the portal token record (not the raw token string).
   */
  async revoke(tokenId: string, options?: MutationOptions): Promise<void> {
    await this.client._request<void>(
      'DELETE',
      `/v1/portal/tokens/${tokenId}`,
      { idempotencyKey: options?.idempotencyKey },
    )
  }
}
