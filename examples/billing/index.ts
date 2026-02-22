/**
 * Billing — invoice lifecycle management
 *
 * Demonstrates:
 *  1. Generate a draft invoice for a subscription
 *  2. Print the invoice and its line items
 *  3. List all invoices for the customer
 *  4. Finalize the invoice (locks amounts)
 *  5. Optionally void it (set VOID_INVOICE=true)
 *
 * Run:
 *   cd js-sdk/examples
 *   npm install
 *   MONIGO_API_KEY=mk_test_... SUBSCRIPTION_ID=<uuid> npm run billing
 *
 * Optional env vars:
 *   MONIGO_BASE_URL=http://localhost:8000
 *   VOID_INVOICE=true   — void the invoice after finalizing
 */

import { MonigoClient, MonigoAPIError, type Invoice } from '@monigo/sdk'

const apiKey = process.env.MONIGO_API_KEY
if (!apiKey) {
  console.error('Error: MONIGO_API_KEY environment variable is required')
  process.exit(1)
}
const subscriptionId = process.env.SUBSCRIPTION_ID
if (!subscriptionId) {
  console.error('Error: SUBSCRIPTION_ID environment variable is required')
  process.exit(1)
}

const client = new MonigoClient({
  apiKey,
  baseURL: process.env.MONIGO_BASE_URL,
})

function printInvoice(inv: Invoice): void {
  console.log()
  console.log(`  Invoice ID:    ${inv.id}`)
  console.log(`  Customer:      ${inv.customer_id}`)
  console.log(`  Subscription:  ${inv.subscription_id}`)
  console.log(`  Period:        ${inv.period_start.slice(0, 10)} → ${inv.period_end.slice(0, 10)}`)
  console.log(`  Status:        ${inv.status}`)
  console.log(`  Currency:      ${inv.currency}`)
  console.log(`  Subtotal:      ${inv.subtotal}`)
  console.log(`  Total:         ${inv.total}`)

  if (inv.line_items && inv.line_items.length > 0) {
    console.log()
    console.log('  Line Items:')
    for (const li of inv.line_items) {
      console.log(
        `    ${li.description.padEnd(40)}  qty=${li.quantity.padEnd(10)}  ` +
          `unit=${li.unit_price.padEnd(10)}  amount=${li.amount}`,
      )
    }
  } else {
    console.log('  (No line items yet — usage may not be rolled up yet)')
  }
}

try {
  // ---------------------------------------------------------------------------
  // 1. Generate a draft invoice
  // ---------------------------------------------------------------------------
  console.log('→ Generating draft invoice...')
  const invoice = await client.invoices.generate(subscriptionId)
  printInvoice(invoice)

  // ---------------------------------------------------------------------------
  // 2. List all invoices for this customer to confirm it appears
  // ---------------------------------------------------------------------------
  console.log(`\n→ Listing invoices for customer ${invoice.customer_id}`)
  const list = await client.invoices.list({ customer_id: invoice.customer_id })
  console.log(`  Found ${list.count} invoice(s)`)

  // ---------------------------------------------------------------------------
  // 3. Finalize the invoice
  // ---------------------------------------------------------------------------
  console.log('\n→ Finalizing invoice...')
  const finalized = await client.invoices.finalize(invoice.id)
  console.log(`  ✓ Invoice status: ${finalized.status} (was ${invoice.status})`)

  // ---------------------------------------------------------------------------
  // 4. Optional: void the invoice
  // ---------------------------------------------------------------------------
  if (process.env.VOID_INVOICE === 'true') {
    console.log('\n→ Voiding invoice...')
    const voided = await client.invoices.void(finalized.id)
    console.log(`  ✓ Invoice status: ${voided.status}`)
  }

  console.log('\n✅ Billing example complete!')
} catch (err) {
  if (err instanceof MonigoAPIError) {
    console.error(`API error ${err.statusCode}: ${err.message}`)
  } else {
    console.error(err)
  }
  process.exit(1)
}
