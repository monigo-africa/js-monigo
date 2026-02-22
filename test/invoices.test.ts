import { describe, it, expect } from 'vitest'
import { mockClient, jsonResponse, errorResponse } from './helpers.js'
import type { Invoice, ListInvoicesResponse } from '../src/types.js'

const INVOICE: Invoice = {
  id: 'inv_1',
  org_id: 'org_1',
  customer_id: 'cust_1',
  subscription_id: 'sub_1',
  status: 'draft',
  currency: 'NGN',
  subtotal: '5000.00',
  vat_enabled: false,
  total: '5000.00',
  period_start: '2025-01-01T00:00:00Z',
  period_end: '2025-01-31T23:59:59Z',
  finalized_at: null,
  paid_at: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('invoices.generate', () => {
  it('posts to /v1/invoices/generate and unwraps invoice', async () => {
    let capturedURL = ''
    let capturedBody = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedBody = init?.body as string
      return jsonResponse({ invoice: INVOICE })
    })
    const result = await client.invoices.generate('sub_1')
    expect(capturedURL).toContain('/v1/invoices/generate')
    expect(JSON.parse(capturedBody)).toEqual({ subscription_id: 'sub_1' })
    expect(result.id).toBe('inv_1')
    expect(result.status).toBe('draft')
    expect(result.total).toBe('5000.00')
  })
})

describe('invoices.list', () => {
  it('returns invoices with no params', async () => {
    const listResponse: ListInvoicesResponse = { invoices: [INVOICE], count: 1 }
    const client = mockClient(() => jsonResponse(listResponse))
    const result = await client.invoices.list()
    expect(result.invoices).toHaveLength(1)
    expect(result.count).toBe(1)
  })

  it('passes status and customer_id as query params', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ invoices: [], count: 0 })
    })
    await client.invoices.list({ status: 'finalized', customer_id: 'cust_1' })
    expect(capturedURL).toContain('status=finalized')
    expect(capturedURL).toContain('customer_id=cust_1')
  })
})

describe('invoices.get', () => {
  it('gets /v1/invoices/:id and unwraps invoice', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ invoice: INVOICE })
    })
    const result = await client.invoices.get('inv_1')
    expect(capturedURL).toContain('/v1/invoices/inv_1')
    expect(result.id).toBe('inv_1')
  })

  it('throws 404 for unknown invoice', async () => {
    const client = mockClient(() => errorResponse('not found', 404))
    await expect(client.invoices.get('bad')).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('invoices.finalize', () => {
  it('posts to /v1/invoices/:id/finalize', async () => {
    let capturedURL = ''
    let capturedMethod = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return jsonResponse({ invoice: { ...INVOICE, status: 'finalized' } })
    })
    const result = await client.invoices.finalize('inv_1')
    expect(capturedMethod).toBe('POST')
    expect(capturedURL).toContain('/v1/invoices/inv_1/finalize')
    expect(result.status).toBe('finalized')
  })
})

describe('invoices.void', () => {
  it('posts to /v1/invoices/:id/void', async () => {
    let capturedURL = ''
    let capturedMethod = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return jsonResponse({ invoice: { ...INVOICE, status: 'void' } })
    })
    const result = await client.invoices.void('inv_1')
    expect(capturedMethod).toBe('POST')
    expect(capturedURL).toContain('/v1/invoices/inv_1/void')
    expect(result.status).toBe('void')
  })

  it('throws 403 for non-admin', async () => {
    const client = mockClient(() => errorResponse('forbidden', 403))
    await expect(client.invoices.void('inv_1')).rejects.toMatchObject({ statusCode: 403 })
  })
})
