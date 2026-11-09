import { describe, expect, test } from 'vitest'
import { backupDue, backupFileName } from './backup'

describe('backupDue', () => {
  const last = new Date('2026-11-08T14:00:00Z')

  test('due when there was never a backup', () => {
    expect(backupDue(null, last)).toBe(true)
  })

  test('not due before 23 hours', () => {
    expect(backupDue(last, new Date('2026-11-08T14:00:00Z'))).toBe(false)
    expect(backupDue(last, new Date('2026-11-09T12:59:59Z'))).toBe(false)
  })

  test('due from 23 hours on', () => {
    expect(backupDue(last, new Date('2026-11-09T13:00:00Z'))).toBe(true)
    expect(backupDue(last, new Date('2026-11-12T09:00:00Z'))).toBe(true)
  })
})

describe('backupFileName', () => {
  test('Bolivian date and time, like the report names', () => {
    // 02:05 UTC on the 9th is 22:05 on the 8th in Bolivia (UTC-4).
    expect(backupFileName(new Date('2026-11-09T02:05:00Z'))).toBe(
      'copia-de-seguridad-fotocopias_08-11-2026_22-05.json',
    )
  })
})
