/**
 * Metering — high-volume idempotent event ingestion
 *
 * Demonstrates:
 *  - Sending events in configurable batch sizes (default: 100 per call)
 *  - Deterministic idempotency keys so re-running is always safe
 *  - Simple rate-limit retry (back off 1 s on 429)
 *  - Tally of ingested vs duplicate events
 *
 * Run:
 *   cd js-sdk/examples
 *   npm install
 *   MONIGO_API_KEY=mk_test_... CUSTOMER_ID=<uuid> npm run metering
 *
 * Optional env vars:
 *   MONIGO_BASE_URL=http://localhost:8000
 *   BATCH_SIZE=100          — events per ingest call (max 1000)
 *   TOTAL_EVENTS=500        — total events to send
 *   RUN_ID=my-stable-run-id — set a fixed RUN_ID to make every re-run
 *                             produce duplicates instead of new events
 */

import { MonigoClient, MonigoAPIError } from '@monigo/sdk'

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

const batchSize = parseInt(process.env.BATCH_SIZE ?? '100', 10)
const totalEvents = parseInt(process.env.TOTAL_EVENTS ?? '500', 10)

const client = new MonigoClient({
  apiKey,
  baseURL: process.env.MONIGO_BASE_URL,
})

// Use a stable run ID so re-running this program produces duplicates rather
// than double-counting — this is the safe, idempotent pattern.
let runId = process.env.RUN_ID
if (!runId) {
  runId = `metering-example-${Date.now()}`
  console.log(`RUN_ID not set, using: ${runId}`)
  console.log(`Re-run with RUN_ID=${runId} to see all events reported as duplicates.`)
  console.log()
}

console.log(`Metering example: ${totalEvents} events in batches of ${batchSize}\n`)

let totalIngested = 0
let totalDuplicates = 0
const now = new Date()
let batch: Array<{
  event_name: string
  customer_id: string
  idempotency_key: string
  timestamp: Date
  properties: Record<string, unknown>
}> = []

async function flushBatch(batchStart: number): Promise<void> {
  let resp
  try {
    resp = await client.events.ingest({ events: batch })
  } catch (err) {
    if (MonigoAPIError.isRateLimited(err)) {
      console.log('  Rate limited — sleeping 1s before retry')
      await new Promise(r => setTimeout(r, 1_000))
      resp = await client.events.ingest({ events: batch })
    } else {
      throw err
    }
  }
  const batchEnd = batchStart + batch.length - 1
  console.log(
    `Batch ${String(batchStart).padStart(4)} – ${String(batchEnd).padStart(4)}: ` +
      `ingested=${resp.ingested.length}, duplicates=${resp.duplicates.length}`,
  )
  totalIngested += resp.ingested.length
  totalDuplicates += resp.duplicates.length
  batch = []
}

try {
  for (let i = 0; i < totalEvents; i++) {
    batch.push({
      event_name: 'api_call',
      customer_id: customerId,
      idempotency_key: `${runId}-event-${i}`,
      timestamp: new Date(now.getTime() - i),
      properties: {
        endpoint: `/v1/resource/${i % 10}`,
        latency_ms: 42 + (i % 30),
      },
    })

    if (batch.length === batchSize || i === totalEvents - 1) {
      await flushBatch(i - batch.length + 1)
    }
  }

  console.log()
  console.log(`✅ Done. Total ingested: ${totalIngested}, Total duplicates: ${totalDuplicates}`)
} catch (err) {
  if (err instanceof MonigoAPIError) {
    console.error(`API error ${err.statusCode}: ${err.message}`)
  } else {
    console.error(err)
  }
  process.exit(1)
}
