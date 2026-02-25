/**
 * Pricing Models — demonstrates every pricing model supported by Monigo.
 *
 * Four plans are created, each using a different pricing model, all billed
 * monthly in NGN.  A single customer is subscribed to each plan so you can
 * inspect the resulting structure in the dashboard.
 *
 * Pricing models covered:
 *
 *   flat_unit  – fixed price per unit (PricingModel.Flat / PricingModel.PerUnit)
 *   tiered     – graduated tiers; each unit charged at the rate of the tier it
 *                falls into. Pass a PriceTier[] in the `tiers` field.
 *   package    – charge per bundle of N units. Partial bundles round up.
 *                Pass a PackageConfig in the `tiers` field.
 *   overage    – flat base fee covers an included quota; per-unit rate beyond it.
 *                Pass an OverageConfig in the `tiers` field.
 *
 * Run:
 *   cd js-sdk/examples
 *   npm install
 *   MONIGO_API_KEY=mk_test_... npm run pricing-models
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
  type Plan,
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

function printPlan(plan: Plan): void {
  console.log(`  ✓ Plan: ${plan.name.padEnd(35)}  id=${plan.id}`)
  for (const price of plan.prices ?? []) {
    if (price.unit_price && price.unit_price !== '0') {
      console.log(
        `         price id=${price.id.padEnd(38)}  model=${price.model.padEnd(15)}  unit_price=${price.unit_price}`,
      )
    } else {
      console.log(
        `         price id=${price.id.padEnd(38)}  model=${price.model} (config in tiers)`,
      )
    }
  }
  console.log()
}

try {
  // ---------------------------------------------------------------------------
  // Shared customer — subscribed to every demo plan below
  // ---------------------------------------------------------------------------
  console.log('→ Creating demo customer...')
  const customer = await client.customers.create({
    external_id: 'pricing-demo-customer',
    name: 'Pricing Demo Customer',
    email: 'pricing-demo@example.com',
  })
  console.log(`  ✓ Customer: ${customer.name} (${customer.id})\n`)

  // ---------------------------------------------------------------------------
  // Shared metrics
  // ---------------------------------------------------------------------------
  console.log('→ Creating metrics...')

  const apiCallMetric = await client.metrics.create({
    name: 'API Calls',
    event_name: 'api_call',
    aggregation: Aggregation.Count,
    description: 'Counts every API call',
  })
  console.log(`  ✓ Metric: ${apiCallMetric.name} (${apiCallMetric.id})`)

  const smsMetric = await client.metrics.create({
    name: 'SMS Sent',
    event_name: 'sms_sent',
    aggregation: Aggregation.Count,
    description: 'Counts every SMS dispatched',
  })
  console.log(`  ✓ Metric: ${smsMetric.name} (${smsMetric.id})\n`)

  // ---------------------------------------------------------------------------
  // 1. Flat pricing  (model: "flat_unit")
  //
  // Every unit costs exactly the same fixed amount.
  // Use case: simple per-call billing where the rate never changes.
  //
  //  0 – ∞  calls  →  ₦2.00 each
  // ---------------------------------------------------------------------------
  console.log('→ [1/4] Creating FLAT pricing plan...')
  const flatPlan = await client.plans.create({
    name: 'Flat – API Calls',
    description: '₦2.00 per API call, no tiers.',
    currency: 'NGN',
    plan_type: PlanType.Collection,
    billing_period: BillingPeriod.Monthly,
    prices: [
      {
        metric_id: apiCallMetric.id,
        model: PricingModel.Flat, // 'flat_unit'
        unit_price: '2.000000',   // ₦2 per call
      },
    ],
  })
  printPlan(flatPlan)

  // ---------------------------------------------------------------------------
  // 2. Tiered pricing  (model: "tiered")
  //
  // Each unit is charged at the rate of the tier it falls into.
  // Heavy usage is progressively cheaper per unit.
  // Pass a PriceTier[] in the `tiers` field.
  //
  //    1 –  1 000  calls  →  ₦5.00 each
  // 1 001 – 10 000  calls  →  ₦3.00 each
  // 10 001+          calls  →  ₦1.00 each
  // ---------------------------------------------------------------------------
  console.log('→ [2/4] Creating TIERED (graduated) pricing plan...')
  const tieredPlan = await client.plans.create({
    name: 'Tiered – API Calls',
    description: 'Graduated tiers: cheaper as volume grows.',
    currency: 'NGN',
    plan_type: PlanType.Collection,
    billing_period: BillingPeriod.Monthly,
    prices: [
      {
        metric_id: apiCallMetric.id,
        model: PricingModel.Tiered,
        tiers: [
          { up_to: 1_000,  unit_amount: '5.000000' }, // first 1 000: ₦5 each
          { up_to: 10_000, unit_amount: '3.000000' }, // next 9 000: ₦3 each
          { up_to: null,   unit_amount: '1.000000' }, // beyond 10 000: ₦1 each
        ],
      },
    ],
  })
  printPlan(tieredPlan)

  // ---------------------------------------------------------------------------
  // 3. Package pricing  (model: "package")
  //
  // Usage is sold in fixed-size bundles. Partial bundles are rounded up.
  // Pass a PackageConfig object in the `tiers` field.
  //
  //  1 bundle = 1 000 SMS  →  ₦500 per bundle
  //
  // Sending 1 500 SMS → 2 bundles → ₦1 000.
  // ---------------------------------------------------------------------------
  console.log('→ [3/4] Creating PACKAGE pricing plan...')
  const packagePlan = await client.plans.create({
    name: 'Package – SMS Bundle',
    description: '₦500 per 1 000 SMS bundle. Partial bundles round up.',
    currency: 'NGN',
    plan_type: PlanType.Collection,
    billing_period: BillingPeriod.Monthly,
    prices: [
      {
        metric_id: smsMetric.id,
        model: PricingModel.Package,
        tiers: {
          package_size: 1000,           // 1 000 SMS per bundle
          package_price: '500.000000',  // ₦500 per bundle
          round_up_partial_block: true, // partial bundle rounds up
        },
      },
    ],
  })
  printPlan(packagePlan)

  // ---------------------------------------------------------------------------
  // 4. Overage pricing  (model: "overage")
  //
  // A flat base_price covers up to included_units. Every unit above the quota
  // is charged at overage_price per unit.
  // Pass an OverageConfig object in the `tiers` field.
  //
  //  0 – 10 000  calls/month  →  ₦0 (no base fee, just a free quota)
  //  10 001+      calls/month  →  ₦1.50 each
  // ---------------------------------------------------------------------------
  console.log('→ [4/4] Creating OVERAGE pricing plan...')
  const overagePlan = await client.plans.create({
    name: 'Overage – API Calls',
    description: '10 000 calls/month included, ₦1.50 per call beyond that.',
    currency: 'NGN',
    plan_type: PlanType.Collection,
    billing_period: BillingPeriod.Monthly,
    prices: [
      {
        metric_id: apiCallMetric.id,
        model: PricingModel.Overage,
        tiers: {
          included_units: 10_000,    // first 10 000 calls are free
          base_price: '0.000000',    // no flat base fee
          overage_price: '1.500000', // ₦1.50 per call beyond the quota
        },
      },
    ],
  })
  printPlan(overagePlan)

  // ---------------------------------------------------------------------------
  // Subscribe the demo customer to every plan
  // ---------------------------------------------------------------------------
  console.log('→ Subscribing customer to all plans...')
  const plans = [flatPlan, tieredPlan, packagePlan, overagePlan]
  for (const plan of plans) {
    const sub = await client.subscriptions.create({
      customer_id: customer.id,
      plan_id: plan.id,
    })
    console.log(`  ✓ Subscribed to ${plan.name.padEnd(35)}  subscription=${sub.id}`)
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log()
  console.log('✅ Pricing models example complete!')
  console.log()
  console.log(`   Customer:   ${customer.id}`)
  console.log()
  console.log('   Plans created:')
  for (const plan of plans) {
    const model = plan.prices?.[0]?.model ?? '—'
    console.log(`     ${plan.name.padEnd(35)}  id=${plan.id}  model=${model}`)
  }
  console.log()
  console.log('Ingest usage events and then call client.invoices.generate(subscriptionId)')
  console.log('to see each model produce its own line items.')
} catch (err) {
  if (err instanceof MonigoAPIError) {
    console.error(`API error ${err.statusCode}: ${err.message}`)
  } else {
    console.error(err)
  }
  process.exit(1)
}
