import { describe, expect, test } from 'vitest'
import { parseBs, pricesForPeriod, type AnilladoPriceRow, type CopyPriceRow } from './prices'

const copyRows: CopyPriceRow[] = [
  { fromMonth: '2026-11-01', priceCentavos: 30 },
  { fromMonth: '2027-02-01', priceCentavos: 40 },
]
const anilladoRows: AnilladoPriceRow[] = [
  { sizeMm: 12, fromMonth: '2026-11-01', priceCentavos: 500 },
  { sizeMm: 12, fromMonth: '2027-02-01', priceCentavos: 550 },
  { sizeMm: 20, fromMonth: '2026-11-01', priceCentavos: 650 },
  { sizeMm: 55, fromMonth: '2027-02-01', priceCentavos: 2500 }, // a size added in February
]

describe('pricesForPeriod', () => {
  test('the prices in effect for the first period', () => {
    const prices = pricesForPeriod(copyRows, anilladoRows, '2026-11-01')
    expect(prices.copiaCentavos).toBe(30)
    expect([...prices.anilladoCentavos]).toEqual([
      [12, 500],
      [20, 650],
    ])
  })

  test('a period before a change keeps the old prices', () => {
    const prices = pricesForPeriod(copyRows, anilladoRows, '2027-01-01')
    expect(prices.copiaCentavos).toBe(30)
    expect(prices.anilladoCentavos.get(12)).toBe(500)
  })

  test('from the period a change starts, and after it, the new prices', () => {
    for (const month of ['2027-02-01', '2027-06-01']) {
      const prices = pricesForPeriod(copyRows, anilladoRows, month)
      expect(prices.copiaCentavos).toBe(40)
      expect(prices.anilladoCentavos.get(12)).toBe(550)
      expect(prices.anilladoCentavos.get(20)).toBe(650) // unchanged size: its only price
    }
  })

  test('a size with no price yet in a period is left out', () => {
    expect(pricesForPeriod(copyRows, anilladoRows, '2027-01-01').anilladoCentavos.has(55)).toBe(false)
    expect(pricesForPeriod(copyRows, anilladoRows, '2027-02-01').anilladoCentavos.get(55)).toBe(2500)
  })

  test('the order of the rows does not matter', () => {
    const prices = pricesForPeriod([...copyRows].reverse(), [...anilladoRows].reverse(), '2027-03-01')
    expect(prices.copiaCentavos).toBe(40)
    expect(prices.anilladoCentavos.get(12)).toBe(550)
  })

  test('no copy price for the period is an error', () => {
    expect(() => pricesForPeriod(copyRows, anilladoRows, '2026-10-01')).toThrow(/precio de la copia/)
    expect(() => pricesForPeriod([], anilladoRows, '2026-11-01')).toThrow(/precio de la copia/)
  })
})

describe('parseBs', () => {
  test('a dot or a comma for decimals, one or two decimals, or none', () => {
    expect(parseBs('1.50')).toBe(150)
    expect(parseBs('1,50')).toBe(150)
    expect(parseBs('1,5')).toBe(150)
    expect(parseBs('0,29')).toBe(29)
    expect(parseBs('0.3')).toBe(30)
    expect(parseBs('20')).toBe(2000)
    expect(parseBs(' 5,50 ')).toBe(550)
  })

  test('not a positive amount with at most two decimals: null', () => {
    for (const text of ['', ' ', '0', '0,00', '-1', '1,505', '1.', ',50', 'abc', '1 000', '1.000,50', '1e3']) {
      expect(parseBs(text), text).toBeNull()
    }
  })
})
