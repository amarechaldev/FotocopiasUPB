import { describe, expect, test } from 'vitest'
import { checkPin } from './pin'

describe('checkPin', () => {
  test('4 digits, typed twice', () => {
    expect(checkPin('1234', '1234')).toBeNull()
  })

  test('leading zero is kept', () => {
    expect(checkPin('0123', '0123')).toBeNull()
  })

  test('too short or too long', () => {
    expect(checkPin('123', '123')).toBe('El PIN debe tener 4 números.')
    expect(checkPin('12345', '12345')).toBe('El PIN debe tener 4 números.')
  })

  test('not only digits', () => {
    expect(checkPin('12a4', '12a4')).toBe('El PIN debe tener 4 números.')
    expect(checkPin(' 1234', ' 1234')).toBe('El PIN debe tener 4 números.')
  })

  test('confirmation differs', () => {
    expect(checkPin('1234', '1243')).toBe('Los dos PIN no coinciden. Escríbalos de nuevo.')
  })

  test('the format is checked before the match', () => {
    expect(checkPin('12', '34')).toBe('El PIN debe tener 4 números.')
  })
})
