import { describe, expect, test } from 'vitest'
import { accountAdminErrorMessage } from './adminAccounts'

describe('accountAdminErrorMessage', () => {
  test('every code from the account functions (0018) has a Spanish message', () => {
    for (const code of [
      'not_admin',
      'account_invalid',
      'name_required',
      'name_taken',
      'areas_required',
      'area_invalid',
      'default_invalid',
      'account_has_entries',
    ]) {
      expect(accountAdminErrorMessage({ message: code, code: 'P0001' })).not.toBe(code)
    }
  })

  test('a missing account, not "choose a name" as in the entry editor', () => {
    expect(accountAdminErrorMessage({ message: 'account_invalid' })).toBe(
      'Esta cuenta ya no existe. Recargue la página.',
    )
  })

  test('connection problems keep their usual detail', () => {
    expect(accountAdminErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Sin conexión a internet',
    )
  })
})
