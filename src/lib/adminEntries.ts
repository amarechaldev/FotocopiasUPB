import type { ListedEntry } from '../domain/entryList'
import type { Period } from '../domain/periods'
import { SAVE_TIMEOUT_MS, type Anillado } from './entries'
import { supabase } from './supabase'

// The operator's access to entries (migrations 0006 and 0008). Admins only: anyone else
// gets 'not_admin', and the other error codes are listed in adminErrors.ts.

type EntryRow = {
  id: number
  entry_date: string
  created_at: string
  modified_at: string | null
  manual: boolean
  area_id: number
  area_name: string
  account_id: number | null
  name: string
  description: string
  copias: number
  anillados: { size_mm: number; quantity: number }[]
}

function anilladosParam(anillados: Anillado[]) {
  return anillados.map((a) => ({ size_mm: a.sizeMm, quantity: a.quantity }))
}

// Every entry whose service date is in the period, newest saved first.
export async function fetchEntries(period: Period): Promise<ListedEntry[]> {
  const { data, error } = await supabase
    .rpc('list_entries', { p_from: period.start, p_to: period.end })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  return (data as EntryRow[]).map((row) => ({
    id: row.id,
    entryDate: row.entry_date,
    createdAt: new Date(row.created_at),
    modifiedAt: row.modified_at === null ? null : new Date(row.modified_at),
    manual: row.manual,
    areaId: row.area_id,
    areaName: row.area_name,
    accountId: row.account_id,
    name: row.name,
    description: row.description,
    copias: row.copias,
    anillados: row.anillados.map((a) => ({ sizeMm: a.size_mm, quantity: a.quantity })),
  }))
}

// The new state of an entry, as the operator saves it.
export type EntryChanges = {
  accountId: number
  entryDate: string // YYYY-MM-DD
  areaId: number
  description: string
  copias: number
  anillados: Anillado[]
}

// Saves the changes and marks the entry as modified; the name comes from the account.
export async function updateEntry(id: number, changes: EntryChanges): Promise<void> {
  const { error } = await supabase
    .rpc('update_entry', {
      p_id: id,
      p_account_id: changes.accountId,
      p_entry_date: changes.entryDate,
      p_area_id: changes.areaId,
      p_description: changes.description,
      p_copias: changes.copias,
      p_anillados: anilladosParam(changes.anillados),
    })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
}

// Registers an entry on someone's behalf (e.g. from the paper notebook), marked as manual,
// and returns its number. Checked like any other entry; no PIN.
export async function registerManualEntry(entry: EntryChanges): Promise<number> {
  const { data, error } = await supabase
    .rpc('register_manual_entry', {
      p_account_id: entry.accountId,
      p_entry_date: entry.entryDate,
      p_area_id: entry.areaId,
      p_description: entry.description,
      p_copias: entry.copias,
      p_anillados: anilladosParam(entry.anillados),
    })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  return data
}

export async function deleteEntry(id: number): Promise<void> {
  const { error } = await supabase
    .rpc('delete_entry', { p_id: id })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
}

// Undo: puts the entry back exactly as it was listed before the last edit or delete.
export async function restoreEntry(entry: ListedEntry): Promise<void> {
  const { error } = await supabase
    .rpc('restore_entry', {
      p_id: entry.id,
      p_entry_date: entry.entryDate,
      p_created_at: entry.createdAt.toISOString(),
      p_modified_at: entry.modifiedAt?.toISOString() ?? null,
      p_area_id: entry.areaId,
      p_account_id: entry.accountId,
      p_name: entry.name,
      p_description: entry.description,
      p_copias: entry.copias,
      p_anillados: anilladosParam(entry.anillados),
      p_manual: entry.manual,
    })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
}
