import { describe, expect, test } from 'vitest'
import { accountErrorMessage } from './accountErrors'

describe('accountErrorMessage', () => {
  test('duplicate name asks to add something to it', () => {
    expect(accountErrorMessage({ message: 'name_taken', code: 'P0001' })).toMatch(
      /^Ya existe una cuenta con ese nombre/,
    )
  })

  test('every code from create_account has a Spanish message', () => {
    for (const code of [
      'name_required',
      'pin_invalid',
      'areas_required',
      'area_invalid',
      'default_invalid',
      'name_taken',
    ]) {
      expect(accountErrorMessage({ message: code })).not.toBe(code)
    }
  })

  test('connection problems use the usual messages', () => {
    expect(accountErrorMessage({ message: 'TypeError: Failed to fetch' })).toBe(
      'Sin conexión a internet',
    )
  })

  test('unknown errors keep their detail', () => {
    expect(accountErrorMessage({ message: 'something else' })).toBe('something else')
  })
})
