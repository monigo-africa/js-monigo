/**
 * Quickstart — end-to-end Monigo integration
 *
 * Demonstrates:
 *  1. Create a customer
 *  2. Create a metric (api_calls, count aggregation)
 *  3. Create a plan with flat-rate pricing (₦2 per API call, billed monthly)
 *  4. Subscribe the customer to the plan
 *  5. Ingest a batch of usage events
 *
 * Run:
 *   cd js-sdk/examples
 *   npm install
 *   MONIGO_API_KEY=mk_test_... npm run quickstart
 *
 * Optional:
 *   MONIGO_BASE_URL=http://localhost:8000  — point at a local server
 */

import {
  MonigoClient,
  MonigoAPIError,
  Aggregation,
  PricingModel,
  BillingPeriod,
  PlanType,
} from '@monigo/sdk'

const apiKey = process.env.MONIGO_API_KEY
if (!apiKey) {
  console.error('Error: MONIGO_API_KEY environment variable is required')
  process.exit(1)
}

const client = new MonigoClient({
  apiKey,
  baseURL: process.env.MONIGO_BASE_URL,
})

try {
  // ---------------------------------------------------------------------------
  // 1. Create a customer
  // ---------------------------------------------------------------------------
  console.log('→ Creating customer...')
  const customer = await client.customers.create({
    external_id: 'acme-corp-001',
    name: 'Acme Corporation',
    email: 'billing@acme.example',
  })
  console.log(`  ✓ Customer created: ${customer.name} (${customer.id})`)

  // ---------------------------------------------------------------------------
  // 2. Create a metric
  // ---------------------------------------------------------------------------
  console.log('→ Creating metric...')
  const metric = await client.metrics.create({
    name: 'API Calls',
    event_name: 'api_call',
    aggregation: Aggregation.Count,
    description: 'Counts every API call made by a customer',
  })
  console.log(`  ✓ Metric created: ${metric.name} (${metric.id})`)

  // ---------------------------------------------------------------------------
  // 3. Create a plan with flat-rate pricing (₦2 per API call)
  // ---------------------------------------------------------------------------
  console.log('→ Creating plan...')
  const plan = await client.plans.create({
    name: 'API Pro',
    description: '₦2 per API call, billed monthly',
    currency: 'NGN',
    plan_type: PlanType.Collection,
    billing_period: BillingPeriod.Monthly,
    prices: [
      {
        metric_id: metric.id,
        model: PricingModel.Flat,
        unit_price: '2.000000',
      },
    ],
  })
  console.log(`  ✓ Plan created: ${plan.name} (${plan.id})`)

  // ---------------------------------------------------------------------------
  // 4. Subscribe the customer to the plan
  // ---------------------------------------------------------------------------
  console.log('→ Creating subscription...')
  const sub = await client.subscriptions.create({
    customer_id: customer.id,
    plan_id: plan.id,
  })
  console.log(`  ✓ Subscription created: ${sub.id} (status: ${sub.status})`)

  // ---------------------------------------------------------------------------
  // 5. Ingest a batch of usage events
  // ---------------------------------------------------------------------------
  console.log('→ Ingesting usage events...')
  const now = new Date()
  const events = Array.from({ length: 10 }, (_, i) => ({
    event_name: 'api_call' as const,
    customer_id: customer.id,
    // Deterministic key so re-running the quickstart is always safe
    idempotency_key: `quickstart-${now.getTime()}-event-${i}`,
    timestamp: new Date(now.getTime() - i * 1000),
    properties: {
      endpoint: '/v1/predict',
      method: 'POST',
    },
  }))

  const resp = await client.events.ingest({ events })
  console.log(`  ✓ Ingested: ${resp.ingested.length} events, Duplicates: ${resp.duplicates.length}`)

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log()
  console.log('✅ Quickstart complete!')
  console.log(`   Customer:     ${customer.id}`)
  console.log(`   Metric:       ${metric.id}`)
  console.log(`   Plan:         ${plan.id}`)
  console.log(`   Subscription: ${sub.id}`)
  console.log()
  console.log('At the end of the billing period an invoice will be generated automatically.')
  console.log('You can also generate one manually:')
  console.log(`   await client.invoices.generate(${JSON.stringify(sub.id)})`)
} catch (err) {
  if (err instanceof MonigoAPIError) {
    console.error(`API error ${err.statusCode}: ${err.message}`)
  } else {
    console.error(err)
  }
  process.exit(1)
}
