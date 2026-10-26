import { EMPTY_ENTRY_MESSAGE } from '../domain/entryRules'
import { errorDetail } from './errorDetail'

// The error codes raised by register_account_entry (supabase/migrations/0003_entry_accounts.sql,
// entry_empty since 0008).
export const ENTRY_MESSAGES: Record<string, string> = {
  pin_wrong: 'PIN incorrecto. Vuelva a intentarlo.',
  account_invalid: 'Su cuenta no se encontró. Recargue la página y elija su nombre de nuevo.',
  entry_empty: EMPTY_ENTRY_MESSAGE,
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
