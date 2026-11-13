import type { UndoResult } from './entries'
import { errorCode } from './entryErrors'
import { errorDetail } from './errorDetail'

// Undoing an entry right after saving it (#20, undo_entry in migration 0025).

// "Deshacer" is shown this long after saving; the PIN prompt then stays open at most this long.
// The database allows 90 seconds after the save, so both fit with a margin for the connection.
export const UNDO_OFFER_MS = 10_000
export const UNDO_PROMPT_MS = 60_000

// What the PIN prompt does next:
// - removed: the entry is gone; the form gets it back to be fixed.
// - retry: the prompt stays open with a message. `unsure` = no answer, so nobody knows yet whether it
//   was removed; the PIN is kept, and trying again is safe (see undoErrorStep).
// - closed: the prompt closes; the message says the entry is still saved, and why.
export type UndoStep =
  | { kind: 'removed' }
  | { kind: 'retry'; message: string; unsure: boolean }
  | { kind: 'closed'; message: string }

const ASK_OPERATOR = 'Si hay un error, avise a la encargada.'

function stillSaved(entryId: number, reason: string): string {
  return `${reason} El registro n.º ${entryId} sigue guardado. ${ASK_OPERATOR}`
}

function lockedMessage(entryId: number): string {
  return `PIN incorrecto 3 veces. El registro n.º ${entryId} sigue guardado y ya no se puede deshacer. ${ASK_OPERATOR}`
}

export function undoResultStep(entryId: number, result: UndoResult): UndoStep {
  if (result.kind === 'undone') return { kind: 'removed' }
  if (result.attemptsLeft <= 0) return { kind: 'closed', message: lockedMessage(entryId) }
  const left =
    result.attemptsLeft === 1 ? 'Le queda 1 intento.' : `Le quedan ${result.attemptsLeft} intentos.`
  return { kind: 'retry', message: `PIN incorrecto. ${left}`, unsure: false }
}

// After an error. entry_not_found only happens once the entry is gone (e.g. a retry after an undo
// whose answer was lost), so it counts as removed. Any error the database did not explain may mean
// the undo never arrived, or that its answer was lost: unsure.
export function undoErrorStep(entryId: number, error: unknown): UndoStep {
  switch (errorCode(error)) {
    case 'entry_not_found':
      return { kind: 'removed' }
    case 'undo_locked':
      return { kind: 'closed', message: lockedMessage(entryId) }
    case 'undo_too_late':
      return { kind: 'closed', message: stillSaved(entryId, 'Ya pasó el tiempo para deshacer.') }
    case 'account_invalid':
      return { kind: 'closed', message: stillSaved(entryId, 'Su cuenta no se encontró.') }
    case 'pin_reset_pending':
      return { kind: 'closed', message: stillSaved(entryId, 'Su PIN fue reiniciado.') }
    default:
      return {
        kind: 'retry',
        message: `Sin respuesta (${errorDetail(error)}): no sabemos si se deshizo. Toque «Deshacer registro» otra vez.`,
        unsure: true,
      }
  }
}

// The prompt closed without an answer from the database.
export function cancelledMessage(entryId: number): string {
  return `El registro n.º ${entryId} sigue guardado.`
}

export function expiredMessage(entryId: number, unsure: boolean): string {
  return unsure
    ? `No se pudo confirmar si el registro n.º ${entryId} se deshizo. Avise a la encargada.`
    : `Se acabó el tiempo para deshacer. El registro n.º ${entryId} sigue guardado.`
}
