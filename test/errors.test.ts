import { describe, it, expect } from 'vitest'
import { MonigoAPIError } from '../src/errors.js'

describe('MonigoAPIError', () => {
  it('is an instance of Error', () => {
    const err = new MonigoAPIError(404, 'not found')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(MonigoAPIError)
    expect(err.name).toBe('MonigoAPIError')
  })

  it('sets statusCode and message', () => {
    const err = new MonigoAPIError(422, 'validation error', { field: 'email' })
    expect(err.statusCode).toBe(422)
    expect(err.message).toBe('validation error')
    expect(err.details).toEqual({ field: 'email' })
  })

  describe('instance flags', () => {
    it('isNotFound for 404', () => {
      expect(new MonigoAPIError(404, '').isNotFound).toBe(true)
    })
    it('isUnauthorized for 401', () => {
      expect(new MonigoAPIError(401, '').isUnauthorized).toBe(true)
    })
    it('isForbidden for 403', () => {
      expect(new MonigoAPIError(403, '').isForbidden).toBe(true)
    })
    it('isRateLimited for 429', () => {
      expect(new MonigoAPIError(429, '').isRateLimited).toBe(true)
    })
    it('isConflict for 409', () => {
      expect(new MonigoAPIError(409, '').isConflict).toBe(true)
    })
    it('isQuotaExceeded for 402', () => {
      expect(new MonigoAPIError(402, '').isQuotaExceeded).toBe(true)
    })
    it('isServerError for 500', () => {
      expect(new MonigoAPIError(500, '').isServerError).toBe(true)
    })
    it('isServerError for 503', () => {
      expect(new MonigoAPIError(503, '').isServerError).toBe(true)
    })
    it('does not set wrong flags', () => {
      const err = new MonigoAPIError(400, '')
      expect(err.isNotFound).toBe(false)
      expect(err.isUnauthorized).toBe(false)
    })
  })

  describe('static type-narrowing guards', () => {
    it('MonigoAPIError.isNotFound narrows to MonigoAPIError', () => {
      const err = new MonigoAPIError(404, 'not found')
      expect(MonigoAPIError.isNotFound(err)).toBe(true)
    })
    it('MonigoAPIError.isNotFound returns false for plain Error', () => {
      expect(MonigoAPIError.isNotFound(new Error('oops'))).toBe(false)
    })
    it('MonigoAPIError.isNotFound returns false for non-Error values', () => {
      expect(MonigoAPIError.isNotFound(null)).toBe(false)
      expect(MonigoAPIError.isNotFound('string')).toBe(false)
    })
    it('MonigoAPIError.isUnauthorized', () => {
      expect(MonigoAPIError.isUnauthorized(new MonigoAPIError(401, ''))).toBe(true)
      expect(MonigoAPIError.isUnauthorized(new MonigoAPIError(404, ''))).toBe(false)
    })
    it('MonigoAPIError.isForbidden', () => {
      expect(MonigoAPIError.isForbidden(new MonigoAPIError(403, ''))).toBe(true)
    })
    it('MonigoAPIError.isRateLimited', () => {
      expect(MonigoAPIError.isRateLimited(new MonigoAPIError(429, ''))).toBe(true)
    })
    it('MonigoAPIError.isConflict', () => {
      expect(MonigoAPIError.isConflict(new MonigoAPIError(409, ''))).toBe(true)
    })
    it('MonigoAPIError.isQuotaExceeded', () => {
      expect(MonigoAPIError.isQuotaExceeded(new MonigoAPIError(402, ''))).toBe(true)
    })
    it('MonigoAPIError.isServerError', () => {
      expect(MonigoAPIError.isServerError(new MonigoAPIError(500, ''))).toBe(true)
      expect(MonigoAPIError.isServerError(new MonigoAPIError(404, ''))).toBe(false)
    })
  })
})
