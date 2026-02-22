# @monigo/sdk

The official JavaScript/TypeScript client library for the [Monigo](https://monigo.co) API. Zero external dependencies — works natively in Node.js (≥ 18), browsers, Cloudflare Workers, Bun, and Deno.

## Installation

```bash
npm install @monigo/sdk
```

Or with other package managers:

```bash
yarn add @monigo/sdk
pnpm add @monigo/sdk
bun add @monigo/sdk
```

Requires Node.js 18 or later (for native `fetch`). For Node.js 16, see [Polyfilling fetch](#polyfilling-fetch).

## Quick start

```ts
import { MonigoClient, Aggregation, BillingPeriod, PricingModel } from '@monigo/sdk'

const client = new MonigoClient({ apiKey: process.env.MONIGO_API_KEY! })

// Create a customer
const customer = await client.customers.create({
  external_id: 'user_abc123',
  name: 'Acme Corp',
  email: 'billing@acme.com',
})

// Ingest a usage event
await client.events.ingest({
  events: [
    {
      event_name: 'api_call',
      customer_id: customer.id,
      idempotency_key: 'evt_20260201_001',
      timestamp: new Date(),
      properties: { endpoint: '/v1/data', region: 'us-east-1' },
    },
  ],
})

console.log(`Customer ${customer.id} created and event ingested`)
```

> **Tip:** Use a test-mode API key (`mk_test_...`) during development. Test events are isolated from live data and won't trigger real charges.

## Client configuration

### Constructor options

```ts
const client = new MonigoClient({
  apiKey: 'mk_live_...',              // required — your Monigo API key
  baseURL: 'https://api.monigo.co',   // optional — defaults to production
  timeout: 30_000,                     // optional — request timeout in ms (default: none)
  fetch: customFetch,                  // optional — custom fetch implementation
})
```

### Custom base URL

For self-hosted deployments or a local development server:

```ts
const client = new MonigoClient({
  apiKey: process.env.MONIGO_API_KEY!,
  baseURL: 'http://localhost:8000',
})
```

### Polyfilling fetch

Node.js 16 does not include a built-in `fetch`. Pass a polyfill via the `fetch` option:

```ts
import fetch from 'node-fetch'

const client = new MonigoClient({
  apiKey: process.env.MONIGO_API_KEY!,
  fetch: fetch as unknown as typeof globalThis.fetch,
})
```

### Using in tests

The `fetch` option makes the client fully testable without a network:

```ts
const client = new MonigoClient({
  apiKey: 'test_key',
  fetch: (_url, _init) =>
    Promise.resolve(new Response(JSON.stringify({ customer: mockCustomer }))),
})
```

## Authentication

Every request is authenticated with a Bearer token derived from your API key:

```
Authorization: Bearer mk_live_...
```

API keys are scoped to an organisation and carry one of two prefixes:

| Prefix | Mode | Usage |
|--------|------|-------|
| `mk_live_` | Live | Production traffic — charges and payouts are real |
| `mk_test_` | Test | Development / CI — events, customers, and invoices are sandboxed |

## Error handling

All methods return a `Promise`. On a 4xx or 5xx response the SDK throws a `MonigoAPIError` with a typed status code, message, and optional field-level details map.

```ts
import { MonigoAPIError } from '@monigo/sdk'

try {
  const customer = await client.customers.get('cust_missing')
} catch (err) {
  if (err instanceof MonigoAPIError) {
    console.error(`API error ${err.statusCode}: ${err.message}`)
    // { statusCode: 404, message: 'customer not found' }
  }
}
```

### Static type-narrowing guards

Instead of catching and casting, use the static guards on `MonigoAPIError`:

```ts
try {
  await client.subscriptions.create({ customer_id: 'c', plan_id: 'p' })
} catch (err) {
  if (MonigoAPIError.isConflict(err)) {
    // customer already has an active subscription of this plan type
  } else if (MonigoAPIError.isNotFound(err)) {
    // customer or plan not found
  } else if (MonigoAPIError.isRateLimited(err)) {
    // back off and retry
  } else if (err) {
    throw err
  }
}
```

| Guard | HTTP Status | When it fires |
|-------|-------------|---------------|
| `MonigoAPIError.isNotFound(err)` | 404 | Resource does not exist |
| `MonigoAPIError.isUnauthorized(err)` | 401 | Invalid or missing API key |
| `MonigoAPIError.isForbidden(err)` | 403 | API key lacks required scope |
| `MonigoAPIError.isConflict(err)` | 409 | Duplicate resource (e.g. second active subscription of same plan type) |
| `MonigoAPIError.isRateLimited(err)` | 429 | Request rate limit exceeded |
| `MonigoAPIError.isQuotaExceeded(err)` | 402 | Organisation event quota exhausted |
| `MonigoAPIError.isServerError(err)` | 5xx | Unexpected server-side error |

### Instance flags

`MonigoAPIError` also exposes boolean instance properties:

```ts
catch (err) {
  if (err instanceof MonigoAPIError && err.isNotFound) {
    // same as MonigoAPIError.isNotFound(err)
  }
}
```

## Events

The `client.events` service handles usage event ingestion and event replay.

### Ingest events

```ts
const response = await client.events.ingest({
  events: [
    {
      event_name: 'api_call',
      customer_id: 'cust_abc',
      idempotency_key: 'evt_20260201_001',
      timestamp: new Date(),
      properties: {
        endpoint: '/v1/predict',
        region: 'us-east-1',
        tokens: 1500,
      },
    },
  ],
})

console.log('ingested:', response.ingested)
console.log('duplicates:', response.duplicates)
```

The server deduplicates events by `idempotency_key`. Sending the same key twice is safe — the second call appears in `response.duplicates` and won't be counted again. A single `ingest` call can contain up to **1,000 events**.

> **Tip:** Always supply a stable `idempotency_key` (e.g. a UUID or `${customer_id}_${event_type}_${timestamp}`) so retries after a network error don't double-count events.

### Replay events

Replay reprocesses all events in a time window through the metering pipeline. Use this to correct rollups after an outage or metric definition change.

```ts
let job = await client.events.startReplay({
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
  event_name: 'api_call', // omit to replay all event names
})

// Poll until complete
while (job.status === 'pending' || job.status === 'processing') {
  await new Promise(r => setTimeout(r, 5_000))
  job = await client.events.getReplay(job.id)
  console.log(`replayed ${job.events_replayed} / ${job.events_total}`)
}
```

## Customers

```ts
// Create
const customer = await client.customers.create({
  external_id: 'user_123',
  name: 'Acme Corp',
  email: 'billing@acme.com',
})

// List
const { customers, count } = await client.customers.list()
console.log(`${count} customers`)

// Get by Monigo ID
const customer = await client.customers.get('cust_abc')

// Update
const updated = await client.customers.update('cust_abc', {
  name: 'Acme Corp Ltd',
  email: 'newbilling@acme.com',
})

// Delete
await client.customers.delete('cust_abc')
```

> **Tip:** Set `external_id` to your own system's user ID. This lets you look up a customer by your existing identifier without storing Monigo's UUID separately.

## Metrics

A metric defines what gets counted (e.g. "API calls", "GB stored") and how raw event values are aggregated.

```ts
import { Aggregation } from '@monigo/sdk'

// Count events
const metric = await client.metrics.create({
  name: 'API Calls',
  event_name: 'api_call',
  aggregation: Aggregation.Count,
})

// Sum a numeric property (e.g. tokens used)
const metric = await client.metrics.create({
  name: 'Tokens Used',
  event_name: 'completion',
  aggregation: Aggregation.Sum,
  aggregation_property: 'tokens',
})

// List / get / update / delete
const { metrics } = await client.metrics.list()
const metric = await client.metrics.get('metric_abc')
const updated = await client.metrics.update('metric_abc', { name: 'Renamed' })
await client.metrics.delete('metric_abc')
```

### Aggregation constants

| Constant | Value | Description |
|----------|-------|-------------|
| `Aggregation.Count` | `count` | Count the number of matching events |
| `Aggregation.Sum` | `sum` | Sum a numeric property across events |
| `Aggregation.Max` | `max` | Maximum value of a property |
| `Aggregation.Min` | `minimum` | Minimum value of a property |
| `Aggregation.Average` | `average` | Average value of a property |
| `Aggregation.Unique` | `unique` | Count distinct values of a property |

## Plans

A plan combines billing period, currency, and one or more prices. Each price links a metric to a pricing model.

```ts
import { BillingPeriod, PricingModel, PlanType } from '@monigo/sdk'

// Flat rate: ₦50 per API call
const plan = await client.plans.create({
  name: 'Starter',
  currency: 'NGN',
  billing_period: BillingPeriod.Monthly,
  prices: [
    {
      metric_id: 'metric_api_calls',
      model: PricingModel.Flat,
      unit_price: '50.000000',
    },
  ],
})

// Tiered pricing
const plan = await client.plans.create({
  name: 'Growth',
  currency: 'NGN',
  billing_period: BillingPeriod.Monthly,
  prices: [
    {
      metric_id: 'metric_api_calls',
      model: PricingModel.Tiered,
      tiers: [
        { up_to: 10_000, unit_amount: '5.00' },
        { up_to: 100_000, unit_amount: '3.00' },
        { up_to: null, unit_amount: '1.50' },  // null = infinity
      ],
    },
  ],
})

// List / get / update / delete
const { plans } = await client.plans.list()
const plan = await client.plans.get('plan_abc')
const updated = await client.plans.update('plan_abc', { name: 'Renamed' })
await client.plans.delete('plan_abc')
```

### Pricing model constants

| Constant | Value | Description |
|----------|-------|-------------|
| `PricingModel.Flat` | `flat` | Fixed price per unit |
| `PricingModel.Tiered` | `tiered` | Graduated tiers — each unit priced at its tier |
| `PricingModel.Volume` | `volume` | Whole volume priced at one tier |
| `PricingModel.Package` | `package` | Price per block of N units |
| `PricingModel.Overage` | `overage` | Base allowance + per-unit above threshold |
| `PricingModel.WeightedTiered` | `weighted_tiered` | Average price across graduated tiers |

### Plan type and billing period constants

| Constant | Value | Meaning |
|----------|-------|---------|
| `PlanType.Collection` | `collection` | Charge customers (default) |
| `PlanType.Payout` | `payout` | Pay out to vendors |
| `BillingPeriod.Daily` | `daily` | Billed every day |
| `BillingPeriod.Weekly` | `weekly` | Billed every week |
| `BillingPeriod.Monthly` | `monthly` | Billed every month |
| `BillingPeriod.Quarterly` | `quarterly` | Billed every quarter |
| `BillingPeriod.Annually` | `annually` | Billed every year |

## Subscriptions

A subscription links a customer to a plan and tracks the current billing period.

```ts
import { SubscriptionStatus } from '@monigo/sdk'

// Create
const sub = await client.subscriptions.create({
  customer_id: 'cust_abc',
  plan_id: 'plan_starter',
})

// List with filters
const { subscriptions } = await client.subscriptions.list({
  customer_id: 'cust_abc',
  status: SubscriptionStatus.Active,
})

// Get
const sub = await client.subscriptions.get('sub_abc')

// Pause / resume
await client.subscriptions.updateStatus('sub_abc', SubscriptionStatus.Paused)
await client.subscriptions.updateStatus('sub_abc', SubscriptionStatus.Active)

// Cancel (soft-delete)
await client.subscriptions.delete('sub_abc')
```

| Status constant | Value | Meaning |
|-----------------|-------|---------|
| `SubscriptionStatus.Active` | `active` | Billing is running |
| `SubscriptionStatus.Paused` | `paused` | Billing paused; events still accepted |
| `SubscriptionStatus.Canceled` | `canceled` | Subscription ended |

> **Warning:** A customer can hold at most one active subscription per plan type. A second active **collection** or **payout** subscription returns a 409 — catch it with `MonigoAPIError.isConflict(err)`.

## Payout accounts

Payout accounts are bank or mobile-money accounts that a customer can receive payouts to. All methods require a `customerId` as the first argument.

```ts
import { PayoutMethod } from '@monigo/sdk'

// Bank transfer
const account = await client.payoutAccounts.create('cust_abc', {
  account_name: 'John Driver',
  payout_method: PayoutMethod.BankTransfer,
  bank_name: 'First Bank Nigeria',
  bank_code: '011',
  account_number: '3001234567',
  currency: 'NGN',
  is_default: true,
})

// Mobile money
const account = await client.payoutAccounts.create('cust_abc', {
  account_name: 'John Driver',
  payout_method: PayoutMethod.MobileMoney,
  mobile_money_number: '+2348012345678',
  currency: 'NGN',
})

// List all accounts for a customer
const { payout_accounts } = await client.payoutAccounts.list('cust_abc')

// Get / update / delete
const acct = await client.payoutAccounts.get('cust_abc', 'acct_xyz')
await client.payoutAccounts.update('cust_abc', 'acct_xyz', { account_name: 'Jane Driver' })
await client.payoutAccounts.delete('cust_abc', 'acct_xyz')
```

| Method constant | Value |
|-----------------|-------|
| `PayoutMethod.BankTransfer` | `bank_transfer` |
| `PayoutMethod.MobileMoney` | `mobile_money` |

## Invoices

Invoices are generated from subscriptions and contain line items derived from the customer's usage in the billing period.

```ts
import { InvoiceStatus } from '@monigo/sdk'

// Generate a draft invoice
const invoice = await client.invoices.generate('sub_abc')
console.log(`Draft invoice ${invoice.id} — total: ${invoice.total} ${invoice.currency}`)

for (const item of invoice.line_items ?? []) {
  console.log(`  ${item.description}: qty ${item.quantity} × ${item.unit_price} = ${item.amount}`)
}

// List with filters
const { invoices } = await client.invoices.list({
  customer_id: 'cust_abc',
  status: InvoiceStatus.Draft,
})

// Get / finalize / void
const invoice = await client.invoices.get('inv_abc')
const finalized = await client.invoices.finalize('inv_abc')
const voided = await client.invoices.void('inv_abc')
```

| Status constant | Value | Meaning |
|-----------------|-------|---------|
| `InvoiceStatus.Draft` | `draft` | Not yet finalized; amounts may change |
| `InvoiceStatus.Finalized` | `finalized` | Locked and ready for payment |
| `InvoiceStatus.Paid` | `paid` | Payment collected |
| `InvoiceStatus.Void` | `void` | Cancelled |

> **Note:** All monetary amounts (`subtotal`, `total`, `unit_price`) are returned as decimal strings (e.g. `"1500.00"`) to preserve precision across currencies.

## Usage

Query aggregated usage rollups to see how much a customer has consumed in a period.

```ts
// All usage for the current period
const result = await client.usage.query()

// Filter by customer and metric
const result = await client.usage.query({
  customer_id: 'cust_abc',
  metric_id: 'metric_api_calls',
})

// Custom time window — accepts Date objects or ISO strings
const result = await client.usage.query({
  customer_id: 'cust_abc',
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
})

for (const rollup of result.rollups) {
  console.log(
    `customer ${rollup.customer_id} — ${rollup.aggregation}: ${rollup.value}`,
    `(period: ${rollup.period_start} → ${rollup.period_end})`
  )
}
```

## Example programs

The SDK ships five runnable example programs under `examples/`:

| Program | What it demonstrates |
|---------|----------------------|
| `examples/quickstart` | End-to-end: customer → metric → plan → subscription → ingest events |
| `examples/metering` | High-volume batch ingest with idempotency and rate-limit handling |
| `examples/billing` | Generate, inspect, and finalize an invoice |
| `examples/payouts` | Register payout accounts and trigger event replay |
| `examples/usage-report` | Query rollups and print a terminal usage table |

Run any example by setting `MONIGO_API_KEY` and executing from the `examples/` directory:

```bash
cd js-sdk/examples
npm install
MONIGO_API_KEY=mk_test_... npm run quickstart
```

## TypeScript exports

All types and constants are exported from the root:

```ts
import {
  MonigoClient,
  MonigoAPIError,

  // Constants
  Aggregation,
  PricingModel,
  PlanType,
  BillingPeriod,
  SubscriptionStatus,
  InvoiceStatus,
  PayoutMethod,

  // Types
  type Customer,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
  type ListCustomersResponse,
  type Metric,
  type CreateMetricRequest,
  type Plan,
  type CreatePlanRequest,
  type CreatePriceRequest,
  type PriceTier,
  type Subscription,
  type CreateSubscriptionRequest,
  type ListSubscriptionsParams,
  type PayoutAccount,
  type CreatePayoutAccountRequest,
  type Invoice,
  type InvoiceLineItem,
  type ListInvoicesParams,
  type IngestEvent,
  type IngestRequest,
  type IngestResponse,
  type EventReplayJob,
  type UsageRollup,
  type UsageQueryParams,
  type UsageQueryResult,
} from '@monigo/sdk'
```

## Module format

The package ships dual-format bundles to work everywhere:

| Format | File | Used by |
|--------|------|---------|
| ESM | `dist/monigo.js` | Node.js ≥ 12 (with `"type":"module"`), bundlers, browsers |
| CJS | `dist/monigo.cjs` | Node.js CommonJS (`require()`) |
| Types | `dist/index.d.ts` | TypeScript consumers (both formats) |

The `exports` map in `package.json` routes each environment automatically — no manual import paths needed.

## Browser / CDN usage

```html
<script type="module">
  import { MonigoClient } from 'https://esm.sh/@monigo/sdk'

  const client = new MonigoClient({ apiKey: 'mk_test_...' })
  const { customers } = await client.customers.list()
  console.log(customers)
</script>
```

> **Warning:** Never embed a live API key in frontend code. For browser usage, proxy requests through your own backend or use a restricted publishable key if supported.

## Development

### Prerequisites

- Node.js ≥ 18
- npm

### Setup

```bash
cd js-sdk
npm install
```

### Build

```bash
npm run build
```

Produces `dist/monigo.js` (ESM), `dist/monigo.cjs` (CJS), and `dist/index.d.ts`.

### Run tests

```bash
npm run test:run       # run all 90 tests once
npm run test           # watch mode
npm run test:coverage  # with V8 coverage report
```

### Type check

```bash
npm run typecheck
```

## Publishing

The release workflow builds, tests, bumps the version, tags the commit, and publishes to npm in one command:

```bash
# Patch release (1.0.0 → 1.0.1) — bug fixes
npm run release:patch

# Minor release (1.0.0 → 1.1.0) — new features, backwards-compatible
npm run release:minor

# Major release (1.0.0 → 2.0.0) — breaking changes
npm run release:major
```

Each command runs:
1. `npm run build` — compile TypeScript and bundle
2. `npm run test:run` — run the full test suite
3. `npm version <patch|minor|major>` — bump `package.json` and create a git tag
4. `git push --follow-tags` — push the commit and tag to the remote
5. `npm publish --access public` — publish to the npm registry

### CI/CD

Add this GitHub Actions workflow to publish automatically on a tag push:

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  push:
    tags:
      - 'js-sdk/v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
        working-directory: js-sdk
      - run: npm run build
        working-directory: js-sdk
      - run: npm run test:run
        working-directory: js-sdk
      - run: npm publish --access public
        working-directory: js-sdk
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Versioning

This SDK follows [Semantic Versioning](https://semver.org/):

- **Patch** (`x.y.Z`) — bug fixes, internal improvements, no API changes
- **Minor** (`x.Y.0`) — new methods or options, fully backwards-compatible
- **Major** (`X.0.0`) — breaking changes to the public API surface

## Changelog

### 1.0.0 (2026-02-22)

- Initial release
- Full coverage of all 9 Monigo API resource groups: Events, Customers, Metrics, Plans, Subscriptions, Payout Accounts, Invoices, Usage
- Dual ESM + CJS build via Vite library mode
- 90 unit tests with zero external dependencies
- TypeScript types and constant objects for all enum values

## License

MIT
