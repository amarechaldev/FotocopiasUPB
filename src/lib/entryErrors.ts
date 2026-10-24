import { errorDetail } from './errorDetail'

// The error codes raised by register_account_entry (supabase/migrations/0003_entry_accounts.sql).
export const ENTRY_MESSAGES: Record<string, string> = {
  pin_wrong: 'PIN incorrecto. Vuelva a intentarlo.',
  account_invalid: 'Su cuenta no se encontró. Recargue la página y elija su nombre de nuevo.',
}

// A Spanish message for the person saving an entry, from whatever was thrown.
export function entryErrorMessage(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : ''
  return ENTRY_MESSAGES[message] ?? errorDetail(error)
}
