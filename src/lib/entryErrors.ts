import {
  EARLY_DATE_MESSAGE,
  EMPTY_ENTRY_MESSAGE,
  VAGUE_DESCRIPTION_MESSAGE,
} from '../domain/entryRules'
import { errorDetail } from './errorDetail'

// The error codes raised by register_account_entry (supabase/migrations/0003_entry_accounts.sql,
// entry_empty since 0008, the vague and early checks since 0014), and the PIN reset codes of
// register_account_entry and set_new_pin (0018).
export const ENTRY_MESSAGES: Record<string, string> = {
  pin_wrong: 'PIN incorrecto. Vuelva a intentarlo.',
  account_invalid: 'Su cuenta no se encontró. Recargue la página y elija su nombre de nuevo.',
  entry_empty: EMPTY_ENTRY_MESSAGE,
  description_vague: VAGUE_DESCRIPTION_MESSAGE,
  date_before_first_period: EARLY_DATE_MESSAGE,
  pin_reset_pending: 'Su PIN fue reiniciado: elija un PIN nuevo.',
  pin_reset_not_pending: 'El reinicio de su PIN fue cancelado: use su PIN de siempre.',
  pin_invalid: 'El PIN debe tener 4 números.',
}

function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error
    ? String(error.message)
    : ''
}

// A Spanish message for the person saving an entry, from whatever was thrown.
export function entryErrorMessage(error: unknown): string {
  return ENTRY_MESSAGES[errorCode(error)] ?? errorDetail(error)
}

// True when the database refused the entry for a reason the person can fix right away
// (e.g. a wrong PIN), as opposed to a connection or server failure.
export function isRefusal(error: unknown): boolean {
  return Object.hasOwn(ENTRY_MESSAGES, errorCode(error))
}
