// A short, readable detail for the failure message, from whatever was thrown.
// Supabase errors are plain objects with a `message`, not Error instances.
export function errorDetail(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : String(error)

  if (/timeout|timed out|abort/i.test(message)) return 'La conexión tardó demasiado'
  if (/failed to fetch|network|load failed/i.test(message)) return 'Sin conexión a internet'
  return message
}
