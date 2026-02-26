/**
 * Portal tokens — customer portal link management
 *
 * Demonstrates:
 *  1. Create a permanent portal link for a customer
 *  2. Create a time-limited portal link (expires in 30 days)
 *  3. List all active portal tokens for the customer
 *  4. Revoke the time-limited token
 *  5. Verify only the permanent link remains
 *
 * Run:
 *   cd js-sdk/examples
 *   npm install
 *   MONIGO_API_KEY=mk_test_... CUSTOMER_EXTERNAL_ID=usr_abc123 npm run portal-tokens
 *
 * Optional env vars:
 *   MONIGO_BASE_URL=http://localhost:8000
 */

import { MonigoClient, MonigoAPIError } from '@monigo/sdk'

const apiKey = process.env.MONIGO_API_KEY
if (!apiKey) {
  console.error('Error: MONIGO_API_KEY environment variable is required')
  process.exit(1)
}
const externalId = process.env.CUSTOMER_EXTERNAL_ID
if (!externalId) {
  console.error('Error: CUSTOMER_EXTERNAL_ID environment variable is required')
  process.exit(1)
}

const client = new MonigoClient({
  apiKey,
  baseURL: process.env.MONIGO_BASE_URL,
})

try {
  // ---------------------------------------------------------------------------
  // 1. Create a permanent portal link
  // ---------------------------------------------------------------------------
  console.log(`→ Creating permanent portal link for customer "${externalId}"...`)
  const permanent = await client.portalTokens.create({
    customer_external_id: externalId,
    label: 'Main portal link',
  })
  console.log(`  ✓ Token ID:   ${permanent.id}`)
  console.log(`  ✓ Portal URL: ${permanent.portal_url}`)

  // ---------------------------------------------------------------------------
  // 2. Create a time-limited portal link (expires in 30 days)
  // ---------------------------------------------------------------------------
  console.log('\n→ Creating 30-day portal link...')
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 30)

  const timed = await client.portalTokens.create({
    customer_external_id: externalId,
    label: '30-day invoice link',
    expires_at: expiry.toISOString(),
  })
  console.log(`  ✓ Token ID:   ${timed.id}`)
  console.log(`  ✓ Expires at: ${expiry.toISOString().slice(0, 10)}`)
  console.log(`  ✓ Portal URL: ${timed.portal_url}`)

  // ---------------------------------------------------------------------------
  // 3. List all tokens for the customer
  // ---------------------------------------------------------------------------
  console.log('\n→ Listing all portal tokens...')
  const { tokens, count } = await client.portalTokens.list(externalId)
  console.log(`  Found ${count} token(s):`)
  for (const tok of tokens) {
    const expStr = tok.expires_at ? tok.expires_at.slice(0, 10) : 'never'
    console.log(`    • [${tok.id}] "${tok.label}"  expires=${expStr}`)
  }

  // ---------------------------------------------------------------------------
  // 4. Revoke the time-limited token
  // ---------------------------------------------------------------------------
  console.log(`\n→ Revoking timed token ${timed.id}...`)
  await client.portalTokens.revoke(timed.id)
  console.log('  ✓ Token revoked — that portal URL will now return 401')

  // ---------------------------------------------------------------------------
  // 5. Re-list to confirm only the permanent token remains
  // ---------------------------------------------------------------------------
  console.log('\n→ Re-listing tokens after revocation...')
  const after = await client.portalTokens.list(externalId)
  console.log(`  Active token(s): ${after.count}`)
  for (const tok of after.tokens) {
    console.log(`    • [${tok.id}] "${tok.label}"`)
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n✅ Portal token management complete!')
  console.log()
  console.log('Share the permanent portal URL with your customer:')
  console.log(`   ${permanent.portal_url}`)
  console.log()
  console.log('Customers can use this URL to view their invoices, payout slips,')
  console.log('subscriptions, and payout accounts without needing a Monigo account.')
} catch (err) {
  if (err instanceof MonigoAPIError) {
    console.error(`API error ${err.statusCode}: ${err.message}`)
  } else {
    console.error(err)
  }
  process.exit(1)
}
