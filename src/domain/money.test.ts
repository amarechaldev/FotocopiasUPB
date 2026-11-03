import { describe, expect, test } from 'vitest'
import { formatAmount, formatQuantity } from './money'

// The thin space between thousands, written as _ in the expectations for readability.
const show = (text: string) => text.replaceAll(' ', '_')

describe('formatAmount', () => {
  test.each([
    [0, '0,00'],
    [5, '0,05'],
    [30, '0,30'],
    [100, '1,00'],
    [104_910, '1_049,10'],
    [1_251_970, '12_519,70'],
    [123_456_789, '1_234_567,89'],
  ])('%i centavos → %s', (centavos, expected) => {
    expect(show(formatAmount(centavos))).toBe(expected)
  })
})

describe('formatQuantity', () => {
  test.each([
    [0, '0'],
    [999, '999'],
    [1_000, '1_000'],
    [41_184, '41_184'],
    [1_234_567, '1_234_567'],
  ])('%i → %s', (n, expected) => {
    expect(show(formatQuantity(n))).toBe(expected)
  })
})
