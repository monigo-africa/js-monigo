/**
 * Usage Report — query usage rollups and print a formatted table
 *
 * Demonstrates:
 *  - Querying aggregated usage with optional filters
 *  - Printing a nicely formatted table using string padding
 *  - Summarising totals per aggregation type
 *
 * Run:
 *   cd js-sdk/examples
 *   npm install
 *   MONIGO_API_KEY=mk_test_... npm run usage-report
 *
 * Optional env vars:
 *   MONIGO_BASE_URL=http://localhost:8000
 *   CUSTOMER_ID=<uuid>    — filter to one customer
 *   METRIC_ID=<uuid>      — filter to one metric
 *   FROM=2026-01-01       — ISO date lower bound (default: start of current month)
 *   TO=2026-01-31         — ISO date upper bound (default: now)
 */

import { MonigoClient, MonigoAPIError, type UsageQueryParams } from '@monigo/sdk'

const apiKey = process.env.MONIGO_API_KEY
if (!apiKey) {
  console.error('Error: MONIGO_API_KEY environment variable is required')
  process.exit(1)
}

const client = new MonigoClient({
  apiKey,
  baseURL: process.env.MONIGO_BASE_URL,
})

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…'
}

function pad(s: string | number, n: number): string {
  return String(s).padEnd(n)
}

try {
  // Build query params from env vars
  const params: UsageQueryParams = {}

  if (process.env.CUSTOMER_ID) params.customer_id = process.env.CUSTOMER_ID
  if (process.env.METRIC_ID) params.metric_id = process.env.METRIC_ID

  if (process.env.FROM) {
    params.from = new Date(process.env.FROM)
    if (isNaN(params.from.getTime())) {
      console.error(`Error: FROM="${process.env.FROM}" is not a valid date`)
      process.exit(1)
    }
  }

  if (process.env.TO) {
    params.to = new Date(process.env.TO)
    if (isNaN(params.to.getTime())) {
      console.error(`Error: TO="${process.env.TO}" is not a valid date`)
      process.exit(1)
    }
  }

  const result = await client.usage.query(params)

  if (result.count === 0) {
    console.log('No usage data found for the given filters.')
    process.exit(0)
  }

  console.log(`Usage Report — ${result.count} rollup(s)\n`)

  // Header
  const cols = {
    customer: 14,
    metric: 14,
    period: 16,
    aggregation: 12,
    value: 12,
    events: 12,
    test: 4,
  }

  const header =
    pad('CUSTOMER', cols.customer) +
    pad('METRIC', cols.metric) +
    pad('PERIOD', cols.period) +
    pad('AGGREGATION', cols.aggregation) +
    pad('VALUE', cols.value) +
    pad('EVENTS', cols.events) +
    'TEST'

  const divider =
    '-'.repeat(cols.customer) +
    '-'.repeat(cols.metric) +
    '-'.repeat(cols.period) +
    '-'.repeat(cols.aggregation) +
    '-'.repeat(cols.value) +
    '-'.repeat(cols.events) +
    '----'

  console.log(header)
  console.log(divider)

  const totals: Record<string, number> = {}

  for (const r of result.rollups) {
    const period = `${r.period_start.slice(0, 10)}→${r.period_end.slice(0, 10)}`
    const testFlag = r.is_test ? '✓' : ' '

    console.log(
      pad(truncate(r.customer_id, cols.customer - 2), cols.customer) +
        pad(truncate(r.metric_id, cols.metric - 2), cols.metric) +
        pad(truncate(period, cols.period - 2), cols.period) +
        pad(r.aggregation, cols.aggregation) +
        pad(r.value.toFixed(4), cols.value) +
        pad(r.event_count, cols.events) +
        testFlag,
    )

    totals[r.aggregation] = (totals[r.aggregation] ?? 0) + r.value
  }

  console.log()
  console.log('Totals:')
  for (const [agg, total] of Object.entries(totals)) {
    console.log(`  ${agg}: ${total.toFixed(4)}`)
  }
} catch (err) {
  if (err instanceof MonigoAPIError) {
    console.error(`API error ${err.statusCode}: ${err.message}`)
  } else {
    console.error(err)
  }
  process.exit(1)
}
