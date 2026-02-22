/**
 * Payouts — payout account management and event replay
 *
 * Demonstrates:
 *  1. Create a bank transfer payout account for a customer
 *  2. Create a mobile money payout account
 *  3. List all payout accounts for the customer
 *  4. Start an event replay for the last 24 hours
 *  5. Poll the replay job until it completes (2-minute timeout)
 *
 * Run:
 *   cd js-sdk/examples
 *   npm install
 *   MONIGO_API_KEY=mk_test_... CUSTOMER_ID=<uuid> npm run payouts
 *
 * Optional env vars:
 *   MONIGO_BASE_URL=http://localhost:8000
 */

import { MonigoClient, MonigoAPIError, PayoutMethod } from '@monigo/sdk'

const apiKey = process.env.MONIGO_API_KEY
if (!apiKey) {
  console.error('Error: MONIGO_API_KEY environment variable is required')
  process.exit(1)
}
const customerId = process.env.CUSTOMER_ID
if (!customerId) {
  console.error('Error: CUSTOMER_ID environment variable is required')
  process.exit(1)
}

const client = new MonigoClient({
  apiKey,
  baseURL: process.env.MONIGO_BASE_URL,
})

try {
  // ---------------------------------------------------------------------------
  // 1. Create a bank transfer account
  // ---------------------------------------------------------------------------
  console.log(`→ Creating bank payout account for customer ${customerId}`)
  const bankAccount = await client.payoutAccounts.create(customerId, {
    account_name: 'John Driver',
    payout_method: PayoutMethod.BankTransfer,
    bank_name: 'First Bank Nigeria',
    bank_code: '011',
    account_number: '3001234567',
    currency: 'NGN',
    is_default: true,
  })
  console.log(`  ✓ Bank account created: ${bankAccount.account_name} (${bankAccount.id})`)

  // ---------------------------------------------------------------------------
  // 2. Create a mobile money account
  // ---------------------------------------------------------------------------
  console.log('\n→ Creating mobile money account...')
  const momoAccount = await client.payoutAccounts.create(customerId, {
    account_name: 'John Driver',
    payout_method: PayoutMethod.MobileMoney,
    mobile_money_number: '+2348012345678',
    currency: 'NGN',
  })
  console.log(`  ✓ Mobile money account created: ${momoAccount.account_name} (${momoAccount.id})`)

  // ---------------------------------------------------------------------------
  // 3. List all payout accounts
  // ---------------------------------------------------------------------------
  console.log('\n→ Listing payout accounts...')
  const { payout_accounts, count } = await client.payoutAccounts.list(customerId)
  console.log(`  Found ${count} account(s):`)
  for (const a of payout_accounts) {
    const defaultMark = a.is_default ? ' (default)' : ''
    const detail =
      a.payout_method === PayoutMethod.BankTransfer
        ? `${a.bank_name} ${a.account_number}`
        : `${a.mobile_money_number}`
    console.log(`    • ${a.account_name} — ${detail}${defaultMark}`)
  }

  // ---------------------------------------------------------------------------
  // 4. Start an event replay for the last 24 hours
  // ---------------------------------------------------------------------------
  console.log('\n→ Starting event replay for the last 24 hours...')
  const to = new Date()
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)

  let job = await client.events.startReplay({ from, to })
  console.log(`  ✓ Replay job started: ${job.id} (status: ${job.status})`)

  // ---------------------------------------------------------------------------
  // 5. Poll until complete (2-minute timeout)
  // ---------------------------------------------------------------------------
  console.log('\n→ Polling replay job status...')
  const deadline = Date.now() + 2 * 60 * 1000

  while (
    (job.status === 'pending' || job.status === 'processing') &&
    Date.now() < deadline
  ) {
    await new Promise(r => setTimeout(r, 3_000))
    job = await client.events.getReplay(job.id)
    console.log(
      `  Status: ${job.status.padEnd(12)}  replayed=${job.events_replayed}/${job.events_total}`,
    )
  }

  console.log(`\n✅ Replay finished with status: ${job.status}`)
  if (job.error_message) {
    console.log(`   Error: ${job.error_message}`)
  }
} catch (err) {
  if (err instanceof MonigoAPIError) {
    console.error(`API error ${err.statusCode}: ${err.message}`)
  } else {
    console.error(err)
  }
  process.exit(1)
}
