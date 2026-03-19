import { describe, it, expect } from 'vitest'
import { mockClient, jsonResponse, errorResponse } from './helpers.js'
import type {
  CustomerWallet,
  VirtualAccount,
  LedgerEntry,
  ListWalletsResponse,
  WalletWithVirtualAccountsResponse,
  WalletOperationResponse,
  ListTransactionsResponse,
  ListVirtualAccountsResponse,
} from '../src/types.js'

const WALLET: CustomerWallet = {
  id: 'wal_1',
  customer_id: 'cust_1',
  org_id: 'org_1',
  currency: 'NGN',
  balance: '500.000000',
  reserved_balance: '0.000000',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const VIRTUAL_ACCOUNT: VirtualAccount = {
  id: 'va_1',
  customer_id: 'cust_1',
  wallet_id: 'wal_1',
  org_id: 'org_1',
  provider: 'paystack',
  account_number: '1234567890',
  account_name: 'Acme Corp',
  bank_name: 'Access Bank',
  bank_code: '044',
  currency: 'NGN',
  provider_ref: 'ref_123',
  is_active: true,
  metadata: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const LEDGER_ENTRY: LedgerEntry = {
  id: 'le_1',
  org_id: 'org_1',
  transaction_id: 'txn_1',
  wallet_id: 'wal_1',
  account_type: 'customer_wallet',
  account_id: 'wal_1',
  direction: 'credit',
  amount: '100.000000',
  currency: 'NGN',
  balance_before: '400.000000',
  balance_after: '500.000000',
  description: 'Top-up',
  entry_type: 'deposit',
  reference_type: 'manual_credit',
  reference_id: 'ref_1',
  idempotency_key: 'idem_1',
  metadata: null,
  created_at: '2025-01-01T00:00:00Z',
}

describe('wallets.getOrCreate', () => {
  it('posts to /v1/wallets and unwraps wallet', async () => {
    let capturedURL = ''
    let capturedMethod = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return jsonResponse({ wallet: WALLET })
    })
    const result = await client.wallets.getOrCreate({
      customer_id: 'cust_1',
      currency: 'NGN',
    })
    expect(capturedMethod).toBe('POST')
    expect(capturedURL).toContain('/v1/wallets')
    expect(result.id).toBe('wal_1')
    expect(result.balance).toBe('500.000000')
  })
})

describe('wallets.list', () => {
  it('gets /v1/wallets with no params', async () => {
    let capturedURL = ''
    const listResponse: ListWalletsResponse = { wallets: [WALLET], count: 1 }
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse(listResponse)
    })
    const result = await client.wallets.list()
    expect(capturedURL).toContain('/v1/wallets')
    expect(result.wallets).toHaveLength(1)
    expect(result.count).toBe(1)
  })

  it('gets /v1/wallets with customer_id filter', async () => {
    let capturedURL = ''
    const listResponse: ListWalletsResponse = { wallets: [WALLET], count: 1 }
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse(listResponse)
    })
    const result = await client.wallets.list({ customer_id: 'cust_1' })
    expect(capturedURL).toContain('customer_id=cust_1')
    expect(result.wallets).toHaveLength(1)
  })
})

describe('wallets.listByCustomer', () => {
  it('gets /v1/customers/:id/wallets', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ wallets: [WALLET], count: 1 } as ListWalletsResponse)
    })
    const result = await client.wallets.listByCustomer('cust_1')
    expect(capturedURL).toContain('/v1/customers/cust_1/wallets')
    expect(result.wallets).toHaveLength(1)
  })
})

describe('wallets.get', () => {
  it('gets /v1/wallets/:id and returns wallet with virtual accounts', async () => {
    let capturedURL = ''
    const response: WalletWithVirtualAccountsResponse = {
      wallet: WALLET,
      virtual_accounts: [VIRTUAL_ACCOUNT],
    }
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse(response)
    })
    const result = await client.wallets.get('wal_1')
    expect(capturedURL).toContain('/v1/wallets/wal_1')
    expect(result.wallet.id).toBe('wal_1')
    expect(result.virtual_accounts).toHaveLength(1)
  })

  it('throws 404 for unknown wallet', async () => {
    const client = mockClient(() => errorResponse('wallet not found', 404))
    await expect(client.wallets.get('bad')).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('wallets.credit', () => {
  it('posts to /v1/wallets/:id/credit and returns operation response', async () => {
    let capturedMethod = ''
    let capturedURL = ''
    const response: WalletOperationResponse = {
      wallet: WALLET,
      ledger_entries: [LEDGER_ENTRY],
    }
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return jsonResponse(response)
    })
    const result = await client.wallets.credit('wal_1', {
      amount: '100.000000',
      currency: 'NGN',
      description: 'Top-up',
      entry_type: 'deposit',
      reference_type: 'manual_credit',
      reference_id: 'ref_1',
      idempotency_key: 'idem_1',
    })
    expect(capturedMethod).toBe('POST')
    expect(capturedURL).toContain('/v1/wallets/wal_1/credit')
    expect(result.wallet.id).toBe('wal_1')
    expect(result.ledger_entries).toHaveLength(1)
  })
})

describe('wallets.debit', () => {
  it('posts to /v1/wallets/:id/debit and returns operation response', async () => {
    let capturedURL = ''
    const response: WalletOperationResponse = {
      wallet: WALLET,
      ledger_entries: [LEDGER_ENTRY],
    }
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse(response)
    })
    const result = await client.wallets.debit('wal_1', {
      amount: '50.000000',
      currency: 'NGN',
      description: 'Usage charge',
      entry_type: 'usage',
      reference_type: 'usage_event',
      reference_id: 'evt_1',
      idempotency_key: 'idem_2',
    })
    expect(capturedURL).toContain('/v1/wallets/wal_1/debit')
    expect(result.wallet.id).toBe('wal_1')
  })

  it('throws 402 for insufficient balance', async () => {
    const client = mockClient(() => errorResponse('insufficient wallet balance', 402))
    await expect(
      client.wallets.debit('wal_1', {
        amount: '999999.000000',
        currency: 'NGN',
        description: 'Too much',
        entry_type: 'usage',
        reference_type: 'usage_event',
        reference_id: 'evt_2',
        idempotency_key: 'idem_3',
      }),
    ).rejects.toMatchObject({ statusCode: 402 })
  })
})

describe('wallets.listTransactions', () => {
  it('gets /v1/wallets/:id/transactions with pagination params', async () => {
    let capturedURL = ''
    const response: ListTransactionsResponse = {
      transactions: [LEDGER_ENTRY],
      total: 1,
      limit: 10,
      offset: 0,
    }
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse(response)
    })
    const result = await client.wallets.listTransactions('wal_1', { limit: 10, offset: 0 })
    expect(capturedURL).toContain('/v1/wallets/wal_1/transactions')
    expect(capturedURL).toContain('limit=10')
    expect(result.transactions).toHaveLength(1)
    expect(result.total).toBe(1)
  })
})

describe('wallets.createVirtualAccount', () => {
  it('posts to /v1/wallets/:id/virtual-accounts and unwraps', async () => {
    let capturedMethod = ''
    let capturedURL = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return jsonResponse({ virtual_account: VIRTUAL_ACCOUNT })
    })
    const result = await client.wallets.createVirtualAccount('wal_1', {
      provider: 'paystack',
      currency: 'NGN',
    })
    expect(capturedMethod).toBe('POST')
    expect(capturedURL).toContain('/v1/wallets/wal_1/virtual-accounts')
    expect(result.id).toBe('va_1')
    expect(result.provider).toBe('paystack')
  })
})

describe('wallets.listVirtualAccounts', () => {
  it('gets /v1/wallets/:id/virtual-accounts', async () => {
    let capturedURL = ''
    const response: ListVirtualAccountsResponse = {
      virtual_accounts: [VIRTUAL_ACCOUNT],
      count: 1,
    }
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse(response)
    })
    const result = await client.wallets.listVirtualAccounts('wal_1')
    expect(capturedURL).toContain('/v1/wallets/wal_1/virtual-accounts')
    expect(result.virtual_accounts).toHaveLength(1)
    expect(result.count).toBe(1)
  })
})
