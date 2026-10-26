import { errorDetail } from './errorDetail'

// Supabase Auth error codes (`code`), plus our own 'not_admin' (`message`, see admin.ts).
export const ADMIN_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  over_request_rate_limit: 'Demasiados intentos. Espere unos minutos y vuelva a intentarlo.',
  not_admin: 'Esta cuenta no tiene acceso de administración.',
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
