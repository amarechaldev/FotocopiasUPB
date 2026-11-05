import { describe, expect, test } from 'vitest'
import { accountErrorMessage, ownAccountErrorMessage } from './accountErrors'

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

describe('ownAccountErrorMessage', () => {
  test('every code from check_own_pin and update_own_account has a Spanish message', () => {
    for (const code of [
      'pin_wrong',
      'account_invalid',
      'pin_reset_pending',
      'pin_invalid',
      'name_required',
      'areas_required',
      'area_invalid',
      'default_invalid',
      'name_taken',
    ]) {
      expect(ownAccountErrorMessage({ message: code })).not.toBe(code)
    }
  })

  test('the login messages are the entry screen ones', () => {
    expect(ownAccountErrorMessage({ message: 'pin_wrong' })).toBe(
      'PIN incorrecto. Vuelva a intentarlo.',
    )
  })

  test('connection problems use the usual messages', () => {
    expect(ownAccountErrorMessage(new TypeError('Failed to fetch'))).toBe('Sin conexión a internet')
  })
})
