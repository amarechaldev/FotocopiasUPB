import { describe, expect, test } from 'vitest'
import { adminErrorMessage } from './adminErrors'

describe('adminErrorMessage', () => {
  test('wrong email or password', () => {
    expect(
      adminErrorMessage({ message: 'Invalid login credentials', code: 'invalid_credentials' }),
    ).toBe('Correo o contraseña incorrectos.')
  })

  test('logged in, but not listed as admin', () => {
    expect(adminErrorMessage(new Error('not_admin'))).toBe(
      'Esta cuenta no tiene acceso de administración.',
    )
  })

  test('connection problems use the usual messages', () => {
    expect(adminErrorMessage({ message: 'TypeError: Failed to fetch' })).toBe(
      'Sin conexión a internet',
    )
  })

  test('unknown errors keep their detail', () => {
    expect(adminErrorMessage({ message: 'something else', code: 'other' })).toBe('something else')
  })
})
