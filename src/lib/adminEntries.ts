import type { ListedEntry } from '../domain/entryList'
import type { Period } from '../domain/periods'
import { SAVE_TIMEOUT_MS } from './entries'
import { supabase } from './supabase'

type EntryRow = {
  id: number
  entry_date: string
  created_at: string
  area_id: number
  area_name: string
  name: string
  description: string
  copias: number
  anillados: { size_mm: number; quantity: number }[]
}

// Every entry whose service date is in the period, newest saved first.
// Admins only: anyone else gets 'not_admin' (see adminErrorMessage).
export async function fetchEntries(period: Period): Promise<ListedEntry[]> {
  const { data, error } = await supabase
    .rpc('list_entries', { p_from: period.start, p_to: period.end })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  return (data as EntryRow[]).map((row) => ({
    id: row.id,
    entryDate: row.entry_date,
    createdAt: new Date(row.created_at),
    areaId: row.area_id,
    areaName: row.area_name,
    name: row.name,
    description: row.description,
    copias: row.copias,
    anillados: row.anillados.map((a) => ({ sizeMm: a.size_mm, quantity: a.quantity })),
  }))
}
