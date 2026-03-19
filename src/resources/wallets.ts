import type { MonigoClient, MutationOptions } from '../client.js'
import type {
  CustomerWallet,
  VirtualAccount,
  GetOrCreateWalletRequest,
  CreditWalletRequest,
  DebitWalletRequest,
  CreateVirtualAccountRequest,
  ListWalletsParams,
  ListTransactionsParams,
  ListWalletsResponse,
  WalletWithVirtualAccountsResponse,
  WalletOperationResponse,
  ListTransactionsResponse,
  ListVirtualAccountsResponse,
} from '../types.js'

/** Manage customer wallets, balance operations, and virtual accounts. */
export class WalletsResource {
  constructor(private readonly client: MonigoClient) {}

  /**
   * Get an existing wallet or create a new one for the given customer and currency.
   *
   * **Requires `write` scope.**
   */
  async getOrCreate(
    request: GetOrCreateWalletRequest,
    options?: MutationOptions,
  ): Promise<CustomerWallet> {
    const wrapper = await this.client._request<{ wallet: CustomerWallet }>(
      'POST',
      '/v1/wallets',
      { body: request, idempotencyKey: options?.idempotencyKey },
    )
    return wrapper.wallet
  }

  /**
   * List all wallets for an organisation.
   *
   * **Requires `read` scope.**
   */
  async list(params: ListWalletsParams): Promise<ListWalletsResponse> {
    return this.client._request<ListWalletsResponse>('GET', '/v1/wallets', {
      query: { org_id: params.org_id },
    })
  }

  /**
   * List all wallets belonging to a specific customer.
   *
   * **Requires `read` scope.**
   */
  async listByCustomer(customerId: string): Promise<ListWalletsResponse> {
    return this.client._request<ListWalletsResponse>(
      'GET',
      `/v1/customers/${customerId}/wallets`,
    )
  }

  /**
   * Fetch a single wallet by UUID, including its virtual accounts.
   *
   * **Requires `read` scope.**
   */
  async get(walletId: string): Promise<WalletWithVirtualAccountsResponse> {
    return this.client._request<WalletWithVirtualAccountsResponse>(
      'GET',
      `/v1/wallets/${walletId}`,
    )
  }

  /**
   * Credit (add funds to) a wallet. Returns the updated wallet and ledger entries.
   *
   * **Requires `write` scope.**
   */
  async credit(
    walletId: string,
    request: CreditWalletRequest,
    options?: MutationOptions,
  ): Promise<WalletOperationResponse> {
    return this.client._request<WalletOperationResponse>(
      'POST',
      `/v1/wallets/${walletId}/credit`,
      { body: request, idempotencyKey: options?.idempotencyKey },
    )
  }

  /**
   * Debit (remove funds from) a wallet. Returns the updated wallet and ledger entries.
   * Throws a 402 error if the wallet has insufficient balance.
   *
   * **Requires `write` scope.**
   */
  async debit(
    walletId: string,
    request: DebitWalletRequest,
    options?: MutationOptions,
  ): Promise<WalletOperationResponse> {
    return this.client._request<WalletOperationResponse>(
      'POST',
      `/v1/wallets/${walletId}/debit`,
      { body: request, idempotencyKey: options?.idempotencyKey },
    )
  }

  /**
   * List paginated ledger entries (transactions) for a wallet.
   *
   * **Requires `read` scope.**
   */
  async listTransactions(
    walletId: string,
    params?: ListTransactionsParams,
  ): Promise<ListTransactionsResponse> {
    return this.client._request<ListTransactionsResponse>(
      'GET',
      `/v1/wallets/${walletId}/transactions`,
      {
        query: {
          limit: params?.limit?.toString(),
          offset: params?.offset?.toString(),
        },
      },
    )
  }

  /**
   * Create a dedicated virtual bank account that automatically funds the wallet on deposit.
   *
   * **Requires `write` scope.**
   */
  async createVirtualAccount(
    walletId: string,
    request: CreateVirtualAccountRequest,
    options?: MutationOptions,
  ): Promise<VirtualAccount> {
    const wrapper = await this.client._request<{ virtual_account: VirtualAccount }>(
      'POST',
      `/v1/wallets/${walletId}/virtual-accounts`,
      { body: request, idempotencyKey: options?.idempotencyKey },
    )
    return wrapper.virtual_account
  }

  /**
   * List all virtual accounts linked to a wallet.
   *
   * **Requires `read` scope.**
   */
  async listVirtualAccounts(walletId: string): Promise<ListVirtualAccountsResponse> {
    return this.client._request<ListVirtualAccountsResponse>(
      'GET',
      `/v1/wallets/${walletId}/virtual-accounts`,
    )
  }
}
