class MonigoAPIError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "MonigoAPIError";
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;
    const capture = Error["captureStackTrace"];
    capture?.(this, MonigoAPIError);
  }
  // -------------------------------------------------------------------------
  // Instance guards (for use on a caught error known to be MonigoAPIError)
  // -------------------------------------------------------------------------
  get isNotFound() {
    return this.statusCode === 404;
  }
  get isUnauthorized() {
    return this.statusCode === 401;
  }
  get isForbidden() {
    return this.statusCode === 403;
  }
  get isRateLimited() {
    return this.statusCode === 429;
  }
  get isConflict() {
    return this.statusCode === 409;
  }
  get isQuotaExceeded() {
    return this.statusCode === 402;
  }
  get isServerError() {
    return this.statusCode >= 500;
  }
  // -------------------------------------------------------------------------
  // Static type-narrowing helpers (for use in catch clauses on `unknown`)
  // -------------------------------------------------------------------------
  static isNotFound(err) {
    return err instanceof MonigoAPIError && err.statusCode === 404;
  }
  static isUnauthorized(err) {
    return err instanceof MonigoAPIError && err.statusCode === 401;
  }
  static isForbidden(err) {
    return err instanceof MonigoAPIError && err.statusCode === 403;
  }
  static isRateLimited(err) {
    return err instanceof MonigoAPIError && err.statusCode === 429;
  }
  static isConflict(err) {
    return err instanceof MonigoAPIError && err.statusCode === 409;
  }
  static isQuotaExceeded(err) {
    return err instanceof MonigoAPIError && err.statusCode === 402;
  }
  static isServerError(err) {
    return err instanceof MonigoAPIError && err.statusCode >= 500;
  }
}
class EventsResource {
  constructor(client) {
    this.client = client;
  }
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
  async ingest(request, options) {
    const body = {
      events: request.events.map((e) => ({
        ...e,
        timestamp: e.timestamp ? MonigoClient.toISOString(e.timestamp) : (/* @__PURE__ */ new Date()).toISOString()
      }))
    };
    return this.client._request("POST", "/v1/ingest", {
      body,
      idempotencyKey: options?.idempotencyKey
    });
  }
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
  async startReplay(request, options) {
    const body = {
      from: MonigoClient.toISOString(request.from),
      to: MonigoClient.toISOString(request.to),
      ...request.event_name ? { event_name: request.event_name } : {}
    };
    const wrapper = await this.client._request(
      "POST",
      "/v1/events/replay",
      { body, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.job;
  }
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
  async getReplay(jobId) {
    const wrapper = await this.client._request(
      "GET",
      `/v1/events/replay/${jobId}`
    );
    return wrapper.job;
  }
}
class CustomersResource {
  constructor(client) {
    this.client = client;
  }
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
  async create(request, options) {
    const wrapper = await this.client._request(
      "POST",
      "/v1/customers",
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.customer;
  }
  /**
   * Return all customers in the authenticated organisation.
   *
   * **Requires `read` scope.**
   */
  async list() {
    return this.client._request("GET", "/v1/customers");
  }
  /**
   * Fetch a single customer by their Monigo UUID.
   *
   * **Requires `read` scope.**
   */
  async get(customerId) {
    const wrapper = await this.client._request(
      "GET",
      `/v1/customers/${customerId}`
    );
    return wrapper.customer;
  }
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
  async update(customerId, request, options) {
    const wrapper = await this.client._request(
      "PUT",
      `/v1/customers/${customerId}`,
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.customer;
  }
  /**
   * Permanently delete a customer record.
   *
   * **Requires `write` scope.**
   */
  async delete(customerId) {
    await this.client._request("DELETE", `/v1/customers/${customerId}`);
  }
}
class MetricsResource {
  constructor(client) {
    this.client = client;
  }
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
  async create(request, options) {
    const wrapper = await this.client._request(
      "POST",
      "/v1/metrics",
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.metric;
  }
  /**
   * Return all metrics in the authenticated organisation.
   *
   * **Requires `read` scope.**
   */
  async list() {
    return this.client._request("GET", "/v1/metrics");
  }
  /**
   * Fetch a single metric by its UUID.
   *
   * **Requires `read` scope.**
   */
  async get(metricId) {
    const wrapper = await this.client._request(
      "GET",
      `/v1/metrics/${metricId}`
    );
    return wrapper.metric;
  }
  /**
   * Update a metric's name, event name, aggregation, or description.
   *
   * **Requires `write` scope.**
   */
  async update(metricId, request, options) {
    const wrapper = await this.client._request(
      "PUT",
      `/v1/metrics/${metricId}`,
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.metric;
  }
  /**
   * Permanently delete a metric.
   *
   * **Requires `write` scope.**
   */
  async delete(metricId) {
    await this.client._request("DELETE", `/v1/metrics/${metricId}`);
  }
}
class PlansResource {
  constructor(client) {
    this.client = client;
  }
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
  async create(request, options) {
    const wrapper = await this.client._request(
      "POST",
      "/v1/plans",
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.plan;
  }
  /**
   * Return all billing plans in the authenticated organisation.
   *
   * **Requires `read` scope.**
   */
  async list() {
    return this.client._request("GET", "/v1/plans");
  }
  /**
   * Fetch a single plan by its UUID, including its prices.
   *
   * **Requires `read` scope.**
   */
  async get(planId) {
    const wrapper = await this.client._request(
      "GET",
      `/v1/plans/${planId}`
    );
    return wrapper.plan;
  }
  /**
   * Update a plan's name, description, currency, or prices.
   *
   * **Requires `write` scope.**
   */
  async update(planId, request, options) {
    const wrapper = await this.client._request(
      "PUT",
      `/v1/plans/${planId}`,
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.plan;
  }
  /**
   * Permanently delete a plan.
   *
   * **Requires `write` scope.**
   */
  async delete(planId) {
    await this.client._request("DELETE", `/v1/plans/${planId}`);
  }
}
class SubscriptionsResource {
  constructor(client) {
    this.client = client;
  }
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
  async create(request, options) {
    const wrapper = await this.client._request(
      "POST",
      "/v1/subscriptions",
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.subscription;
  }
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
  async list(params = {}) {
    return this.client._request("GET", "/v1/subscriptions", {
      query: {
        customer_id: params.customer_id,
        plan_id: params.plan_id,
        status: params.status
      }
    });
  }
  /**
   * Fetch a single subscription by its UUID.
   *
   * **Requires `read` scope.**
   */
  async get(subscriptionId) {
    const wrapper = await this.client._request(
      "GET",
      `/v1/subscriptions/${subscriptionId}`
    );
    return wrapper.subscription;
  }
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
  async updateStatus(subscriptionId, status, options) {
    const wrapper = await this.client._request(
      "PATCH",
      `/v1/subscriptions/${subscriptionId}`,
      { body: { status }, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.subscription;
  }
  /**
   * Cancel and delete a subscription record.
   *
   * **Requires `write` scope.**
   */
  async delete(subscriptionId) {
    await this.client._request("DELETE", `/v1/subscriptions/${subscriptionId}`);
  }
}
class PayoutAccountsResource {
  constructor(client) {
    this.client = client;
  }
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
  async create(customerId, request, options) {
    const wrapper = await this.client._request(
      "POST",
      `/v1/customers/${customerId}/payout-accounts`,
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.payout_account;
  }
  /**
   * Return all payout accounts for a customer.
   *
   * **Requires `read` scope.**
   */
  async list(customerId) {
    return this.client._request(
      "GET",
      `/v1/customers/${customerId}/payout-accounts`
    );
  }
  /**
   * Fetch a single payout account by its UUID.
   *
   * **Requires `read` scope.**
   */
  async get(customerId, accountId) {
    const wrapper = await this.client._request(
      "GET",
      `/v1/customers/${customerId}/payout-accounts/${accountId}`
    );
    return wrapper.payout_account;
  }
  /**
   * Update a payout account's details.
   *
   * **Requires `write` scope.**
   */
  async update(customerId, accountId, request, options) {
    const wrapper = await this.client._request(
      "PUT",
      `/v1/customers/${customerId}/payout-accounts/${accountId}`,
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.payout_account;
  }
  /**
   * Delete a payout account.
   *
   * **Requires `write` scope.**
   */
  async delete(customerId, accountId) {
    await this.client._request(
      "DELETE",
      `/v1/customers/${customerId}/payout-accounts/${accountId}`
    );
  }
}
class InvoicesResource {
  constructor(client) {
    this.client = client;
  }
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
  async generate(subscriptionId, options) {
    const wrapper = await this.client._request(
      "POST",
      "/v1/invoices/generate",
      { body: { subscription_id: subscriptionId }, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.invoice;
  }
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
  async list(params = {}) {
    return this.client._request("GET", "/v1/invoices", {
      query: {
        status: params.status,
        customer_id: params.customer_id
      }
    });
  }
  /**
   * Fetch a single invoice by its UUID, including line items.
   *
   * **Requires `read` scope.**
   */
  async get(invoiceId) {
    const wrapper = await this.client._request(
      "GET",
      `/v1/invoices/${invoiceId}`
    );
    return wrapper.invoice;
  }
  /**
   * Finalize a draft invoice, making it ready for payment.
   * A finalized invoice cannot be edited.
   *
   * **Requires `write` scope.**
   */
  async finalize(invoiceId, options) {
    const wrapper = await this.client._request(
      "POST",
      `/v1/invoices/${invoiceId}/finalize`,
      { idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.invoice;
  }
  /**
   * Void an invoice, making it permanently non-payable.
   * Only admins and owners can void invoices.
   *
   * **Requires `write` scope.**
   */
  async void(invoiceId, options) {
    const wrapper = await this.client._request(
      "POST",
      `/v1/invoices/${invoiceId}/void`,
      { idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.invoice;
  }
}
class UsageResource {
  constructor(client) {
    this.client = client;
  }
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
  async query(params = {}) {
    const query = {
      customer_id: params.customer_id,
      metric_id: params.metric_id
    };
    if (params.from !== void 0) {
      query.from = MonigoClient.toISOString(params.from);
    }
    if (params.to !== void 0) {
      query.to = MonigoClient.toISOString(params.to);
    }
    return this.client._request("GET", "/v1/usage", { query });
  }
}
class PortalTokensResource {
  constructor(client) {
    this.client = client;
  }
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
  async create(request, options) {
    const wrapper = await this.client._request(
      "POST",
      "/v1/portal/tokens",
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.token;
  }
  /**
   * List all portal tokens for a customer.
   *
   * **Requires `read` scope.**
   *
   * @param customerId - The customer's Monigo UUID or their `external_id`.
   */
  async list(customerId) {
    return this.client._request(
      "GET",
      "/v1/portal/tokens",
      { query: { customer_id: customerId } }
    );
  }
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
  async revoke(tokenId, options) {
    await this.client._request(
      "DELETE",
      `/v1/portal/tokens/${tokenId}`,
      { idempotencyKey: options?.idempotencyKey }
    );
  }
}
class WalletsResource {
  constructor(client) {
    this.client = client;
  }
  /**
   * Get an existing wallet or create a new one for the given customer and currency.
   *
   * **Requires `write` scope.**
   */
  async getOrCreate(request, options) {
    const wrapper = await this.client._request(
      "POST",
      "/v1/wallets",
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.wallet;
  }
  /**
   * List all wallets for an organisation.
   *
   * **Requires `read` scope.**
   */
  async list(params) {
    return this.client._request("GET", "/v1/wallets", {
      query: { org_id: params.org_id }
    });
  }
  /**
   * List all wallets belonging to a specific customer.
   *
   * **Requires `read` scope.**
   */
  async listByCustomer(customerId) {
    return this.client._request(
      "GET",
      `/v1/customers/${customerId}/wallets`
    );
  }
  /**
   * Fetch a single wallet by UUID, including its virtual accounts.
   *
   * **Requires `read` scope.**
   */
  async get(walletId) {
    return this.client._request(
      "GET",
      `/v1/wallets/${walletId}`
    );
  }
  /**
   * Credit (add funds to) a wallet. Returns the updated wallet and ledger entries.
   *
   * **Requires `write` scope.**
   */
  async credit(walletId, request, options) {
    return this.client._request(
      "POST",
      `/v1/wallets/${walletId}/credit`,
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
  }
  /**
   * Debit (remove funds from) a wallet. Returns the updated wallet and ledger entries.
   * Throws a 402 error if the wallet has insufficient balance.
   *
   * **Requires `write` scope.**
   */
  async debit(walletId, request, options) {
    return this.client._request(
      "POST",
      `/v1/wallets/${walletId}/debit`,
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
  }
  /**
   * List paginated ledger entries (transactions) for a wallet.
   *
   * **Requires `read` scope.**
   */
  async listTransactions(walletId, params) {
    return this.client._request(
      "GET",
      `/v1/wallets/${walletId}/transactions`,
      {
        query: {
          limit: params?.limit?.toString(),
          offset: params?.offset?.toString()
        }
      }
    );
  }
  /**
   * Create a dedicated virtual bank account that automatically funds the wallet on deposit.
   *
   * **Requires `write` scope.**
   */
  async createVirtualAccount(walletId, request, options) {
    const wrapper = await this.client._request(
      "POST",
      `/v1/wallets/${walletId}/virtual-accounts`,
      { body: request, idempotencyKey: options?.idempotencyKey }
    );
    return wrapper.virtual_account;
  }
  /**
   * List all virtual accounts linked to a wallet.
   *
   * **Requires `read` scope.**
   */
  async listVirtualAccounts(walletId) {
    return this.client._request(
      "GET",
      `/v1/wallets/${walletId}/virtual-accounts`
    );
  }
}
const DEFAULT_BASE_URL = "https://api.monigo.co";
const DEFAULT_TIMEOUT_MS = 3e4;
class MonigoClient {
  constructor(options) {
    if (!options.apiKey) {
      throw new Error("MonigoClient: apiKey is required");
    }
    this._apiKey = options.apiKey;
    this._baseURL = (options.baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this._timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    const fetchFn = options.fetch ?? (typeof globalThis !== "undefined" ? globalThis.fetch : void 0);
    if (!fetchFn) {
      throw new Error(
        "MonigoClient: fetch is not available in this environment. Pass a custom fetch implementation via options.fetch, or upgrade to Node.js 18+."
      );
    }
    this._fetchFn = fetchFn.bind(globalThis);
    this.events = new EventsResource(this);
    this.customers = new CustomersResource(this);
    this.metrics = new MetricsResource(this);
    this.plans = new PlansResource(this);
    this.subscriptions = new SubscriptionsResource(this);
    this.payoutAccounts = new PayoutAccountsResource(this);
    this.invoices = new InvoicesResource(this);
    this.usage = new UsageResource(this);
    this.portalTokens = new PortalTokensResource(this);
    this.wallets = new WalletsResource(this);
  }
  /**
   * Execute an authenticated HTTP request against the Monigo API.
   * @internal — use the resource methods instead.
   */
  async _request(method, path, options = {}) {
    let url = this._baseURL + path;
    if (options.query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== void 0 && value !== "") {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      if (qs) url += "?" + qs;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this._timeout);
    const isMutating = method === "POST" || method === "PUT" || method === "PATCH";
    const idempotencyKey = isMutating ? options.idempotencyKey ?? globalThis.crypto.randomUUID() : void 0;
    try {
      const response = await this._fetchFn(url, {
        method,
        headers: {
          Authorization: `Bearer ${this._apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}
        },
        body: options.body != null ? JSON.stringify(options.body) : void 0,
        signal: controller.signal
      });
      const text = await response.text();
      if (!response.ok) {
        let message = text || response.statusText;
        let details;
        try {
          const parsed = JSON.parse(text);
          message = parsed.error ?? parsed.message ?? message;
          details = parsed.details;
        } catch {
        }
        throw new MonigoAPIError(response.status, message, details);
      }
      if (!text) return void 0;
      return JSON.parse(text);
    } catch (err) {
      if (err instanceof MonigoAPIError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          `MonigoClient: request to ${url} timed out after ${this._timeout}ms`
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /** Normalise a `Date | string` value to an ISO 8601 string. */
  static toISOString(value) {
    return value instanceof Date ? value.toISOString() : value;
  }
}
const Aggregation = {
  Count: "count",
  Sum: "sum",
  Max: "max",
  Min: "minimum",
  Average: "average",
  Unique: "unique"
};
const PricingModel = {
  /** Fixed price per unit. Requires `unit_price`. */
  Flat: "flat_unit",
  /** Alias for `Flat`. */
  PerUnit: "per_unit",
  /** Graduated tiers — each unit charged at the rate of the tier it falls into.
   *  Requires a `PriceTier[]` in the `tiers` field. */
  Tiered: "tiered",
  /** Charge per bundle of N units. Partial bundles round up.
   *  Requires a `PackageConfig` object in the `tiers` field. */
  Package: "package",
  /** Flat base fee covers an included quota; per-unit rate beyond it.
   *  Requires an `OverageConfig` object in the `tiers` field. */
  Overage: "overage"
};
const PlanType = {
  Collection: "collection",
  Payout: "payout"
};
const BillingPeriod = {
  Daily: "daily",
  Weekly: "weekly",
  Monthly: "monthly",
  Quarterly: "quarterly",
  Annually: "annually"
};
const SubscriptionStatus = {
  Active: "active",
  Paused: "paused",
  Canceled: "canceled"
};
const InvoiceStatus = {
  Draft: "draft",
  Finalized: "finalized",
  Paid: "paid",
  Void: "void"
};
const PayoutMethod = {
  BankTransfer: "bank_transfer",
  MobileMoney: "mobile_money"
};
const WalletEntryType = {
  /** Credit from an external funding source. */
  Deposit: "deposit",
  /** Debit to an external destination. */
  Withdrawal: "withdrawal",
  /** Automatic debit for metered usage charges. */
  Usage: "usage",
  /** Credit reversing a previous charge. */
  Refund: "refund",
  /** Manual balance correction. */
  Adjustment: "adjustment"
};
const WalletDirection = {
  /** Reduces the wallet balance. */
  Debit: "debit",
  /** Increases the wallet balance. */
  Credit: "credit"
};
const VirtualAccountProvider = {
  Paystack: "paystack",
  Flutterwave: "flutterwave",
  Monnify: "monnify"
};
export {
  Aggregation,
  BillingPeriod,
  CustomersResource,
  EventsResource,
  InvoiceStatus,
  InvoicesResource,
  MetricsResource,
  MonigoAPIError,
  MonigoClient,
  PayoutAccountsResource,
  PayoutMethod,
  PlanType,
  PlansResource,
  PortalTokensResource,
  PricingModel,
  SubscriptionStatus,
  SubscriptionsResource,
  UsageResource,
  VirtualAccountProvider,
  WalletDirection,
  WalletEntryType,
  WalletsResource
};
//# sourceMappingURL=monigo.js.map
