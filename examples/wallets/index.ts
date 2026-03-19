/**
 * Wallets — wallet lifecycle management
 *
 * Demonstrates:
 *  1. Get or create a wallet for a customer
 *  2. Credit the wallet (top-up)
 *  3. Check the balance
 *  4. Debit the wallet (usage charge)
 *  5. List transaction history
 *  6. Create a virtual account for automatic top-ups
 *  7. List virtual accounts
 *
 * Run:
 *   cd js-sdk/examples
 *   npm install
 *   MONIGO_API_KEY=mk_test_... CUSTOMER_ID=<uuid> npm run wallets
 *
 * Optional env vars:
 *   MONIGO_BASE_URL=http://localhost:8000
 *   CREATE_VA=true  — create a Paystack virtual account
 */

import {
  MonigoClient,
  MonigoAPIError,
  WalletEntryType,
  VirtualAccountProvider,
} from '@monigo/sdk'

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
  // 1. Get or create a wallet
  // ---------------------------------------------------------------------------
  console.log('→ Getting or creating wallet...')
  const wallet = await client.wallets.getOrCreate({
    customer_id: customerId,
    currency: 'NGN',
  })
  console.log(`  Wallet ID:  ${wallet.id}`)
  console.log(`  Currency:   ${wallet.currency}`)
  console.log(`  Balance:    ${wallet.balance}`)

  // ---------------------------------------------------------------------------
  // 2. Credit the wallet (top-up)
  // ---------------------------------------------------------------------------
  console.log('\n→ Crediting wallet with 10,000.00...')
  const creditResp = await client.wallets.credit(wallet.id, {
    amount: '10000.000000',
    currency: 'NGN',
    description: 'Manual top-up via SDK example',
    entry_type: WalletEntryType.Deposit,
    reference_type: 'sdk_example',
    reference_id: 'example_topup_001',
    idempotency_key: 'sdk_example_topup_001',
  })
  console.log(`  New balance: ${creditResp.wallet.balance}`)
  console.log(`  Ledger entries created: ${creditResp.ledger_entries.length}`)
  for (const entry of creditResp.ledger_entries) {
    console.log(`    ${entry.direction} ${entry.amount} ${entry.currency} — ${entry.description}`)
  }

  // ---------------------------------------------------------------------------
  // 3. Get wallet to verify balance
  // ---------------------------------------------------------------------------
  console.log('\n→ Fetching wallet details...')
  const detail = await client.wallets.get(wallet.id)
  console.log(`  Balance:          ${detail.wallet.balance} ${detail.wallet.currency}`)
  console.log(`  Reserved balance: ${detail.wallet.reserved_balance}`)
  console.log(`  Virtual accounts: ${detail.virtual_accounts.length}`)

  // ---------------------------------------------------------------------------
  // 4. Debit the wallet (usage charge)
  // ---------------------------------------------------------------------------
  console.log('\n→ Debiting wallet with 2,500.00 (usage charge)...')
  try {
    const debitResp = await client.wallets.debit(wallet.id, {
      amount: '2500.000000',
      currency: 'NGN',
      description: 'Usage charge — API calls March 2026',
      entry_type: WalletEntryType.Usage,
      reference_type: 'sdk_example',
      reference_id: 'example_usage_001',
      idempotency_key: 'sdk_example_usage_001',
    })
    console.log(`  New balance: ${debitResp.wallet.balance}`)
  } catch (err) {
    if (err instanceof MonigoAPIError && err.statusCode === 402) {
      console.log('  ⚠ Insufficient wallet balance!')
    } else {
      throw err
    }
  }

  // ---------------------------------------------------------------------------
  // 5. List transaction history
  // ---------------------------------------------------------------------------
  console.log('\n→ Listing transactions...')
  const txns = await client.wallets.listTransactions(wallet.id, { limit: 10 })
  console.log(`  Total transactions: ${txns.total} (showing ${txns.transactions.length})`)
  for (const tx of txns.transactions) {
    console.log(
      `    ${tx.direction} ${tx.amount} ${tx.currency} — ${tx.description} ` +
        `(${tx.balance_before} → ${tx.balance_after})`,
    )
  }

  // ---------------------------------------------------------------------------
  // 6. Create a virtual account (skip if CREATE_VA != "true")
  // ---------------------------------------------------------------------------
  if (process.env.CREATE_VA === 'true') {
    console.log('\n→ Creating virtual account (Paystack)...')
    const va = await client.wallets.createVirtualAccount(wallet.id, {
      provider: VirtualAccountProvider.Paystack,
      currency: 'NGN',
    })
    console.log(`  Account Number: ${va.account_number}`)
    console.log(`  Account Name:   ${va.account_name}`)
    console.log(`  Bank:           ${va.bank_name} (${va.bank_code})`)
    console.log(`  Provider:       ${va.provider}`)
  }

  // ---------------------------------------------------------------------------
  // 7. List virtual accounts
  // ---------------------------------------------------------------------------
  console.log('\n→ Listing virtual accounts...')
  const vaList = await client.wallets.listVirtualAccounts(wallet.id)
  if (vaList.count === 0) {
    console.log('  No virtual accounts (set CREATE_VA=true to create one)')
  } else {
    for (const va of vaList.virtual_accounts) {
      console.log(`  ${va.provider} — ${va.account_number} at ${va.bank_name} (${va.currency})`)
    }
  }

  // ---------------------------------------------------------------------------
  // 8. List all wallets for this customer
  // ---------------------------------------------------------------------------
  console.log('\n→ Listing all wallets for customer...')
  const walletList = await client.wallets.listByCustomer(customerId)
  console.log(`  Found ${walletList.count} wallet(s)`)
  for (const w of walletList.wallets) {
    console.log(`    ${w.id} — ${w.balance} ${w.currency}`)
  }

  console.log('\n✅ Wallet example complete!')
} catch (err) {
  if (err instanceof MonigoAPIError) {
    console.error(`API error ${err.statusCode}: ${err.message}`)
  } else {
    console.error(err)
  }
  process.exit(1)
}
