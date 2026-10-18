import { describe, expect, test } from 'vitest'
import { todayInBolivia } from './dates'

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
