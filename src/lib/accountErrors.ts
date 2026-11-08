import { errorDetail } from './errorDetail'
import { ENTRY_MESSAGES } from './entryErrors'

// The error codes raised by create_account (supabase/migrations/0002_accounts.sql).
export const ACCOUNT_MESSAGES: Record<string, string> = {
  name_required: 'Escriba su nombre.',
  pin_invalid: 'El PIN debe tener 4 números.',
  areas_required: 'Elija al menos un área.',
  area_invalid: 'Una de las áreas elegidas ya no está disponible. Recargue la página.',
  default_invalid: 'Elija cuál de sus áreas es la principal.',
  name_taken:
    'Ya existe una cuenta con ese nombre. Agregue algo para diferenciarlo: una inicial, un segundo nombre o un segundo apellido.',
}

// "Mi cuenta" (#30, 0019): the same checks, plus the login ones, worded as on the entry screen.
export const OWN_ACCOUNT_MESSAGES: Record<string, string> = {
  ...ACCOUNT_MESSAGES,
  pin_wrong: ENTRY_MESSAGES.pin_wrong,
  account_invalid: ENTRY_MESSAGES.account_invalid,
  pin_reset_pending: ENTRY_MESSAGES.pin_reset_pending,
}

function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error
    ? String(error.message)
    : ''
}

// A Spanish message for the person creating an account, from whatever was thrown.
export function accountErrorMessage(error: unknown): string {
  return ACCOUNT_MESSAGES[errorCode(error)] ?? errorDetail(error)
}

// True when the database refused a change to one's own account for a reason the person can fix
// right away (e.g. a wrong PIN), as opposed to a connection or server failure.
export function isOwnAccountRefusal(error: unknown): boolean {
  return Object.hasOwn(OWN_ACCOUNT_MESSAGES, errorCode(error))
}

// A Spanish message for the person editing their own account, from whatever was thrown.
export function ownAccountErrorMessage(error: unknown): string {
  return OWN_ACCOUNT_MESSAGES[errorCode(error)] ?? errorDetail(error)
}
