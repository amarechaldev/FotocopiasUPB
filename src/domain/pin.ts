// A PIN is exactly 4 digits, kept as text so that "0123" keeps its leading zero.
const PIN_PATTERN = /^[0-9]{4}$/

// Checks the PIN and its confirmation when creating an account.
// Returns a Spanish message for the person, or null if the PIN can be used.
export function checkPin(pin: string, confirmation: string): string | null {
  if (!PIN_PATTERN.test(pin)) return 'El PIN debe tener 4 números.'
  if (pin !== confirmation) return 'Los dos PIN no coinciden. Escríbalos de nuevo.'
  return null
}
