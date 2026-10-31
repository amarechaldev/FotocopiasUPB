import { EMPTY_ENTRY_MESSAGE } from '../domain/entryRules'
import { errorDetail } from './errorDetail'

// Supabase Auth error codes (`code`), plus our own codes (`message`): 'not_admin' from
// admin.ts and the admin functions, and the edit codes from update_entry and delete_entry
// (migration 0008).
export const ADMIN_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  over_request_rate_limit: 'Demasiados intentos. Espere unos minutos y vuelva a intentarlo.',
  not_admin: 'Esta cuenta no tiene acceso de administración.',
  entry_missing: 'Este pedido ya no existe. Recargue la página.',
  account_invalid: 'Elija un nombre de la lista.',
  date_required: 'Elija la fecha.',
  description_required: 'Escriba la descripción.',
  area_invalid: 'Elija un área de la lista.',
  entry_empty: EMPTY_ENTRY_MESSAGE,
  // set_period_end (migrations 0011 and 0012). The date field only offers valid dates, so the
  // last two appear only if the periods changed meanwhile.
  period_locked:
    'Solo se puede cambiar el cierre del periodo actual o del anterior. Recargue la página.',
  period_end_too_early: 'Esa fecha de cierre es demasiado temprana. Recargue la página.',
  period_end_too_late: 'Esa fecha de cierre es demasiado tardía. Recargue la página.',
}

function field(error: unknown, name: 'code' | 'message'): string {
  return typeof error === 'object' && error !== null && name in error
    ? String((error as Record<string, unknown>)[name])
    : ''
}

// A Spanish message for the operator logging in, from whatever was thrown.
export function adminErrorMessage(error: unknown): string {
  return (
    ADMIN_MESSAGES[field(error, 'code')] ??
    ADMIN_MESSAGES[field(error, 'message')] ??
    errorDetail(error)
  )
}
