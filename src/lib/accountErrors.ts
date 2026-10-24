import { errorDetail } from './errorDetail'

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

// A Spanish message for the person creating an account, from whatever was thrown.
export function accountErrorMessage(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : ''
  return ACCOUNT_MESSAGES[message] ?? errorDetail(error)
}
