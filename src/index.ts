// Main client
export { MonigoClient } from './client.js'
export type { MonigoClientOptions, MutationOptions } from './client.js'

// Error class
export { MonigoAPIError } from './errors.js'

// Resource classes (for type-checking and extension)
export { EventsResource } from './resources/events.js'
export { CustomersResource } from './resources/customers.js'
export { MetricsResource } from './resources/metrics.js'
export { PlansResource } from './resources/plans.js'
export { SubscriptionsResource } from './resources/subscriptions.js'
export { PayoutAccountsResource } from './resources/payout-accounts.js'
export { InvoicesResource } from './resources/invoices.js'
export { UsageResource } from './resources/usage.js'

// Constants
export {
  Aggregation,
  PricingModel,
  PlanType,
  BillingPeriod,
  SubscriptionStatus,
  InvoiceStatus,
  PayoutMethod,
} from './types.js'

// Types
export type {
  AggregationType,
  PricingModelType,
  PlanTypeValue,
  BillingPeriodValue,
  SubscriptionStatusValue,
  InvoiceStatusValue,
  PayoutMethodValue,
  IngestEvent,
  IngestRequest,
  IngestResponse,
  StartReplayRequest,
  EventReplayJob,
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ListCustomersResponse,
  Metric,
  CreateMetricRequest,
  UpdateMetricRequest,
  ListMetricsResponse,
  PriceTier,
  CreatePriceRequest,
  UpdatePriceRequest,
  Price,
  Plan,
  CreatePlanRequest,
  UpdatePlanRequest,
  ListPlansResponse,
  Subscription,
  CreateSubscriptionRequest,
  ListSubscriptionsParams,
  ListSubscriptionsResponse,
  PayoutAccount,
  CreatePayoutAccountRequest,
  UpdatePayoutAccountRequest,
  ListPayoutAccountsResponse,
  InvoiceLineItem,
  Invoice,
  ListInvoicesParams,
  ListInvoicesResponse,
  UsageQueryParams,
  UsageRollup,
  UsageQueryResult,
} from './types.js'
