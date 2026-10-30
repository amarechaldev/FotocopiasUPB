import { describe, expect, test } from 'vitest'
import { addDays, formatDate, formatDateTime, todayInBolivia } from './dates'

describe('addDays', () => {
  test('the next day, across the end of a year', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  test('the previous day, across the end of a month', () => {
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31')
  })
})

describe('todayInBolivia', () => {
  test('uses the Bolivian date, not the UTC date, late in the evening', () => {
    // 23:30 in La Paz (UTC-4) is already the next day in UTC.
    expect(todayInBolivia(new Date('2026-10-18T03:30:00Z'))).toBe('2026-10-17')
  })

  test('changes date at midnight in La Paz', () => {
    expect(todayInBolivia(new Date('2026-10-18T04:00:00Z'))).toBe('2026-10-18')
  })

  test('pads month and day with zeros', () => {
    expect(todayInBolivia(new Date('2026-03-05T15:00:00Z'))).toBe('2026-03-05')
  })
})

describe('formatDate', () => {
  test('day/month/year', () => {
    expect(formatDate('2026-10-17')).toBe('17/10/2026')
  })
})

describe('formatDateTime', () => {
  test('converts UTC to Bolivian time, including the date', () => {
    // 01:05 UTC on the 18th is 21:05 on the 17th in La Paz.
    expect(formatDateTime(new Date('2026-10-18T01:05:00Z'))).toBe('17/10/2026 21:05')
  })

  test('midnight shows as 00, not 24', () => {
    expect(formatDateTime(new Date('2026-10-18T04:00:00Z'))).toBe('18/10/2026 00:00')
  })
})
