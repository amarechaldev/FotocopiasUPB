import { describe, expect, test } from 'vitest'
import {
  checkDescription,
  checkEntryContents,
  checkEntryDate,
  EMPTY_ENTRY_MESSAGE,
  movedPeriodWarning,
  newEntryPeriodWarning,
} from './entryRules'

describe('checkEntryContents', () => {
  test('copias only, anillados only, or both can be saved', () => {
    expect(checkEntryContents(5, [])).toBeNull()
    expect(checkEntryContents(0, [1])).toBeNull()
    expect(checkEntryContents(3, [2, 1])).toBeNull()
  })

  test('nothing at all is refused', () => {
    expect(checkEntryContents(0, [])).toBe(EMPTY_ENTRY_MESSAGE)
  })
})

describe('checkDescription', () => {
  const vague = ['Copias', 'Fotocopias', 'Documento']

  test('a too-vague description, ignoring capitals, accents and spaces', () => {
    expect(checkDescription('copias', vague)).toContain('«copias» es muy general')
    expect(checkDescription('  COPIAS ', vague)).toContain('«COPIAS» es muy general')
    expect(checkDescription('Fotocópias', vague)).not.toBeNull()
  })

  test('longer descriptions containing those words are fine', () => {
    expect(checkDescription('Copias del examen', vague)).toBeNull()
    expect(checkDescription('Exámenes', vague)).toBeNull()
  })
})

describe('checkEntryDate', () => {
  test('from the first day of the first period', () => {
    expect(checkEntryDate('2026-10-23', '2026-10-23')).toBeNull()
    expect(checkEntryDate('2026-11-04', '2026-10-23')).toBeNull()
  })

  test('the day before is refused, with the date as users see it', () => {
    expect(checkEntryDate('2026-10-22', '2026-10-23')).toBe(
      'La fecha no puede ser anterior al 23/10/2026, inicio del primer periodo.',
    )
  })
})

const october = { start: '2026-09-23', end: '2026-10-22' }
const november = { start: '2026-10-23', end: '2026-11-22' }
const december = { start: '2026-11-23', end: '2026-12-22' }

describe('newEntryPeriodWarning', () => {
  test('none inside the current period, first and last day included', () => {
    expect(newEntryPeriodWarning('2026-10-23', november)).toBeNull()
    expect(newEntryPeriodWarning('2026-11-22', november)).toBeNull()
  })

  test('before or after it: a warning with the current period', () => {
    expect(newEntryPeriodWarning('2026-10-22', november)).toBe(
      'Esta fecha no está en el periodo actual (23/10/2026 – 22/11/2026). Se puede guardar de todos modos.',
    )
    expect(newEntryPeriodWarning('2026-11-23', november)).not.toBeNull()
  })

  test('none before the first period starts (no current period)', () => {
    expect(newEntryPeriodWarning('2026-10-01', null)).toBeNull()
  })
})

describe('movedPeriodWarning', () => {
  const periods = [october, november, december]

  test('none when the date stays in its period', () => {
    expect(movedPeriodWarning('2026-10-25', '2026-11-22', periods)).toBeNull()
  })

  test('a warning naming both periods', () => {
    expect(movedPeriodWarning('2026-11-22', '2026-11-23', periods)).toBe(
      'Este cambio pasa el pedido del periodo 23/10/2026 – 22/11/2026 ' +
        'al periodo 23/11/2026 – 22/12/2026. Se puede guardar de todos modos.',
    )
  })

  test('to a date outside the known periods: a shorter warning', () => {
    expect(movedPeriodWarning('2026-11-01', '2027-03-01', periods)).toBe(
      'Este cambio pasa el pedido a otro periodo. Se puede guardar de todos modos.',
    )
  })
})
