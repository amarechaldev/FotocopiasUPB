export const EMPTY_ENTRY_MESSAGE = 'El pedido debe tener al menos 1 copia o 1 anillado.'

// Checks what an entry contains, for staff and operator alike (same rule as entry_is_empty
// in the database, migration 0008). Returns a Spanish message, or null if it can be saved.
export function checkEntryContents(copias: number, anilladoQuantities: number[]): string | null {
  const total = anilladoQuantities.reduce((sum, quantity) => sum + quantity, copias)
  return total > 0 ? null : EMPTY_ENTRY_MESSAGE
}
