import { describe, expect, test } from 'vitest'
import { errorDetail } from './errorDetail'

describe('errorDetail', () => {
  test('Supabase error object (not an Error instance)', () => {
    expect(errorDetail({ message: 'violates check constraint', code: '23514' })).toBe(
      'violates check constraint',
    )
  })

  test('no connection', () => {
    expect(errorDetail({ message: 'TypeError: Failed to fetch' })).toBe('Sin conexión a internet')
  })

  test('timeout', () => {
    expect(errorDetail(new DOMException('signal timed out', 'TimeoutError'))).toBe(
      'La conexión tardó demasiado',
    )
  })

  test('anything else', () => {
    expect(errorDetail('boom')).toBe('boom')
  })
})
