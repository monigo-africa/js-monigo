import { describe, it, expect } from 'vitest'
import { mockClient, jsonResponse, errorResponse } from './helpers.js'
import type { PayoutAccount, ListPayoutAccountsResponse } from '../src/types.js'

const ACCOUNT: PayoutAccount = {
  id: 'acct_1',
  customer_id: 'cust_1',
  org_id: 'org_1',
  account_name: 'Acme Corp',
  bank_name: 'Zenith Bank',
  bank_code: '057',
  account_number: '1234567890',
  payout_method: 'bank_transfer',
  currency: 'NGN',
  is_default: true,
  metadata: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('payoutAccounts.create', () => {
  it('posts to /v1/customers/:id/payout-accounts and unwraps account', async () => {
    let capturedURL = ''
    let capturedMethod = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return jsonResponse({ payout_account: ACCOUNT })
    })
    const result = await client.payoutAccounts.create('cust_1', {
      account_name: 'Acme Corp',
      payout_method: 'bank_transfer',
      bank_name: 'Zenith Bank',
      bank_code: '057',
      account_number: '1234567890',
      currency: 'NGN',
    })
    expect(capturedMethod).toBe('POST')
    expect(capturedURL).toContain('/v1/customers/cust_1/payout-accounts')
    expect(result.id).toBe('acct_1')
    expect(result.payout_method).toBe('bank_transfer')
  })
})

describe('payoutAccounts.list', () => {
  it('returns all payout accounts for a customer', async () => {
    const listResponse: ListPayoutAccountsResponse = {
      payout_accounts: [ACCOUNT],
      count: 1,
    }
    const client = mockClient(() => jsonResponse(listResponse))
    const result = await client.payoutAccounts.list('cust_1')
    expect(result.payout_accounts).toHaveLength(1)
    expect(result.count).toBe(1)
  })
})

describe('payoutAccounts.get', () => {
  it('gets /v1/customers/:id/payout-accounts/:accountId', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ payout_account: ACCOUNT })
    })
    const result = await client.payoutAccounts.get('cust_1', 'acct_1')
    expect(capturedURL).toContain('/v1/customers/cust_1/payout-accounts/acct_1')
    expect(result.id).toBe('acct_1')
  })

  it('throws 404 for unknown account', async () => {
    const client = mockClient(() => errorResponse('not found', 404))
    await expect(
      client.payoutAccounts.get('cust_1', 'bad'),
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('payoutAccounts.update', () => {
  it('puts /v1/customers/:id/payout-accounts/:accountId', async () => {
    let capturedMethod = ''
    const client = mockClient((_url, init) => {
      capturedMethod = init?.method ?? ''
      return jsonResponse({ payout_account: { ...ACCOUNT, account_name: 'Updated' } })
    })
    const result = await client.payoutAccounts.update('cust_1', 'acct_1', {
      account_name: 'Updated',
    })
    expect(capturedMethod).toBe('PUT')
    expect(result.account_name).toBe('Updated')
  })
})

describe('payoutAccounts.delete', () => {
  it('sends DELETE /v1/customers/:id/payout-accounts/:accountId', async () => {
    let capturedMethod = ''
    let capturedURL = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return new Response(null, { status: 204 })
    })
    await client.payoutAccounts.delete('cust_1', 'acct_1')
    expect(capturedMethod).toBe('DELETE')
    expect(capturedURL).toContain('/v1/customers/cust_1/payout-accounts/acct_1')
  })
})
