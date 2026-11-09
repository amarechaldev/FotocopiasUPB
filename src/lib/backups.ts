import { SAVE_TIMEOUT_MS } from './entries'
import { supabase } from './supabase'

// Backups (migration 0024), logged-in operator only.

// Every table, as one JSON object (PIN hashes included: the operator keeps the file private).
export async function fetchBackup(): Promise<unknown> {
  const { data, error } = await supabase.rpc('backup_data')
  if (error) throw error
  return data
}

// Records that a backup was downloaded now; returns the time recorded.
export async function recordBackup(): Promise<Date> {
  const { data, error } = await supabase.rpc('record_backup').abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  return new Date(data as string)
}

// The time of the last backup, or null if there was none.
export async function fetchLastBackup(): Promise<Date | null> {
  const { data, error } = await supabase.rpc('last_backup_at')
  if (error) throw error
  return data ? new Date(data as string) : null
}

// Hands the backup to the browser as a file download (the operator chooses where to keep it).
export function downloadJson(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  // Freed a little later: some browsers start reading the file only after click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
