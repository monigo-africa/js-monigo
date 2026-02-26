// =============================================================================
// Aggregation constants
// =============================================================================

export const Aggregation = {
  Count: 'count',
  Sum: 'sum',
  Max: 'max',
  Min: 'minimum',
  Average: 'average',
  Unique: 'unique',
} as const

export type AggregationType = (typeof Aggregation)[keyof typeof Aggregation]

// =============================================================================
// Pricing model constants
// =============================================================================

export const PricingModel = {
  /** Fixed price per unit. Requires `unit_price`. */
  Flat: 'flat_unit',
  /** Alias for `Flat`. */
  PerUnit: 'per_unit',
  /** Graduated tiers — each unit charged at the rate of the tier it falls into.
   *  Requires a `PriceTier[]` in the `tiers` field. */
  Tiered: 'tiered',
  /** Charge per bundle of N units. Partial bundles round up.
   *  Requires a `PackageConfig` object in the `tiers` field. */
  Package: 'package',
  /** Flat base fee covers an included quota; per-unit rate beyond it.
   *  Requires an `OverageConfig` object in the `tiers` field. */
  Overage: 'overage',
} as const

export type PricingModelType = (typeof PricingModel)[keyof typeof PricingModel]

// =============================================================================
// Plan constants
// =============================================================================

export const PlanType = {
  Collection: 'collection',
  Payout: 'payout',
} as const

export type PlanTypeValue = (typeof PlanType)[keyof typeof PlanType]

export const BillingPeriod = {
  Daily: 'daily',
  Weekly: 'weekly',
  Monthly: 'monthly',
  Quarterly: 'quarterly',
  Annually: 'annually',
} as const

export type BillingPeriodValue = (typeof BillingPeriod)[keyof typeof BillingPeriod]

// =============================================================================
// Subscription status constants
// =============================================================================

export const SubscriptionStatus = {
  Active: 'active',
  Paused: 'paused',
  Canceled: 'canceled',
} as const

export type SubscriptionStatusValue = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

// =============================================================================
// Invoice status constants
// =============================================================================

export const InvoiceStatus = {
  Draft: 'draft',
  Finalized: 'finalized',
  Paid: 'paid',
  Void: 'void',
} as const

export type InvoiceStatusValue = (typeof InvoiceStatus)[keyof typeof InvoiceStatus]

// =============================================================================
// Payout method constants
// =============================================================================

export const PayoutMethod = {
  BankTransfer: 'bank_transfer',
  MobileMoney: 'mobile_money',
} as const

export type PayoutMethodValue = (typeof PayoutMethod)[keyof typeof PayoutMethod]

// =============================================================================
// Events
// =============================================================================

/** A single usage event sent to the Monigo ingestion pipeline. */
export interface IngestEvent {
  /**
   * The name of the event, e.g. `"api_call"` or `"storage.write"`.
   * Must match the `event_name` on one or more metrics you have configured.
   */
  event_name: string
  /** The Monigo customer UUID this event belongs to. */
  customer_id: string
  /**
   * A unique key for this event. Re-sending the same key is safe — the server
   * will de-duplicate automatically. Use a UUID or any stable ID you control.
   */
  idempotency_key: string
  /**
   * ISO 8601 timestamp for when the event occurred. Backdated events are
   * accepted within the configured replay window. Defaults to now if omitted.
   */
  timestamp?: string | Date
  /**
   * Arbitrary key-value pairs attached to the event. Use these for dimensions
   * such as `{ endpoint: "/checkout", region: "eu-west-1" }`.
   */
  properties?: Record<string, unknown>
}

/** Request body for `POST /v1/ingest`. */
export interface IngestRequest {
  events: IngestEvent[]
}

/** Response from `POST /v1/ingest`. */
export interface IngestResponse {
  /** Idempotency keys of events that were successfully ingested. */
  ingested: string[]
  /** Idempotency keys that were skipped because they already existed. */
  duplicates: string[]
}

/** Request body for `POST /v1/events/replay`. */
export interface StartReplayRequest {
  /** Start of the replay window (ISO 8601). */
  from: string | Date
  /** End of the replay window (ISO 8601). */
  to: string | Date
  /** Optional event name to replay. Omit to replay all event types. */
  event_name?: string
}

/** Tracks the progress of an asynchronous event replay job. */
export interface EventReplayJob {
  id: string
  org_id: string
  initiated_by: string
  /** `pending` | `processing` | `completed` | `failed` */
  status: string
  from_timestamp: string
  to_timestamp: string
  event_name: string | null
  is_test: boolean
  events_total: number
  events_replayed: number
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// =============================================================================
// Customers
// =============================================================================

/** An end-customer record in your Monigo organisation. */
export interface Customer {
  id: string
  org_id: string
  /** The ID for this customer in your own system. */
  external_id: string
  name: string
  email: string
  /** Phone number in E.164 international format (e.g. +2348012345678). */
  phone: string
  /** Arbitrary JSON metadata. */
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface CreateCustomerRequest {
  /** Your internal ID for this customer. */
  external_id: string
  name: string
  email?: string
  /** Phone number in E.164 international format (e.g. +2348012345678). Optional. */
  phone?: string
  metadata?: Record<string, unknown>
}

export interface UpdateCustomerRequest {
  name?: string
  email?: string
  /** Phone number in E.164 international format (e.g. +2348012345678). Optional. */
  phone?: string
  metadata?: Record<string, unknown>
}

export interface ListCustomersResponse {
  customers: Customer[]
  count: number
}

// =============================================================================
// Metrics
// =============================================================================

/** Defines what usage is counted and how. */
export interface Metric {
  id: string
  org_id: string
  name: string
  /** The `event_name` value that this metric tracks. */
  event_name: string
  /** How events are aggregated. Use `Aggregation` constants. */
  aggregation: AggregationType
  /** For sum/max/min/average: the Properties key whose value is used. */
  aggregation_property?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface CreateMetricRequest {
  /** Human-readable label, e.g. `"API Calls"`. */
  name: string
  /** The `event_name` value to track. */
  event_name: string
  /** How events are aggregated. Use `Aggregation` constants. */
  aggregation: AggregationType
  description?: string
  /** Required for sum/max/min/average aggregations. */
  aggregation_property?: string
}

export interface UpdateMetricRequest {
  name?: string
  event_name?: string
  aggregation?: AggregationType
  description?: string
  aggregation_property?: string
}

export interface ListMetricsResponse {
  metrics: Metric[]
  count: number
}

// =============================================================================
// Plans & Prices
// =============================================================================

/**
 * One step in a `tiered` pricing model.
 * Set `up_to` to `null` for the final (infinite) tier.
 */
export interface PriceTier {
  up_to: number | null
  /** Price per unit in this tier as a decimal string, e.g. `"0.50"`. */
  unit_amount: string
}

/**
 * Configuration for the `package` pricing model.
 * Pass this as the `tiers` field when `model` is `PricingModel.Package`.
 */
export interface PackageConfig {
  /** Number of units per bundle, e.g. `1000` for "1 000 SMS per bundle". */
  package_size: number
  /** Price per complete bundle as a decimal string, e.g. `"500.000000"`. */
  package_price: string
  /** If `true`, partial bundles are rounded up to the next whole bundle. */
  round_up_partial_block: boolean
}

/**
 * Configuration for the `overage` pricing model.
 * Pass this as the `tiers` field when `model` is `PricingModel.Overage`.
 */
export interface OverageConfig {
  /** Free quota. Usage at or below this threshold is charged `base_price`. */
  included_units: number
  /** Flat fee for usage up to `included_units` as a decimal string.
   *  Set to `"0.000000"` when there is no base fee. */
  base_price: string
  /** Per-unit rate applied to every unit above `included_units`,
   *  as a decimal string, e.g. `"1.500000"`. */
  overage_price: string
}

/** Describes a price to attach when creating a plan. */
export interface CreatePriceRequest {
  /** UUID of the metric this price is based on. */
  metric_id: string
  /** Pricing model. Use `PricingModel` constants. */
  model: PricingModelType
  /** Flat price per unit as a decimal string.
   *  Required for `PricingModel.Flat` / `PricingModel.PerUnit`. */
  unit_price?: string
  /**
   * Model-specific configuration:
   * - `PricingModel.Tiered`  → `PriceTier[]`
   * - `PricingModel.Package` → `PackageConfig`
   * - `PricingModel.Overage` → `OverageConfig`
   */
  tiers?: PriceTier[] | PackageConfig | OverageConfig
}

/** Describes an updated price. Include `id` to update an existing price; omit to add a new one. */
export interface UpdatePriceRequest {
  id?: string
  metric_id?: string
  model?: PricingModelType
  unit_price?: string
  tiers?: PriceTier[] | PackageConfig | OverageConfig
}

/** A pricing rule attached to a plan. */
export interface Price {
  id: string
  plan_id: string
  metric_id: string
  model: PricingModelType
  unit_price: string
  tiers: PriceTier[] | null
  created_at: string
  updated_at: string
}

/** A billing plan that defines pricing for one or more metrics. */
export interface Plan {
  id: string
  org_id: string
  name: string
  description?: string
  /** ISO 4217 currency code, e.g. `"NGN"`. */
  currency: string
  /** Use `PlanType` constants. */
  plan_type: PlanTypeValue
  /** Use `BillingPeriod` constants. */
  billing_period: BillingPeriodValue
  trial_period_days: number
  prices?: Price[]
  created_at: string
  updated_at: string
}

export interface CreatePlanRequest {
  name: string
  description?: string
  /** ISO 4217 currency code. Defaults to `"NGN"`. */
  currency?: string
  /** Use `PlanType` constants. Defaults to `"collection"`. */
  plan_type?: PlanTypeValue
  /** Use `BillingPeriod` constants. Defaults to `"monthly"`. */
  billing_period?: BillingPeriodValue
  /** Trial period in days. Set to `0` for no trial. */
  trial_period_days?: number
  prices?: CreatePriceRequest[]
}

export interface UpdatePlanRequest {
  name?: string
  description?: string
  currency?: string
  plan_type?: PlanTypeValue
  billing_period?: BillingPeriodValue
  prices?: UpdatePriceRequest[]
}

export interface ListPlansResponse {
  plans: Plan[]
  count: number
}

// =============================================================================
// Subscriptions
// =============================================================================

/** Links a customer to a billing plan. */
export interface Subscription {
  id: string
  org_id: string
  customer_id: string
  plan_id: string
  /** Use `SubscriptionStatus` constants. */
  status: SubscriptionStatusValue
  current_period_start: string
  current_period_end: string
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateSubscriptionRequest {
  /** UUID of the customer to subscribe. */
  customer_id: string
  /** UUID of the plan to subscribe the customer to. */
  plan_id: string
}

export interface ListSubscriptionsParams {
  /** Filter to a specific customer UUID. */
  customer_id?: string
  /** Filter to a specific plan UUID. */
  plan_id?: string
  /** Filter by status. Use `SubscriptionStatus` constants. */
  status?: SubscriptionStatusValue
}

export interface ListSubscriptionsResponse {
  subscriptions: Subscription[]
  count: number
}

// =============================================================================
// Payout accounts
// =============================================================================

/** A bank or mobile-money account that a customer can be paid to. */
export interface PayoutAccount {
  id: string
  customer_id: string
  org_id: string
  account_name: string
  bank_name?: string
  bank_code?: string
  account_number?: string
  mobile_money_number?: string
  /** Use `PayoutMethod` constants. */
  payout_method: PayoutMethodValue
  currency: string
  is_default: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface CreatePayoutAccountRequest {
  account_name: string
  /** Use `PayoutMethod` constants. */
  payout_method: PayoutMethodValue
  bank_name?: string
  bank_code?: string
  account_number?: string
  mobile_money_number?: string
  currency?: string
  is_default?: boolean
  metadata?: Record<string, unknown>
}

export interface UpdatePayoutAccountRequest {
  account_name?: string
  payout_method?: PayoutMethodValue
  bank_name?: string
  account_number?: string
  currency?: string
  is_default?: boolean
  metadata?: Record<string, unknown>
}

export interface ListPayoutAccountsResponse {
  payout_accounts: PayoutAccount[]
  count: number
}

// =============================================================================
// Invoices
// =============================================================================

/** One line item on an invoice. */
export interface InvoiceLineItem {
  id: string
  invoice_id: string
  metric_id: string
  price_id?: string
  description: string
  quantity: string
  unit_price: string
  /** Amount for this line as a decimal string. */
  amount: string
  created_at: string
}

/**
 * A billing invoice.
 * All monetary values (`subtotal`, `vat_amount`, `total`) are decimal strings
 * to avoid floating-point precision issues.
 */
export interface Invoice {
  id: string
  org_id: string
  customer_id: string
  subscription_id: string
  /** Use `InvoiceStatus` constants. */
  status: InvoiceStatusValue
  currency: string
  subtotal: string
  vat_enabled: boolean
  vat_rate?: string
  vat_amount?: string
  total: string
  period_start: string
  period_end: string
  finalized_at: string | null
  paid_at: string | null
  provider_invoice_id?: string
  line_items?: InvoiceLineItem[]
  created_at: string
  updated_at: string
}

export interface ListInvoicesParams {
  /** Filter by status. Use `InvoiceStatus` constants. */
  status?: InvoiceStatusValue
  /** Filter to a specific customer UUID. */
  customer_id?: string
}

export interface ListInvoicesResponse {
  invoices: Invoice[]
  count: number
}

// =============================================================================
// Usage
// =============================================================================

/** One aggregated usage record for a (customer, metric, period) tuple. */
export interface UsageRollup {
  id: string
  org_id: string
  customer_id: string
  metric_id: string
  period_start: string
  period_end: string
  aggregation: AggregationType
  /** Aggregated value (count, sum, max, etc.). */
  value: number
  event_count: number
  last_event_at: string | null
  is_test: boolean
  created_at: string
  updated_at: string
}

export interface UsageQueryParams {
  /** Filter rollups to a specific customer UUID. */
  customer_id?: string
  /** Filter rollups to a specific metric UUID. */
  metric_id?: string
  /**
   * Lower bound for `period_start` (ISO 8601).
   * Defaults to the start of the current billing period.
   */
  from?: string | Date
  /**
   * Exclusive upper bound for `period_start` (ISO 8601).
   * Defaults to the end of the current billing period.
   */
  to?: string | Date
}

export interface UsageQueryResult {
  rollups: UsageRollup[]
  count: number
}

// =============================================================================
// Portal tokens
// =============================================================================

/**
 * A portal token grants an end-customer read-only access to their invoices,
 * payout slips, subscriptions, and payout accounts in the Monigo hosted portal.
 */
export interface PortalToken {
  id: string
  org_id: string
  customer_id: string
  /** The opaque 64-character hex token embedded in the portal URL. */
  token: string
  label: string
  /** ISO 8601 expiry timestamp, or `null` for a permanent link. */
  expires_at: string | null
  /** ISO 8601 revocation timestamp, or `null` if still active. */
  revoked_at: string | null
  created_at: string
  updated_at: string
  /** Fully-qualified URL to share with the customer, e.g. `https://app.monigo.co/portal/<token>`. */
  portal_url: string
}

/** Request body for `portalTokens.create()`. */
export interface CreatePortalTokenRequest {
  /**
   * The `external_id` you assigned this customer when you called
   * `customers.create()`.
   */
  customer_external_id: string
  /** Optional human-readable label, e.g. `"Main portal link"`. */
  label?: string
  /**
   * Optional RFC 3339 expiry timestamp. Omit to create a permanent link.
   * Example: `"2027-01-01T00:00:00Z"`
   */
  expires_at?: string
}

export interface ListPortalTokensResponse {
  tokens: PortalToken[]
  count: number
}
