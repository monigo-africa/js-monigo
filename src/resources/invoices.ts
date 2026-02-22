import type { MonigoClient } from '../client.js'
import type {
  Invoice,
  ListInvoicesParams,
  ListInvoicesResponse,
} from '../types.js'

/** Manage invoice generation, finalization, and voiding. */
export class InvoicesResource {
  constructor(private readonly client: MonigoClient) {}

  /**
   * Generate a draft invoice for a subscription based on current period usage.
   * The invoice starts in `"draft"` status and is not sent to the customer yet.
   *
   * **Requires `write` scope.**
   *
   * @example
   * ```ts
   * const invoice = await monigo.invoices.generate('sub_xyz')
   * console.log('Draft invoice total:', invoice.total)
   * ```
   */
  async generate(subscriptionId: string): Promise<Invoice> {
    const wrapper = await this.client._request<{ invoice: Invoice }>(
      'POST',
      '/v1/invoices/generate',
      { body: { subscription_id: subscriptionId } },
    )
    return wrapper.invoice
  }

  /**
   * Return invoices, optionally filtered by status or customer.
   *
   * **Requires `read` scope.**
   *
   * @example
   * ```ts
   * const { invoices } = await monigo.invoices.list({
   *   status: 'finalized',
   *   customer_id: 'cust_abc',
   * })
   * ```
   */
  async list(params: ListInvoicesParams = {}): Promise<ListInvoicesResponse> {
    return this.client._request<ListInvoicesResponse>('GET', '/v1/invoices', {
      query: {
        status: params.status,
        customer_id: params.customer_id,
      },
    })
  }

  /**
   * Fetch a single invoice by its UUID, including line items.
   *
   * **Requires `read` scope.**
   */
  async get(invoiceId: string): Promise<Invoice> {
    const wrapper = await this.client._request<{ invoice: Invoice }>(
      'GET',
      `/v1/invoices/${invoiceId}`,
    )
    return wrapper.invoice
  }

  /**
   * Finalize a draft invoice, making it ready for payment.
   * A finalized invoice cannot be edited.
   *
   * **Requires `write` scope.**
   */
  async finalize(invoiceId: string): Promise<Invoice> {
    const wrapper = await this.client._request<{ invoice: Invoice }>(
      'POST',
      `/v1/invoices/${invoiceId}/finalize`,
    )
    return wrapper.invoice
  }

  /**
   * Void an invoice, making it permanently non-payable.
   * Only admins and owners can void invoices.
   *
   * **Requires `write` scope.**
   */
  async void(invoiceId: string): Promise<Invoice> {
    const wrapper = await this.client._request<{ invoice: Invoice }>(
      'POST',
      `/v1/invoices/${invoiceId}/void`,
    )
    return wrapper.invoice
  }
}
