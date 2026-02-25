/**
 * Pricing Models — demonstrates every pricing model supported by Monigo.
 *
 * Six plans are created, each using a different pricing model, all billed
 * monthly in NGN.  A single customer is subscribed to each plan so you can
 * inspect the resulting structure in the dashboard.
 *
 * Pricing models covered:
 *
 *   flat           – fixed price per unit, no tiers (e.g. ₦2 per API call)
 *   tiered         – graduated tiers; each unit is charged at the rate of the
 *                    tier it falls in (first N units at price A, next M at B…)
 *   volume         – whole usage is charged at the rate of the highest tier
 *                    reached (one rate applies to every unit)
 *   package        – charge per block/bundle of N units (e.g. ₦500 per 1 000 SMS)
 *   overage        – free up to an included quota, then a per-unit rate beyond it
 *   weighted_tiered – like tiered, but the blended average across all tiers is
 *                    used for the final charge
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
        `         price id=${price.id.padEnd(38)}  model=${price.model} (tiered)`,
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

  const storageGBMetric = await client.metrics.create({
    name: 'Storage (GB)',
    event_name: 'storage_write',
    aggregation: Aggregation.Sum,
    aggregation_property: 'gb',
    description: 'Total gigabytes written',
  })
  console.log(`  ✓ Metric: ${storageGBMetric.name} (${storageGBMetric.id})`)

  const smsMetric = await client.metrics.create({
    name: 'SMS Sent',
    event_name: 'sms_sent',
    aggregation: Aggregation.Count,
    description: 'Counts every SMS dispatched',
  })
  console.log(`  ✓ Metric: ${smsMetric.name} (${smsMetric.id})\n`)

  // ---------------------------------------------------------------------------
  // 1. Flat pricing
  //
  // Every unit costs exactly the same fixed amount.
  // Use case: simple per-call billing where rate never changes.
  //
  //  0 – ∞  calls  →  ₦2.00 each
  // ---------------------------------------------------------------------------
  console.log('→ [1/6] Creating FLAT pricing plan...')
  const flatPlan = await client.plans.create({
    name: 'Flat – API Calls',
    description: '₦2.00 per API call, no tiers.',
    currency: 'NGN',
    plan_type: PlanType.Collection,
    billing_period: BillingPeriod.Monthly,
    prices: [
      {
        metric_id: apiCallMetric.id,
        model: PricingModel.Flat,
        unit_price: '2.000000', // ₦2 per call
      },
    ],
  })
  printPlan(flatPlan)

  // ---------------------------------------------------------------------------
  // 2. Tiered pricing (graduated)
  //
  // Each unit is charged at the rate of the tier it falls into.
  // Heavy usage is progressively cheaper per unit.
  //
  //    1 –  1 000  calls  →  ₦5.00 each
  // 1 001 – 10 000  calls  →  ₦3.00 each
  // 10 001+          calls  →  ₦1.00 each
  // ---------------------------------------------------------------------------
  console.log('→ [2/6] Creating TIERED (graduated) pricing plan...')
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
          { up_to: 1_000, unit_amount: '5.000000' },  // first 1 000: ₦5 each
          { up_to: 10_000, unit_amount: '3.000000' },  // next 9 000: ₦3 each
          { up_to: null, unit_amount: '1.000000' },    // beyond 10 000: ₦1 each
        ],
      },
    ],
  })
  printPlan(tieredPlan)

  // ---------------------------------------------------------------------------
  // 3. Volume pricing
  //
  // The customer's total usage determines which tier they land in, and that
  // single rate is applied to ALL units — not just the units in that tier.
  // Contrast with tiered where each tier's rate applies only to units within it.
  //
  //  0 –  5 000  GB  →  ₦10.00 / GB  (applied to every GB if ≤ 5 000)
  //  5 001 – 20 000 GB  →  ₦7.00  / GB  (applied to every GB if 5 001–20 000)
  //  20 001+          GB  →  ₦5.00  / GB  (applied to every GB if > 20 000)
  // ---------------------------------------------------------------------------
  console.log('→ [3/6] Creating VOLUME pricing plan...')
  const volumePlan = await client.plans.create({
    name: 'Volume – Storage',
    description: 'One rate for all storage, based on total usage tier.',
    currency: 'NGN',
    plan_type: PlanType.Collection,
    billing_period: BillingPeriod.Monthly,
    prices: [
      {
        metric_id: storageGBMetric.id,
        model: PricingModel.Volume,
        tiers: [
          { up_to: 5_000, unit_amount: '10.000000' },  // ≤ 5 000 GB: ₦10/GB all
          { up_to: 20_000, unit_amount: '7.000000' },   // ≤ 20 000 GB: ₦7/GB all
          { up_to: null, unit_amount: '5.000000' },     // > 20 000 GB: ₦5/GB all
        ],
      },
    ],
  })
  printPlan(volumePlan)

  // ---------------------------------------------------------------------------
  // 4. Package pricing
  //
  // Usage is sold in fixed-size bundles (packages). The customer is charged
  // for whole packages, rounding up any partial package.
  //
  //  1 package = 1 000 SMS  →  ₦500 per package
  //
  // A customer sending 1 500 SMS is charged for 2 packages = ₦1 000.
  // ---------------------------------------------------------------------------
  console.log('→ [4/6] Creating PACKAGE pricing plan...')
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
        // unit_price is the price per package.
        // The package size (1 000 SMS) is configured on the metric or plan
        // in the Monigo dashboard; the SDK passes the per-package price here.
        unit_price: '500.000000', // ₦500 per bundle of 1 000 SMS
      },
    ],
  })
  printPlan(packagePlan)

  // ---------------------------------------------------------------------------
  // 5. Overage pricing
  //
  // A free included quota is bundled into the plan; usage beyond that
  // threshold is billed at a per-unit overage rate.
  //
  //  0 – 10 000  calls/month  →  included (₦0)
  //  10 001+      calls/month  →  ₦1.50 each
  //
  // The first tier's unit_amount "0.000000" represents the included quota.
  // The last tier (up_to = null) is the overage rate.
  // ---------------------------------------------------------------------------
  console.log('→ [5/6] Creating OVERAGE pricing plan...')
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
        tiers: [
          { up_to: 10_000, unit_amount: '0.000000' }, // first 10 000: free
          { up_to: null, unit_amount: '1.500000' },   // beyond: ₦1.50 each
        ],
      },
    ],
  })
  printPlan(overagePlan)

  // ---------------------------------------------------------------------------
  // 6. Weighted tiered pricing
  //
  // Similar to graduated tiered pricing, but the final amount is a weighted
  // average of all tier rates based on how much usage fell into each tier.
  // This produces a single blended per-unit price rather than separate line
  // items per tier.
  //
  //    1 –  1 000  GB  →  ₦8.00 / GB
  // 1 001 –  5 000  GB  →  ₦6.00 / GB
  // 5 001+           GB  →  ₦4.00 / GB
  // ---------------------------------------------------------------------------
  console.log('→ [6/6] Creating WEIGHTED TIERED pricing plan...')
  const weightedPlan = await client.plans.create({
    name: 'Weighted Tiered – Storage',
    description: 'Blended per-GB rate derived from weighted average across tiers.',
    currency: 'NGN',
    plan_type: PlanType.Collection,
    billing_period: BillingPeriod.Monthly,
    prices: [
      {
        metric_id: storageGBMetric.id,
        model: PricingModel.WeightedTiered,
        tiers: [
          { up_to: 1_000, unit_amount: '8.000000' }, // first 1 000 GB
          { up_to: 5_000, unit_amount: '6.000000' }, // next 4 000 GB
          { up_to: null, unit_amount: '4.000000' },  // beyond 5 000 GB
        ],
      },
    ],
  })
  printPlan(weightedPlan)

  // ---------------------------------------------------------------------------
  // Subscribe the demo customer to every plan
  // ---------------------------------------------------------------------------
  console.log('→ Subscribing customer to all plans...')
  const plans = [flatPlan, tieredPlan, volumePlan, packagePlan, overagePlan, weightedPlan]
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
