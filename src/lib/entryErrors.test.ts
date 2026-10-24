import { describe, expect, test } from 'vitest'
import { entryErrorMessage, isRefusal } from './entryErrors'

describe('entryErrorMessage', () => {
  test('wrong PIN gets a clear message', () => {
    expect(entryErrorMessage({ message: 'pin_wrong', code: 'P0001' })).toBe(
      'PIN incorrecto. Vuelva a intentarlo.',
    )
  })

  test('every code from register_account_entry has a Spanish message', () => {
    for (const code of ['pin_wrong', 'account_invalid']) {
      expect(entryErrorMessage({ message: code })).not.toBe(code)
    }
  })

  test('other errors fall back to the connection detail', () => {
    expect(entryErrorMessage(new TypeError('Failed to fetch'))).toBe('Sin conexión a internet')
  })
})

describe('isRefusal', () => {
  test('a wrong PIN is a refusal, a lost connection is not', () => {
    expect(isRefusal({ message: 'pin_wrong' })).toBe(true)
    expect(isRefusal(new TypeError('Failed to fetch'))).toBe(false)
  })
})
