import { describe, it, expect } from 'vitest'
import { mockClient, jsonResponse, errorResponse } from './helpers.js'
import type { Customer, ListCustomersResponse } from '../src/types.js'

const CUSTOMER: Customer = {
  id: 'cust_1',
  org_id: 'org_1',
  external_id: 'ext_1',
  name: 'Acme Corp',
  email: 'billing@acme.com',
  metadata: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('customers.create', () => {
  it('posts to /v1/customers and unwraps customer', async () => {
    let capturedURL = ''
    let capturedMethod = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return jsonResponse({ customer: CUSTOMER })
    })
    const result = await client.customers.create({
      external_id: 'ext_1',
      name: 'Acme Corp',
      email: 'billing@acme.com',
    })
    expect(capturedMethod).toBe('POST')
    expect(capturedURL).toContain('/v1/customers')
    expect(result.id).toBe('cust_1')
    expect(result.name).toBe('Acme Corp')
  })

  it('throws 409 on duplicate external_id', async () => {
    const client = mockClient(() => errorResponse('customer already exists', 409))
    await expect(
      client.customers.create({ external_id: 'dup', name: 'X', email: 'x@x.com' }),
    ).rejects.toMatchObject({ statusCode: 409 })
  })
})

describe('customers.list', () => {
  it('gets /v1/customers and returns list', async () => {
    const listResponse: ListCustomersResponse = { customers: [CUSTOMER], count: 1 }
    const client = mockClient(() => jsonResponse(listResponse))
    const result = await client.customers.list()
    expect(result.customers).toHaveLength(1)
    expect(result.count).toBe(1)
    expect(result.customers[0].id).toBe('cust_1')
  })
})

describe('customers.get', () => {
  it('gets /v1/customers/:id and unwraps customer', async () => {
    let capturedURL = ''
    const client = mockClient((url) => {
      capturedURL = url
      return jsonResponse({ customer: CUSTOMER })
    })
    const result = await client.customers.get('cust_1')
    expect(capturedURL).toContain('/v1/customers/cust_1')
    expect(result.id).toBe('cust_1')
  })

  it('throws 404 for unknown customer', async () => {
    const client = mockClient(() => errorResponse('not found', 404))
    await expect(client.customers.get('bad')).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('customers.update', () => {
  it('puts /v1/customers/:id and unwraps customer', async () => {
    let capturedMethod = ''
    const client = mockClient((_url, init) => {
      capturedMethod = init?.method ?? ''
      return jsonResponse({ customer: { ...CUSTOMER, name: 'Updated' } })
    })
    const result = await client.customers.update('cust_1', { name: 'Updated' })
    expect(capturedMethod).toBe('PUT')
    expect(result.name).toBe('Updated')
  })
})

describe('customers.delete', () => {
  it('sends DELETE /v1/customers/:id', async () => {
    let capturedMethod = ''
    let capturedURL = ''
    const client = mockClient((url, init) => {
      capturedURL = url
      capturedMethod = init?.method ?? ''
      return new Response(null, { status: 204 })
    })
    await client.customers.delete('cust_1')
    expect(capturedMethod).toBe('DELETE')
    expect(capturedURL).toContain('/v1/customers/cust_1')
  })
})
