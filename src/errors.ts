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
export class MonigoAPIError extends Error {
  /** HTTP status code returned by the API. */
  readonly statusCode: number
  /** Human-readable error message from the API. */
  readonly message: string
  /** Optional structured field-level validation details. */
  readonly details: Record<string, string> | undefined

  constructor(
    statusCode: number,
    message: string,
    details?: Record<string, string>,
  ) {
    super(message)
    this.name = 'MonigoAPIError'
    this.statusCode = statusCode
    this.message = message
    this.details = details
    // Maintain proper stack trace in V8 (Node.js / Chrome)
    const capture = (Error as unknown as Record<string, unknown>)[
      'captureStackTrace'
    ] as ((target: Error, constructor: Function) => void) | undefined
    capture?.(this, MonigoAPIError)
  }

  // -------------------------------------------------------------------------
  // Instance guards (for use on a caught error known to be MonigoAPIError)
  // -------------------------------------------------------------------------

  get isNotFound(): boolean {
    return this.statusCode === 404
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401
  }

  get isForbidden(): boolean {
    return this.statusCode === 403
  }

  get isRateLimited(): boolean {
    return this.statusCode === 429
  }

  get isConflict(): boolean {
    return this.statusCode === 409
  }

  get isQuotaExceeded(): boolean {
    return this.statusCode === 402
  }

  get isServerError(): boolean {
    return this.statusCode >= 500
  }

  // -------------------------------------------------------------------------
  // Static type-narrowing helpers (for use in catch clauses on `unknown`)
  // -------------------------------------------------------------------------

  static isNotFound(err: unknown): err is MonigoAPIError {
    return err instanceof MonigoAPIError && err.statusCode === 404
  }

  static isUnauthorized(err: unknown): err is MonigoAPIError {
    return err instanceof MonigoAPIError && err.statusCode === 401
  }

  static isForbidden(err: unknown): err is MonigoAPIError {
    return err instanceof MonigoAPIError && err.statusCode === 403
  }

  static isRateLimited(err: unknown): err is MonigoAPIError {
    return err instanceof MonigoAPIError && err.statusCode === 429
  }

  static isConflict(err: unknown): err is MonigoAPIError {
    return err instanceof MonigoAPIError && err.statusCode === 409
  }

  static isQuotaExceeded(err: unknown): err is MonigoAPIError {
    return err instanceof MonigoAPIError && err.statusCode === 402
  }

  static isServerError(err: unknown): err is MonigoAPIError {
    return err instanceof MonigoAPIError && err.statusCode >= 500
  }
}
