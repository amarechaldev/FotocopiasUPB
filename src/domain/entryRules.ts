import { formatDate } from './dates'
import { normalizeName } from './names'
import { periodContaining, type Period } from './periods'

export const EMPTY_ENTRY_MESSAGE = 'El pedido debe tener al menos 1 copia o 1 anillado.'

const BETTER_DESCRIPTIONS = 'Escriba qué se fotocopió, p. ej. Exámenes, Cartas o Facturas.'

// When the database refuses a description that the browser let through (e.g. the list changed).
export const VAGUE_DESCRIPTION_MESSAGE = `La descripción es muy general. ${BETTER_DESCRIPTIONS}`
export const EARLY_DATE_MESSAGE = 'La fecha es anterior al inicio del primer periodo.'

// Checks what an entry contains, for staff and operator alike (same rule as entry_is_empty
// in the database, migration 0008). Returns a Spanish message, or null if it can be saved.
export function checkEntryContents(copias: number, anilladoQuantities: number[]): string | null {
  const total = anilladoQuantities.reduce((sum, quantity) => sum + quantity, copias)
  return total > 0 ? null : EMPTY_ENTRY_MESSAGE
}

// A description that is only one of the too-vague ones (#3), ignoring case, accents and spaces:
// the same rule as description_is_vague in the database (migration 0014). Longer descriptions
// that contain those words are fine.
export function checkDescription(description: string, vague: string[]): string | null {
  const typed = normalizeName(description)
  return vague.some((v) => normalizeName(v) === typed)
    ? `«${description.trim()}» es muy general. ${BETTER_DESCRIPTIONS}`
    : null
}

// No entry before the first billing period (PO, 30/10/2026; date_before_first_period in 0014).
export function checkEntryDate(date: string, firstStart: string): string | null {
  return date < firstStart // ISO dates compare correctly as text
    ? `La fecha no puede ser anterior al ${formatDate(firstStart)}, inicio del primer periodo.`
    : null
}

function describePeriod(period: Period): string {
  return `${formatDate(period.start)} – ${formatDate(period.end)}`
}

// Warnings: shown, but the entry can still be saved (#3).
const CAN_SAVE = 'Se puede guardar de todos modos.'

// A new entry (staff or manual) dated outside the current period. None before the first period
// starts (no current period).
export function newEntryPeriodWarning(date: string, current: Period | null): string | null {
  if (current === null || (current.start <= date && date <= current.end)) return null
  return `Esta fecha no está en el periodo actual (${describePeriod(current)}). ${CAN_SAVE}`
}

// An edit that moves an entry to another period.
export function movedPeriodWarning(
  originalDate: string,
  date: string,
  periods: Period[],
): string | null {
  const from = periodContaining(periods, originalDate)
  const to = periodContaining(periods, date)
  if (from?.start === to?.start) return null
  if (from === null || to === null) {
    return `Este cambio pasa el pedido a otro periodo. ${CAN_SAVE}`
  }
  return (
    `Este cambio pasa el pedido del periodo ${describePeriod(from)} ` +
    `al periodo ${describePeriod(to)}. ${CAN_SAVE}`
  )
}
