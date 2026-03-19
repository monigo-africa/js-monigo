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
    email?: string;
    /** Phone number in E.164 international format (e.g. +2348012345678). Optional. */
    phone?: string;
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

/** Request body for `portalTokens.create()`. */
export declare interface CreatePortalTokenRequest {
    /**
     * The `external_id` you assigned this customer when you called
     * `customers.create()`.
     */
    customer_external_id: string;
    /** Optional human-readable label, e.g. `"Main portal link"`. */
    label?: string;
    /**
     * Optional RFC 3339 expiry timestamp. Omit to create a permanent link.
     * Example: `"2027-01-01T00:00:00Z"`
     */
    expires_at?: string;
}

/** Describes a price to attach when creating a plan. */
export declare interface CreatePriceRequest {
    /** UUID of the metric this price is based on. */
    metric_id: string;
    /** Pricing model. Use `PricingModel` constants. */
    model: PricingModelType;
    /** Flat price per unit as a decimal string.
     *  Required for `PricingModel.Flat` / `PricingModel.PerUnit`. */
    unit_price?: string;
    /**
     * Model-specific configuration:
     * - `PricingModel.Tiered`  → `PriceTier[]`
     * - `PricingModel.Package` → `PackageConfig`
     * - `PricingModel.Overage` → `OverageConfig`
     */
    tiers?: PriceTier[] | PackageConfig | OverageConfig;
}

export declare interface CreateSubscriptionRequest {
    /** UUID of the customer to subscribe. */
    customer_id: string;
    /** UUID of the plan to subscribe the customer to. */
    plan_id: string;
}

/** Request body for `wallets.createVirtualAccount()`. */
export declare interface CreateVirtualAccountRequest {
    /** Use `VirtualAccountProvider` constants. */
    provider: VirtualAccountProviderValue;
    currency: string;
}

/** Request body for `wallets.credit()`. */
export declare interface CreditWalletRequest {
    /** Amount as a decimal string, e.g. `"100.50"`. */
    amount: string;
    currency: string;
    description: string;
    /** Use `WalletEntryType` constants. */
    entry_type: WalletEntryTypeValue;
    reference_type: string;
    reference_id: string;
    idempotency_key: string;
    /** Optional provider account UUID for the other side of double entry. */
    provider_id?: string;
}

/** An end-customer record in your Monigo organisation. */
export declare interface Customer {
    id: string;
    org_id: string;
    /** The ID for this customer in your own system. */
    external_id: string;
    name: string;
    email: string;
    /** Phone number in E.164 international format (e.g. +2348012345678). */
    phone: string;
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

/** A prepaid balance belonging to a single customer. All monetary values are decimal strings. */
export declare interface CustomerWallet {
    id: string;
    customer_id: string;
    org_id: string;
    currency: string;
    /** Current available balance as a decimal string, e.g. `"500.000000"`. */
    balance: string;
    /** Balance reserved for pending operations. */
    reserved_balance: string;
    created_at: string;
    updated_at: string;
}

/** Request body for `wallets.debit()`. */
export declare interface DebitWalletRequest {
    /** Amount as a decimal string, e.g. `"50.25"`. */
    amount: string;
    currency: string;
    description: string;
    /** Use `WalletEntryType` constants. */
    entry_type: WalletEntryTypeValue;
    reference_type: string;
    reference_id: string;
    idempotency_key: string;
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

/** Request body for `wallets.getOrCreate()`. */
export declare interface GetOrCreateWalletRequest {
    customer_id: string;
    currency: string;
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

/** One side of a double-entry accounting record. */
export declare interface LedgerEntry {
    id: string;
    org_id: string;
    transaction_id: string;
    wallet_id: string | null;
    /** `customer_wallet`, `provider`, or `revenue`. */
    account_type: string;
    account_id: string;
    /** Use `WalletDirection` constants. */
    direction: WalletDirectionValue;
    /** Amount as a decimal string. */
    amount: string;
    currency: string;
    balance_before: string;
    balance_after: string;
    description: string;
    /** Use `WalletEntryType` constants. */
    entry_type: WalletEntryTypeValue;
    reference_type: string;
    reference_id: string;
    idempotency_key: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

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

export declare interface ListPortalTokensResponse {
    tokens: PortalToken[];
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

export declare interface ListTransactionsParams {
    /** Number of entries to return (1–100). Defaults to 25. */
    limit?: number;
    /** Number of entries to skip. Defaults to 0. */
    offset?: number;
}

export declare interface ListTransactionsResponse {
    transactions: LedgerEntry[];
    total: number;
    limit: number;
    offset: number;
}

export declare interface ListVirtualAccountsResponse {
    virtual_accounts: VirtualAccount[];
    count: number;
}

/** Optional query parameters for `wallets.list()`. */
export declare interface ListWalletsParams {
    /** Filter wallets to a specific customer UUID or external_id. */
    customer_id?: string;
}

export declare interface ListWalletsResponse {
    wallets: CustomerWallet[];
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
    /** Manage customer portal access links. Requires `read` / `write` scope. */
    readonly portalTokens: PortalTokensResource;
    /** Manage customer wallets, balance operations, and virtual accounts. Requires `read` / `write` scope. */
    readonly wallets: WalletsResource;
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

/**
 * Configuration for the `overage` pricing model.
 * Pass this as the `tiers` field when `model` is `PricingModel.Overage`.
 */
export declare interface OverageConfig {
    /** Free quota. Usage at or below this threshold is charged `base_price`. */
    included_units: number;
    /** Flat fee for usage up to `included_units` as a decimal string.
     *  Set to `"0.000000"` when there is no base fee. */
    base_price: string;
    /** Per-unit rate applied to every unit above `included_units`,
     *  as a decimal string, e.g. `"1.500000"`. */
    overage_price: string;
}

/**
 * Configuration for the `package` pricing model.
 * Pass this as the `tiers` field when `model` is `PricingModel.Package`.
 */
export declare interface PackageConfig {
    /** Number of units per bundle, e.g. `1000` for "1 000 SMS per bundle". */
    package_size: number;
    /** Price per complete bundle as a decimal string, e.g. `"500.000000"`. */
    package_price: string;
    /** If `true`, partial bundles are rounded up to the next whole bundle. */
    round_up_partial_block: boolean;
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
     *     model: 'flat_unit',
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

/**
 * A portal token grants an end-customer read-only access to their invoices,
 * payout slips, subscriptions, and payout accounts in the Monigo hosted portal.
 */
export declare interface PortalToken {
    id: string;
    org_id: string;
    customer_id: string;
    /** The opaque 64-character hex token embedded in the portal URL. */
    token: string;
    label: string;
    /** ISO 8601 expiry timestamp, or `null` for a permanent link. */
    expires_at: string | null;
    /** ISO 8601 revocation timestamp, or `null` if still active. */
    revoked_at: string | null;
    created_at: string;
    updated_at: string;
    /** Fully-qualified URL to share with the customer, e.g. `https://app.monigo.co/portal/<token>`. */
    portal_url: string;
}

/**
 * Manage customer portal access links.
 *
 * Portal tokens grant an end-customer read-only access to their invoices,
 * payout slips, subscriptions, and payout accounts in the Monigo hosted portal.
 * All operations require a write-scoped API key; the organisation is inferred
 * automatically from the key.
 */
export declare class PortalTokensResource {
    private readonly client;
    constructor(client: MonigoClient);
    /**
     * Generate a new portal link for a customer.
     *
     * **Requires `write` scope.**
     *
     * The returned `portal_url` is what you share with your customer — embed it
     * in an email, open it in an iframe, or redirect the browser to it directly.
     *
     * @example
     * ```ts
     * const { portal_url } = await monigo.portalTokens.create({
     *   customer_external_id: 'usr_abc123',
     *   label: 'March 2026 invoice link',
     * })
     * await sendEmail(customer.email, { portalLink: portal_url })
     * ```
     */
    create(request: CreatePortalTokenRequest, options?: MutationOptions): Promise<PortalToken>;
    /**
     * List all portal tokens for a customer.
     *
     * **Requires `read` scope.**
     *
     * @param customerId - The customer's Monigo UUID or their `external_id`.
     */
    list(customerId: string): Promise<ListPortalTokensResponse>;
    /**
     * Immediately revoke a portal token.
     *
     * **Requires `write` scope.**
     *
     * Any customer holding the corresponding URL will receive a 401 on their
     * next request. This action is irreversible.
     *
     * @param tokenId - The UUID of the portal token record (not the raw token string).
     */
    revoke(tokenId: string, options?: MutationOptions): Promise<void>;
}

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
 * One step in a `tiered` pricing model.
 * Set `up_to` to `null` for the final (infinite) tier.
 */
export declare interface PriceTier {
    up_to: number | null;
    /** Price per unit in this tier as a decimal string, e.g. `"0.50"`. */
    unit_amount: string;
}

export declare const PricingModel: {
    /** Fixed price per unit. Requires `unit_price`. */
    readonly Flat: "flat_unit";
    /** Alias for `Flat`. */
    readonly PerUnit: "per_unit";
    /** Graduated tiers — each unit charged at the rate of the tier it falls into.
     *  Requires a `PriceTier[]` in the `tiers` field. */
    readonly Tiered: "tiered";
    /** Charge per bundle of N units. Partial bundles round up.
     *  Requires a `PackageConfig` object in the `tiers` field. */
    readonly Package: "package";
    /** Flat base fee covers an included quota; per-unit rate beyond it.
     *  Requires an `OverageConfig` object in the `tiers` field. */
    readonly Overage: "overage";
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
    /** Phone number in E.164 international format (e.g. +2348012345678). Optional. */
    phone?: string;
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
    tiers?: PriceTier[] | PackageConfig | OverageConfig;
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

/** A dedicated virtual bank account that funds a customer wallet. */
export declare interface VirtualAccount {
    id: string;
    customer_id: string;
    wallet_id: string;
    org_id: string;
    /** Payment provider. Use `VirtualAccountProvider` constants. */
    provider: VirtualAccountProviderValue;
    account_number: string;
    account_name: string;
    bank_name: string;
    bank_code: string;
    currency: string;
    provider_ref: string;
    is_active: boolean;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export declare const VirtualAccountProvider: {
    readonly Paystack: "paystack";
    readonly Flutterwave: "flutterwave";
    readonly Monnify: "monnify";
};

export declare type VirtualAccountProviderValue = (typeof VirtualAccountProvider)[keyof typeof VirtualAccountProvider];

export declare const WalletDirection: {
    /** Reduces the wallet balance. */
    readonly Debit: "debit";
    /** Increases the wallet balance. */
    readonly Credit: "credit";
};

export declare type WalletDirectionValue = (typeof WalletDirection)[keyof typeof WalletDirection];

export declare const WalletEntryType: {
    /** Credit from an external funding source. */
    readonly Deposit: "deposit";
    /** Debit to an external destination. */
    readonly Withdrawal: "withdrawal";
    /** Automatic debit for metered usage charges. */
    readonly Usage: "usage";
    /** Credit reversing a previous charge. */
    readonly Refund: "refund";
    /** Manual balance correction. */
    readonly Adjustment: "adjustment";
};

export declare type WalletEntryTypeValue = (typeof WalletEntryType)[keyof typeof WalletEntryType];

export declare interface WalletOperationResponse {
    wallet: CustomerWallet;
    ledger_entries: LedgerEntry[];
}

/** Manage customer wallets, balance operations, and virtual accounts. */
export declare class WalletsResource {
    private readonly client;
    constructor(client: MonigoClient);
    /**
     * Get an existing wallet or create a new one for the given customer and currency.
     *
     * **Requires `write` scope.**
     */
    getOrCreate(request: GetOrCreateWalletRequest, options?: MutationOptions): Promise<CustomerWallet>;
    /**
     * List all wallets for the organisation. Optionally filter by customer.
     *
     * **Requires `read` scope.**
     */
    list(params?: ListWalletsParams): Promise<ListWalletsResponse>;
    /**
     * List all wallets belonging to a specific customer.
     *
     * **Requires `read` scope.**
     */
    listByCustomer(customerId: string): Promise<ListWalletsResponse>;
    /**
     * Fetch a single wallet by UUID, including its virtual accounts.
     *
     * **Requires `read` scope.**
     */
    get(walletId: string): Promise<WalletWithVirtualAccountsResponse>;
    /**
     * Credit (add funds to) a wallet. Returns the updated wallet and ledger entries.
     *
     * **Requires `write` scope.**
     */
    credit(walletId: string, request: CreditWalletRequest, options?: MutationOptions): Promise<WalletOperationResponse>;
    /**
     * Debit (remove funds from) a wallet. Returns the updated wallet and ledger entries.
     * Throws a 402 error if the wallet has insufficient balance.
     *
     * **Requires `write` scope.**
     */
    debit(walletId: string, request: DebitWalletRequest, options?: MutationOptions): Promise<WalletOperationResponse>;
    /**
     * List paginated ledger entries (transactions) for a wallet.
     *
     * **Requires `read` scope.**
     */
    listTransactions(walletId: string, params?: ListTransactionsParams): Promise<ListTransactionsResponse>;
    /**
     * Create a dedicated virtual bank account that automatically funds the wallet on deposit.
     *
     * **Requires `write` scope.**
     */
    createVirtualAccount(walletId: string, request: CreateVirtualAccountRequest, options?: MutationOptions): Promise<VirtualAccount>;
    /**
     * List all virtual accounts linked to a wallet.
     *
     * **Requires `read` scope.**
     */
    listVirtualAccounts(walletId: string): Promise<ListVirtualAccountsResponse>;
}

export declare interface WalletWithVirtualAccountsResponse {
    wallet: CustomerWallet;
    virtual_accounts: VirtualAccount[];
}

export { }
