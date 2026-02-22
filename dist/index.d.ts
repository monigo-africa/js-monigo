export declare const Aggregation: {
    readonly Count: "count";
    readonly Sum: "sum";
    readonly Max: "max";
    readonly Min: "minimum";
    readonly Average: "average";
    readonly Unique: "unique";
};

export declare type AggregationType = (typeof Aggregation)[keyof typeof Aggregation];

export declare const BillingPeriod: {
    readonly Daily: "daily";
    readonly Weekly: "weekly";
    readonly Monthly: "monthly";
    readonly Quarterly: "quarterly";
    readonly Annually: "annually";
};

export declare type BillingPeriodValue = (typeof BillingPeriod)[keyof typeof BillingPeriod];

export declare interface CreateCustomerRequest {
    /** Your internal ID for this customer. */
    external_id: string;
    name: string;
    email: string;
    metadata?: Record<string, unknown>;
}

export declare interface CreateMetricRequest {
    /** Human-readable label, e.g. `"API Calls"`. */
    name: string;
    /** The `event_name` value to track. */
    event_name: string;
    /** How events are aggregated. Use `Aggregation` constants. */
    aggregation: AggregationType;
    description?: string;
    /** Required for sum/max/min/average aggregations. */
    aggregation_property?: string;
}

export declare interface CreatePayoutAccountRequest {
    account_name: string;
    /** Use `PayoutMethod` constants. */
    payout_method: PayoutMethodValue;
    bank_name?: string;
    bank_code?: string;
    account_number?: string;
    mobile_money_number?: string;
    currency?: string;
    is_default?: boolean;
    metadata?: Record<string, unknown>;
}

export declare interface CreatePlanRequest {
    name: string;
    description?: string;
    /** ISO 4217 currency code. Defaults to `"NGN"`. */
    currency?: string;
    /** Use `PlanType` constants. Defaults to `"collection"`. */
    plan_type?: PlanTypeValue;
    /** Use `BillingPeriod` constants. Defaults to `"monthly"`. */
    billing_period?: BillingPeriodValue;
    /** Trial period in days. Set to `0` for no trial. */
    trial_period_days?: number;
    prices?: CreatePriceRequest[];
}

/** Describes a price to attach when creating a plan. */
export declare interface CreatePriceRequest {
    /** UUID of the metric this price is based on. */
    metric_id: string;
    /** Pricing model. Use `PricingModel` constants. */
    model: PricingModelType;
    /** Flat price per unit as a decimal string (used for flat/overage/package models). */
    unit_price?: string;
    /** Price tiers for tiered/volume/weighted_tiered models. */
    tiers?: PriceTier[];
}

export declare interface CreateSubscriptionRequest {
    /** UUID of the customer to subscribe. */
    customer_id: string;
    /** UUID of the plan to subscribe the customer to. */
    plan_id: string;
}

/** An end-customer record in your Monigo organisation. */
export declare interface Customer {
    id: string;
    org_id: string;
    /** The ID for this customer in your own system. */
    external_id: string;
    name: string;
    email: string;
    /** Arbitrary JSON metadata. */
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

/** Manage end-customers in your Monigo organisation. */
export declare class CustomersResource {
    private readonly client;
    constructor(client: MonigoClient);
    /**
     * Register a new customer.
     *
     * **Requires `write` scope.**
     *
     * @example
     * ```ts
     * const customer = await monigo.customers.create({
     *   external_id: 'usr_12345',
     *   name: 'Acme Corp',
     *   email: 'billing@acme.com',
     *   metadata: { plan_tier: 'enterprise' },
     * })
     * ```
     */
    create(request: CreateCustomerRequest, options?: MutationOptions): Promise<Customer>;
    /**
     * Return all customers in the authenticated organisation.
     *
     * **Requires `read` scope.**
     */
    list(): Promise<ListCustomersResponse>;
    /**
     * Fetch a single customer by their Monigo UUID.
     *
     * **Requires `read` scope.**
     */
    get(customerId: string): Promise<Customer>;
    /**
     * Update a customer's name, email, or metadata.
     * Only fields that are present in `request` are updated.
     *
     * **Requires `write` scope.**
     *
     * @example
     * ```ts
     * const updated = await monigo.customers.update(customerId, {
     *   email: 'new@acme.com',
     * })
     * ```
     */
    update(customerId: string, request: UpdateCustomerRequest, options?: MutationOptions): Promise<Customer>;
    /**
     * Permanently delete a customer record.
     *
     * **Requires `write` scope.**
     */
    delete(customerId: string): Promise<void>;
}

/** Tracks the progress of an asynchronous event replay job. */
export declare interface EventReplayJob {
    id: string;
    org_id: string;
    initiated_by: string;
    /** `pending` | `processing` | `completed` | `failed` */
    status: string;
    from_timestamp: string;
    to_timestamp: string;
    event_name: string | null;
    is_test: boolean;
    events_total: number;
    events_replayed: number;
    error_message: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

/** Handles usage event ingestion and asynchronous event replay. */
export declare class EventsResource {
    private readonly client;
    constructor(client: MonigoClient);
    /**
     * Ingest one or more usage events into the Monigo pipeline.
     *
     * Events are processed asynchronously. The response confirms receipt
     * and reports any duplicate idempotency keys.
     *
     * **Requires `ingest` scope.**
     *
     * @example
     * ```ts
     * const result = await monigo.events.ingest({
     *   events: [{
     *     event_name: 'api_call',
     *     customer_id: 'cust_abc',
     *     idempotency_key: crypto.randomUUID(),
     *     timestamp: new Date().toISOString(),
     *     properties: { endpoint: '/checkout', region: 'eu-west-1' },
     *   }],
     * })
     * console.log('Ingested:', result.ingested.length)
     * console.log('Duplicates:', result.duplicates.length)
     * ```
     */
    ingest(request: IngestRequest, options?: MutationOptions): Promise<IngestResponse>;
    /**
     * Start an asynchronous replay of all raw events in a given time window
     * through the current processing pipeline. Useful for backfilling usage
     * data after changing metric definitions.
     *
     * Returns a replay job immediately — poll `getReplay()` to track progress.
     *
     * **Requires `ingest` scope.**
     *
     * @example
     * ```ts
     * const job = await monigo.events.startReplay({
     *   from: '2025-01-01T00:00:00Z',
     *   to: '2025-01-31T23:59:59Z',
     *   event_name: 'api_call', // omit to replay all event types
     * })
     * console.log('Replay job:', job.id, job.status)
     * ```
     */
    startReplay(request: StartReplayRequest, options?: MutationOptions): Promise<EventReplayJob>;
    /**
     * Fetch the current status and progress of an event replay job.
     *
     * **Requires `ingest` scope.**
     *
     * @example
     * ```ts
     * const job = await monigo.events.getReplay(jobId)
     * if (job.status === 'completed') {
     *   console.log(`Replayed ${job.events_replayed} / ${job.events_total} events`)
     * }
     * ```
     */
    getReplay(jobId: string): Promise<EventReplayJob>;
}

/** A single usage event sent to the Monigo ingestion pipeline. */
export declare interface IngestEvent {
    /**
     * The name of the event, e.g. `"api_call"` or `"storage.write"`.
     * Must match the `event_name` on one or more metrics you have configured.
     */
    event_name: string;
    /** The Monigo customer UUID this event belongs to. */
    customer_id: string;
    /**
     * A unique key for this event. Re-sending the same key is safe — the server
     * will de-duplicate automatically. Use a UUID or any stable ID you control.
     */
    idempotency_key: string;
    /**
     * ISO 8601 timestamp for when the event occurred. Backdated events are
     * accepted within the configured replay window. Defaults to now if omitted.
     */
    timestamp?: string | Date;
    /**
     * Arbitrary key-value pairs attached to the event. Use these for dimensions
     * such as `{ endpoint: "/checkout", region: "eu-west-1" }`.
     */
    properties?: Record<string, unknown>;
}

/** Request body for `POST /v1/ingest`. */
export declare interface IngestRequest {
    events: IngestEvent[];
}

/** Response from `POST /v1/ingest`. */
export declare interface IngestResponse {
    /** Idempotency keys of events that were successfully ingested. */
    ingested: string[];
    /** Idempotency keys that were skipped because they already existed. */
    duplicates: string[];
}

/**
 * A billing invoice.
 * All monetary values (`subtotal`, `vat_amount`, `total`) are decimal strings
 * to avoid floating-point precision issues.
 */
export declare interface Invoice {
    id: string;
    org_id: string;
    customer_id: string;
    subscription_id: string;
    /** Use `InvoiceStatus` constants. */
    status: InvoiceStatusValue;
    currency: string;
    subtotal: string;
    vat_enabled: boolean;
    vat_rate?: string;
    vat_amount?: string;
    total: string;
    period_start: string;
    period_end: string;
    finalized_at: string | null;
    paid_at: string | null;
    provider_invoice_id?: string;
    line_items?: InvoiceLineItem[];
    created_at: string;
    updated_at: string;
}

/** One line item on an invoice. */
export declare interface InvoiceLineItem {
    id: string;
    invoice_id: string;
    metric_id: string;
    price_id?: string;
    description: string;
    quantity: string;
    unit_price: string;
    /** Amount for this line as a decimal string. */
    amount: string;
    created_at: string;
}

/** Manage invoice generation, finalization, and voiding. */
export declare class InvoicesResource {
    private readonly client;
    constructor(client: MonigoClient);
    /**
     * Generate a draft invoice for a subscription based on current period usage.
     * The invoice starts in `"draft"` status and is not sent to the customer yet.
     *
     * **Requires `write` scope.**
     *
     * @example
     * ```ts
     * const invoice = await monigo.invoices.generate('sub_xyz')
     * console.log('Draft invoice total:', invoice.total)
     * ```
     */
    generate(subscriptionId: string, options?: MutationOptions): Promise<Invoice>;
    /**
     * Return invoices, optionally filtered by status or customer.
     *
     * **Requires `read` scope.**
     *
     * @example
     * ```ts
     * const { invoices } = await monigo.invoices.list({
     *   status: 'finalized',
     *   customer_id: 'cust_abc',
     * })
     * ```
     */
    list(params?: ListInvoicesParams): Promise<ListInvoicesResponse>;
    /**
     * Fetch a single invoice by its UUID, including line items.
     *
     * **Requires `read` scope.**
     */
    get(invoiceId: string): Promise<Invoice>;
    /**
     * Finalize a draft invoice, making it ready for payment.
     * A finalized invoice cannot be edited.
     *
     * **Requires `write` scope.**
     */
    finalize(invoiceId: string, options?: MutationOptions): Promise<Invoice>;
    /**
     * Void an invoice, making it permanently non-payable.
     * Only admins and owners can void invoices.
     *
     * **Requires `write` scope.**
     */
    void(invoiceId: string, options?: MutationOptions): Promise<Invoice>;
}

export declare const InvoiceStatus: {
    readonly Draft: "draft";
    readonly Finalized: "finalized";
    readonly Paid: "paid";
    readonly Void: "void";
};

export declare type InvoiceStatusValue = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export declare interface ListCustomersResponse {
    customers: Customer[];
    count: number;
}

export declare interface ListInvoicesParams {
    /** Filter by status. Use `InvoiceStatus` constants. */
    status?: InvoiceStatusValue;
    /** Filter to a specific customer UUID. */
    customer_id?: string;
}

export declare interface ListInvoicesResponse {
    invoices: Invoice[];
    count: number;
}

export declare interface ListMetricsResponse {
    metrics: Metric[];
    count: number;
}

export declare interface ListPayoutAccountsResponse {
    payout_accounts: PayoutAccount[];
    count: number;
}

export declare interface ListPlansResponse {
    plans: Plan[];
    count: number;
}

export declare interface ListSubscriptionsParams {
    /** Filter to a specific customer UUID. */
    customer_id?: string;
    /** Filter to a specific plan UUID. */
    plan_id?: string;
    /** Filter by status. Use `SubscriptionStatus` constants. */
    status?: SubscriptionStatusValue;
}

export declare interface ListSubscriptionsResponse {
    subscriptions: Subscription[];
    count: number;
}

/** Defines what usage is counted and how. */
export declare interface Metric {
    id: string;
    org_id: string;
    name: string;
    /** The `event_name` value that this metric tracks. */
    event_name: string;
    /** How events are aggregated. Use `Aggregation` constants. */
    aggregation: AggregationType;
    /** For sum/max/min/average: the Properties key whose value is used. */
    aggregation_property?: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

/** Manage billing metrics — what usage gets counted and how it is aggregated. */
export declare class MetricsResource {
    private readonly client;
    constructor(client: MonigoClient);
    /**
     * Create a new metric.
     *
     * **Requires `write` scope.**
     *
     * @example
     * ```ts
     * const metric = await monigo.metrics.create({
     *   name: 'API Calls',
     *   event_name: 'api_call',
     *   aggregation: 'count',
     * })
     * ```
     */
    create(request: CreateMetricRequest, options?: MutationOptions): Promise<Metric>;
    /**
     * Return all metrics in the authenticated organisation.
     *
     * **Requires `read` scope.**
     */
    list(): Promise<ListMetricsResponse>;
    /**
     * Fetch a single metric by its UUID.
     *
     * **Requires `read` scope.**
     */
    get(metricId: string): Promise<Metric>;
    /**
     * Update a metric's name, event name, aggregation, or description.
     *
     * **Requires `write` scope.**
     */
    update(metricId: string, request: UpdateMetricRequest, options?: MutationOptions): Promise<Metric>;
    /**
     * Permanently delete a metric.
     *
     * **Requires `write` scope.**
     */
    delete(metricId: string): Promise<void>;
}

/**
 * Thrown for any non-2xx response from the Monigo API.
 *
 * @example
 * ```ts
 * try {
 *   await client.customers.get('bad-id')
 * } catch (err) {
 *   if (MonigoAPIError.isNotFound(err)) {
 *     console.log('Customer does not exist')
 *   }
 * }
 * ```
 */
export declare class MonigoAPIError extends Error {
    /** HTTP status code returned by the API. */
    readonly statusCode: number;
    /** Human-readable error message from the API. */
    readonly message: string;
    /** Optional structured field-level validation details. */
    readonly details: Record<string, string> | undefined;
    constructor(statusCode: number, message: string, details?: Record<string, string>);
    get isNotFound(): boolean;
    get isUnauthorized(): boolean;
    get isForbidden(): boolean;
    get isRateLimited(): boolean;
    get isConflict(): boolean;
    get isQuotaExceeded(): boolean;
    get isServerError(): boolean;
    static isNotFound(err: unknown): err is MonigoAPIError;
    static isUnauthorized(err: unknown): err is MonigoAPIError;
    static isForbidden(err: unknown): err is MonigoAPIError;
    static isRateLimited(err: unknown): err is MonigoAPIError;
    static isConflict(err: unknown): err is MonigoAPIError;
    static isQuotaExceeded(err: unknown): err is MonigoAPIError;
    static isServerError(err: unknown): err is MonigoAPIError;
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
export declare class MonigoClient {
    /* Excluded from this release type: _apiKey */
    /* Excluded from this release type: _baseURL */
    /* Excluded from this release type: _fetchFn */
    /* Excluded from this release type: _timeout */
    /** Ingest usage events and manage event replays. Requires `ingest` scope. */
    readonly events: EventsResource;
    /** Manage your end-customers (CRUD). Requires `read` / `write` scope. */
    readonly customers: CustomersResource;
    /** Manage billing metrics — what gets counted and how. Requires `read` / `write` scope. */
    readonly metrics: MetricsResource;
    /** Manage billing plans and their prices. Requires `read` / `write` scope. */
    readonly plans: PlansResource;
    /** Link customers to plans and manage subscription lifecycle. Requires `read` / `write` scope. */
    readonly subscriptions: SubscriptionsResource;
    /** Manage bank / mobile-money payout accounts for customers. Requires `read` / `write` scope. */
    readonly payoutAccounts: PayoutAccountsResource;
    /** Generate, list, finalize, and void invoices. Requires `read` / `write` scope. */
    readonly invoices: InvoicesResource;
    /** Query aggregated usage rollups per customer and metric. Requires `read` scope. */
    readonly usage: UsageResource;
    constructor(options: MonigoClientOptions);
    /* Excluded from this release type: _request */
    /** Normalise a `Date | string` value to an ISO 8601 string. */
    static toISOString(value: string | Date): string;
}

export declare interface MonigoClientOptions {
    /**
     * Your Monigo API key. Obtain one from the API Keys section of your
     * Monigo dashboard. Never expose this key in client-side code.
     */
    apiKey: string;
    /**
     * Override the default API base URL (`https://api.monigo.co`).
     * Useful for self-hosted deployments or pointing at a local dev server.
     *
     * @default "https://api.monigo.co"
     */
    baseURL?: string;
    /**
     * Custom `fetch` implementation. Defaults to `globalThis.fetch`.
     * Pass a polyfill for environments that do not have native fetch
     * (Node.js < 18) or to inject a mock in tests.
     */
    fetch?: typeof globalThis.fetch;
    /**
     * Request timeout in milliseconds.
     *
     * @default 30000
     */
    timeout?: number;
}

/**
 * Options accepted by every mutating method (POST, PUT, PATCH).
 */
export declare interface MutationOptions {
    /**
     * A unique key that prevents the same request from being processed more than
     * once. Pass a stable value (e.g. a request ID from your own system) to make
     * retries safe. When omitted, the SDK generates a UUID v4 automatically.
     */
    idempotencyKey?: string;
}

/** A bank or mobile-money account that a customer can be paid to. */
export declare interface PayoutAccount {
    id: string;
    customer_id: string;
    org_id: string;
    account_name: string;
    bank_name?: string;
    bank_code?: string;
    account_number?: string;
    mobile_money_number?: string;
    /** Use `PayoutMethod` constants. */
    payout_method: PayoutMethodValue;
    currency: string;
    is_default: boolean;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

/** Manage bank and mobile-money payout accounts for customers. */
export declare class PayoutAccountsResource {
    private readonly client;
    constructor(client: MonigoClient);
    /**
     * Add a payout account for a customer.
     *
     * **Requires `write` scope.**
     *
     * @example
     * ```ts
     * const account = await monigo.payoutAccounts.create('cust_abc', {
     *   account_name: 'Acme Corp',
     *   payout_method: 'bank_transfer',
     *   bank_name: 'Zenith Bank',
     *   bank_code: '057',
     *   account_number: '1234567890',
     *   currency: 'NGN',
     *   is_default: true,
     * })
     * ```
     */
    create(customerId: string, request: CreatePayoutAccountRequest, options?: MutationOptions): Promise<PayoutAccount>;
    /**
     * Return all payout accounts for a customer.
     *
     * **Requires `read` scope.**
     */
    list(customerId: string): Promise<ListPayoutAccountsResponse>;
    /**
     * Fetch a single payout account by its UUID.
     *
     * **Requires `read` scope.**
     */
    get(customerId: string, accountId: string): Promise<PayoutAccount>;
    /**
     * Update a payout account's details.
     *
     * **Requires `write` scope.**
     */
    update(customerId: string, accountId: string, request: UpdatePayoutAccountRequest, options?: MutationOptions): Promise<PayoutAccount>;
    /**
     * Delete a payout account.
     *
     * **Requires `write` scope.**
     */
    delete(customerId: string, accountId: string): Promise<void>;
}

export declare const PayoutMethod: {
    readonly BankTransfer: "bank_transfer";
    readonly MobileMoney: "mobile_money";
};

export declare type PayoutMethodValue = (typeof PayoutMethod)[keyof typeof PayoutMethod];

/** A billing plan that defines pricing for one or more metrics. */
export declare interface Plan {
    id: string;
    org_id: string;
    name: string;
    description?: string;
    /** ISO 4217 currency code, e.g. `"NGN"`. */
    currency: string;
    /** Use `PlanType` constants. */
    plan_type: PlanTypeValue;
    /** Use `BillingPeriod` constants. */
    billing_period: BillingPeriodValue;
    trial_period_days: number;
    prices?: Price[];
    created_at: string;
    updated_at: string;
}

/** Manage billing plans and their prices. */
export declare class PlansResource {
    private readonly client;
    constructor(client: MonigoClient);
    /**
     * Create a new billing plan, optionally with prices attached.
     *
     * **Requires `write` scope.**
     *
     * @example
     * ```ts
     * const plan = await monigo.plans.create({
     *   name: 'Pro',
     *   currency: 'NGN',
     *   billing_period: 'monthly',
     *   prices: [{
     *     metric_id: 'metric_abc',
     *     model: 'flat',
     *     unit_price: '2.500000',
     *   }],
     * })
     * ```
     */
    create(request: CreatePlanRequest, options?: MutationOptions): Promise<Plan>;
    /**
     * Return all billing plans in the authenticated organisation.
     *
     * **Requires `read` scope.**
     */
    list(): Promise<ListPlansResponse>;
    /**
     * Fetch a single plan by its UUID, including its prices.
     *
     * **Requires `read` scope.**
     */
    get(planId: string): Promise<Plan>;
    /**
     * Update a plan's name, description, currency, or prices.
     *
     * **Requires `write` scope.**
     */
    update(planId: string, request: UpdatePlanRequest, options?: MutationOptions): Promise<Plan>;
    /**
     * Permanently delete a plan.
     *
     * **Requires `write` scope.**
     */
    delete(planId: string): Promise<void>;
}

export declare const PlanType: {
    readonly Collection: "collection";
    readonly Payout: "payout";
};

export declare type PlanTypeValue = (typeof PlanType)[keyof typeof PlanType];

/** A pricing rule attached to a plan. */
export declare interface Price {
    id: string;
    plan_id: string;
    metric_id: string;
    model: PricingModelType;
    unit_price: string;
    tiers: PriceTier[] | null;
    created_at: string;
    updated_at: string;
}

/**
 * One price step in a tiered/volume/weighted_tiered pricing model.
 * Set `up_to` to `null` for the final (infinite) tier.
 */
export declare interface PriceTier {
    up_to: number | null;
    /** Price per unit in this tier as a decimal string, e.g. `"0.50"`. */
    unit_amount: string;
}

export declare const PricingModel: {
    readonly Flat: "flat";
    readonly Tiered: "tiered";
    readonly Volume: "volume";
    readonly Package: "package";
    readonly Overage: "overage";
    readonly WeightedTiered: "weighted_tiered";
};

export declare type PricingModelType = (typeof PricingModel)[keyof typeof PricingModel];

/* Excluded from this release type: RequestOptions */

/** Request body for `POST /v1/events/replay`. */
export declare interface StartReplayRequest {
    /** Start of the replay window (ISO 8601). */
    from: string | Date;
    /** End of the replay window (ISO 8601). */
    to: string | Date;
    /** Optional event name to replay. Omit to replay all event types. */
    event_name?: string;
}

/** Links a customer to a billing plan. */
export declare interface Subscription {
    id: string;
    org_id: string;
    customer_id: string;
    plan_id: string;
    /** Use `SubscriptionStatus` constants. */
    status: SubscriptionStatusValue;
    current_period_start: string;
    current_period_end: string;
    trial_ends_at: string | null;
    created_at: string;
    updated_at: string;
}

/** Link customers to billing plans and manage subscription lifecycle. */
export declare class SubscriptionsResource {
    private readonly client;
    constructor(client: MonigoClient);
    /**
     * Subscribe a customer to a plan.
     *
     * Returns a 409 Conflict error (check with `MonigoAPIError.isConflict(err)`)
     * if the customer already has an active subscription to the same plan.
     *
     * **Requires `write` scope.**
     *
     * @example
     * ```ts
     * const sub = await monigo.subscriptions.create({
     *   customer_id: 'cust_abc',
     *   plan_id: 'plan_xyz',
     * })
     * ```
     */
    create(request: CreateSubscriptionRequest, options?: MutationOptions): Promise<Subscription>;
    /**
     * Return subscriptions, optionally filtered by customer, plan, or status.
     *
     * **Requires `read` scope.**
     *
     * @example
     * ```ts
     * const { subscriptions } = await monigo.subscriptions.list({
     *   customer_id: 'cust_abc',
     *   status: 'active',
     * })
     * ```
     */
    list(params?: ListSubscriptionsParams): Promise<ListSubscriptionsResponse>;
    /**
     * Fetch a single subscription by its UUID.
     *
     * **Requires `read` scope.**
     */
    get(subscriptionId: string): Promise<Subscription>;
    /**
     * Change the status of a subscription.
     * Use `SubscriptionStatus` constants: `"active"`, `"paused"`, `"canceled"`.
     *
     * **Requires `write` scope.**
     *
     * @example
     * ```ts
     * await monigo.subscriptions.updateStatus(subId, SubscriptionStatus.Paused)
     * ```
     */
    updateStatus(subscriptionId: string, status: SubscriptionStatusValue, options?: MutationOptions): Promise<Subscription>;
    /**
     * Cancel and delete a subscription record.
     *
     * **Requires `write` scope.**
     */
    delete(subscriptionId: string): Promise<void>;
}

export declare const SubscriptionStatus: {
    readonly Active: "active";
    readonly Paused: "paused";
    readonly Canceled: "canceled";
};

export declare type SubscriptionStatusValue = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export declare interface UpdateCustomerRequest {
    name?: string;
    email?: string;
    metadata?: Record<string, unknown>;
}

export declare interface UpdateMetricRequest {
    name?: string;
    event_name?: string;
    aggregation?: AggregationType;
    description?: string;
    aggregation_property?: string;
}

export declare interface UpdatePayoutAccountRequest {
    account_name?: string;
    payout_method?: PayoutMethodValue;
    bank_name?: string;
    account_number?: string;
    currency?: string;
    is_default?: boolean;
    metadata?: Record<string, unknown>;
}

export declare interface UpdatePlanRequest {
    name?: string;
    description?: string;
    currency?: string;
    plan_type?: PlanTypeValue;
    billing_period?: BillingPeriodValue;
    prices?: UpdatePriceRequest[];
}

/** Describes an updated price. Include `id` to update an existing price; omit to add a new one. */
export declare interface UpdatePriceRequest {
    id?: string;
    metric_id?: string;
    model?: PricingModelType;
    unit_price?: string;
    tiers?: PriceTier[];
}

export declare interface UsageQueryParams {
    /** Filter rollups to a specific customer UUID. */
    customer_id?: string;
    /** Filter rollups to a specific metric UUID. */
    metric_id?: string;
    /**
     * Lower bound for `period_start` (ISO 8601).
     * Defaults to the start of the current billing period.
     */
    from?: string | Date;
    /**
     * Exclusive upper bound for `period_start` (ISO 8601).
     * Defaults to the end of the current billing period.
     */
    to?: string | Date;
}

export declare interface UsageQueryResult {
    rollups: UsageRollup[];
    count: number;
}

/** Query aggregated usage rollups from the Monigo metering pipeline. */
export declare class UsageResource {
    private readonly client;
    constructor(client: MonigoClient);
    /**
     * Return per-customer, per-metric usage rollups for the organisation.
     * All parameters are optional — omitting them returns the full current
     * billing period for all customers and metrics.
     *
     * **Requires `read` scope.**
     *
     * @example
     * ```ts
     * // All usage for one customer this period
     * const { rollups } = await monigo.usage.query({
     *   customer_id: 'cust_abc',
     * })
     *
     * // Filtered by metric and custom date range
     * const { rollups: filtered } = await monigo.usage.query({
     *   metric_id: 'metric_xyz',
     *   from: '2025-01-01T00:00:00Z',
     *   to: '2025-01-31T23:59:59Z',
     * })
     * ```
     */
    query(params?: UsageQueryParams): Promise<UsageQueryResult>;
}

/** One aggregated usage record for a (customer, metric, period) tuple. */
export declare interface UsageRollup {
    id: string;
    org_id: string;
    customer_id: string;
    metric_id: string;
    period_start: string;
    period_end: string;
    aggregation: AggregationType;
    /** Aggregated value (count, sum, max, etc.). */
    value: number;
    event_count: number;
    last_event_at: string | null;
    is_test: boolean;
    created_at: string;
    updated_at: string;
}

export { }
