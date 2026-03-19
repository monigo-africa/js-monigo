import { MonigoAPIError } from './errors.js'
import { EventsResource } from './resources/events.js'
import { CustomersResource } from './resources/customers.js'
import { MetricsResource } from './resources/metrics.js'
import { PlansResource } from './resources/plans.js'
import { SubscriptionsResource } from './resources/subscriptions.js'
import { PayoutAccountsResource } from './resources/payout-accounts.js'
import { InvoicesResource } from './resources/invoices.js'
import { UsageResource } from './resources/usage.js'
import { PortalTokensResource } from './resources/portal-tokens.js'
import { WalletsResource } from './resources/wallets.js'

const DEFAULT_BASE_URL = 'https://api.monigo.co'
const DEFAULT_TIMEOUT_MS = 30_000

export interface MonigoClientOptions {
  /**
   * Your Monigo API key. Obtain one from the API Keys section of your
   * Monigo dashboard. Never expose this key in client-side code.
   */
  apiKey: string
  /**
   * Override the default API base URL (`https://api.monigo.co`).
   * Useful for self-hosted deployments or pointing at a local dev server.
   *
   * @default "https://api.monigo.co"
   */
  baseURL?: string
  /**
   * Custom `fetch` implementation. Defaults to `globalThis.fetch`.
   * Pass a polyfill for environments that do not have native fetch
   * (Node.js < 18) or to inject a mock in tests.
   */
  fetch?: typeof globalThis.fetch
  /**
   * Request timeout in milliseconds.
   *
   * @default 30000
   */
  timeout?: number
}

/**
 * Options accepted by every mutating method (POST, PUT, PATCH).
 */
export interface MutationOptions {
  /**
   * A unique key that prevents the same request from being processed more than
   * once. Pass a stable value (e.g. a request ID from your own system) to make
   * retries safe. When omitted, the SDK generates a UUID v4 automatically.
   */
  idempotencyKey?: string
}

/** @internal */
export interface RequestOptions {
  body?: unknown
  query?: Record<string, string | undefined>
  idempotencyKey?: string
}

/**
 * The Monigo API client.
 *
 * Instantiate once and reuse across your application:
 *
 * ```ts
 * import { MonigoClient } from '@monigo/sdk'
 *
 * const monigo = new MonigoClient({ apiKey: process.env.MONIGO_API_KEY! })
 *
 * // Ingest a usage event
 * await monigo.events.ingest({
 *   events: [{
 *     event_name: 'api_call',
 *     customer_id: 'cust_abc123',
 *     idempotency_key: crypto.randomUUID(),
 *   }],
 * })
 * ```
 */
export class MonigoClient {
  /** @internal */
  readonly _apiKey: string
  /** @internal */
  readonly _baseURL: string
  /** @internal */
  readonly _fetchFn: typeof globalThis.fetch
  /** @internal */
  readonly _timeout: number

  /** Ingest usage events and manage event replays. Requires `ingest` scope. */
  readonly events: EventsResource
  /** Manage your end-customers (CRUD). Requires `read` / `write` scope. */
  readonly customers: CustomersResource
  /** Manage billing metrics — what gets counted and how. Requires `read` / `write` scope. */
  readonly metrics: MetricsResource
  /** Manage billing plans and their prices. Requires `read` / `write` scope. */
  readonly plans: PlansResource
  /** Link customers to plans and manage subscription lifecycle. Requires `read` / `write` scope. */
  readonly subscriptions: SubscriptionsResource
  /** Manage bank / mobile-money payout accounts for customers. Requires `read` / `write` scope. */
  readonly payoutAccounts: PayoutAccountsResource
  /** Generate, list, finalize, and void invoices. Requires `read` / `write` scope. */
  readonly invoices: InvoicesResource
  /** Query aggregated usage rollups per customer and metric. Requires `read` scope. */
  readonly usage: UsageResource
  /** Manage customer portal access links. Requires `read` / `write` scope. */
  readonly portalTokens: PortalTokensResource
  /** Manage customer wallets, balance operations, and virtual accounts. Requires `read` / `write` scope. */
  readonly wallets: WalletsResource

  constructor(options: MonigoClientOptions) {
    if (!options.apiKey) {
      throw new Error('MonigoClient: apiKey is required')
    }

    this._apiKey = options.apiKey
    this._baseURL = (options.baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    this._timeout = options.timeout ?? DEFAULT_TIMEOUT_MS

    const fetchFn = options.fetch ?? (typeof globalThis !== 'undefined' ? globalThis.fetch : undefined)
    if (!fetchFn) {
      throw new Error(
        'MonigoClient: fetch is not available in this environment. ' +
          'Pass a custom fetch implementation via options.fetch, ' +
          'or upgrade to Node.js 18+.',
      )
    }
    this._fetchFn = fetchFn.bind(globalThis)

    this.events = new EventsResource(this)
    this.customers = new CustomersResource(this)
    this.metrics = new MetricsResource(this)
    this.plans = new PlansResource(this)
    this.subscriptions = new SubscriptionsResource(this)
    this.payoutAccounts = new PayoutAccountsResource(this)
    this.invoices = new InvoicesResource(this)
    this.usage = new UsageResource(this)
    this.portalTokens = new PortalTokensResource(this)
    this.wallets = new WalletsResource(this)
  }

  /**
   * Execute an authenticated HTTP request against the Monigo API.
   * @internal — use the resource methods instead.
   */
  async _request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    let url = this._baseURL + path

    if (options.query) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== '') {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      if (qs) url += '?' + qs
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this._timeout)

    const isMutating = method === 'POST' || method === 'PUT' || method === 'PATCH'
    const idempotencyKey = isMutating
      ? (options.idempotencyKey ?? globalThis.crypto.randomUUID())
      : undefined

    try {
      const response = await this._fetchFn(url, {
        method,
        headers: {
          Authorization: `Bearer ${this._apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
        body: options.body != null ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      })

      const text = await response.text()

      if (!response.ok) {
        let message = text || response.statusText
        let details: Record<string, string> | undefined
        try {
          const parsed = JSON.parse(text) as {
            error?: string
            message?: string
            details?: Record<string, string>
          }
          message = parsed.error ?? parsed.message ?? message
          details = parsed.details
        } catch {
          // Use raw text as the error message
        }
        throw new MonigoAPIError(response.status, message, details)
      }

      if (!text) return undefined as T
      return JSON.parse(text) as T
    } catch (err) {
      if (err instanceof MonigoAPIError) throw err
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(
          `MonigoClient: request to ${url} timed out after ${this._timeout}ms`,
        )
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /** Normalise a `Date | string` value to an ISO 8601 string. */
  static toISOString(value: string | Date): string {
    return value instanceof Date ? value.toISOString() : value
  }
}
