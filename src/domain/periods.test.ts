import { describe, expect, test } from 'vitest'
import { periodOf, shiftPeriod } from './periods'

describe('periodOf', () => {
  test('the 23rd starts a new period', () => {
    expect(periodOf('2026-10-23')).toEqual({ start: '2026-10-23', end: '2026-11-22' })
  })

  test('the 22nd ends the period', () => {
    expect(periodOf('2026-10-22')).toEqual({ start: '2026-09-23', end: '2026-10-22' })
  })

  test('early in January belongs to the period that started in December', () => {
    expect(periodOf('2027-01-05')).toEqual({ start: '2026-12-23', end: '2027-01-22' })
  })

  test('late in December runs into next year', () => {
    expect(periodOf('2026-12-30')).toEqual({ start: '2026-12-23', end: '2027-01-22' })
  })
})

describe('shiftPeriod', () => {
  const october = { start: '2026-09-23', end: '2026-10-22' }

  test('previous period', () => {
    expect(shiftPeriod(october, -1)).toEqual({ start: '2026-08-23', end: '2026-09-22' })
  })

  test('next period', () => {
    expect(shiftPeriod(october, 1)).toEqual({ start: '2026-10-23', end: '2026-11-22' })
  })

  test('across the new year', () => {
    expect(shiftPeriod({ start: '2027-01-23', end: '2027-02-22' }, -2)).toEqual({
      start: '2026-11-23',
      end: '2026-12-22',
    })
  })
})
