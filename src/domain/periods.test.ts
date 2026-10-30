import { describe, expect, test } from 'vitest'
import {
  browsablePeriods,
  hasEnded,
  nextAfterNewEnd,
  periodContaining,
  type BillingPeriod,
} from './periods'

function period(month: string, start: string, end: string, isCurrent = false): BillingPeriod {
  return { month, start, end, isCurrent, changeable: false, earliestEnd: start, latestEnd: end }
}

// The first period's end was moved to 25/11, so December starts on the 26th.
const november = period('2026-11-01', '2026-10-23', '2026-11-25')
const december = period('2026-12-01', '2026-11-26', '2026-12-22', true)
const january = period('2027-01-01', '2026-12-23', '2027-01-22')
const periods = [november, december, january]

describe('browsablePeriods', () => {
  test('up to the current period, without the next one', () => {
    expect(browsablePeriods(periods)).toEqual([november, december])
  })

  test('nothing if no period is current', () => {
    expect(browsablePeriods([november])).toEqual([])
  })
})

describe('hasEnded', () => {
  test('not on its last day', () => {
    expect(hasEnded(november, '2026-11-25')).toBe(false)
  })

  test('the day after its last day', () => {
    expect(hasEnded(november, '2026-11-26')).toBe(true)
  })
})

describe('nextAfterNewEnd', () => {
  test('closing early makes the next period start earlier', () => {
    expect(nextAfterNewEnd(december, '2026-10-26')).toEqual({ start: '2026-10-27', end: '2026-12-22' })
  })

  test('the next period can be left with one day', () => {
    expect(nextAfterNewEnd(december, '2026-12-21')).toEqual({ start: '2026-12-22', end: '2026-12-22' })
  })

  test('none if the next period would be left with no day', () => {
    expect(nextAfterNewEnd(december, '2026-12-22')).toBeNull()
  })
})

describe('periodContaining', () => {
  test('a moved end date belongs to its period', () => {
    expect(periodContaining(periods, '2026-11-25')).toBe(november)
  })

  test('the day after a moved end starts the next period', () => {
    expect(periodContaining(periods, '2026-11-26')).toBe(december)
  })

  test('before the first period: none', () => {
    expect(periodContaining(periods, '2026-10-22')).toBeNull()
  })
})
