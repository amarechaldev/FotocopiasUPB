import type { CommonDescription } from '../domain/descriptions'
import type { Period } from '../domain/periods'
import { supabase } from './supabase'

export type Area = {
  id: number
  name: string
}

export type Anillado = {
  sizeMm: number
  quantity: number
}

// An entry saved with an account: the name comes from the account, the PIN proves it.
export type AccountEntry = {
  accountId: number
  pin: string // 4 digits, as text
  entryDate: string // YYYY-MM-DD
  areaId: number
  description: string
  copias: number
  anillados: Anillado[]
}

// Active departments, in the order of the monthly report, plus the archived ones in `keep` (an
// entry being edited keeps its department).
export async function fetchAreas(keep: number[] = []): Promise<Area[]> {
  const { data, error } = await supabase
    .from('areas')
    .select('id, name, active')
    .order('id')
  if (error) throw error
  return data
    .filter((row) => row.active || keep.includes(row.id))
    .map((row) => ({ id: row.id, name: row.name }))
}

// Anillado sizes in mm, smallest first: the active ones, plus the archived ones in `keep`.
export async function fetchAnilladoSizes(keep: number[] = []): Promise<number[]> {
  const { data, error } = await supabase
    .from('anillado_sizes')
    .select('size_mm, archived_from')
    .order('size_mm')
  if (error) throw error
  return data
    .filter((row) => row.archived_from === null || keep.includes(row.size_mm))
    .map((row) => row.size_mm)
}

// The too-vague descriptions (migration 0014), as the operator wrote them.
export async function fetchVagueDescriptions(): Promise<string[]> {
  const { data, error } = await supabase.from('vague_descriptions').select('description')
  if (error) throw error
  return data.map((row) => row.description)
}

// The common descriptions of every department (migration 0016), for the suggestions.
export async function fetchCommonDescriptions(): Promise<CommonDescription[]> {
  const { data, error } = await supabase.from('common_descriptions').select('area_id, description')
  if (error) throw error
  return data.map((row) => ({ areaId: row.area_id, description: row.description }))
}

// For the staff form, which cannot read the operator's list of periods (migration 0015).
export type CurrentPeriod = {
  current: Period | null // null before the first period starts
  firstStart: string // the earliest date an entry can have
}

export async function fetchCurrentPeriod(): Promise<CurrentPeriod> {
  const { data, error } = await supabase.rpc('current_period').single()
  if (error) throw error
  const row = data as { start_date: string | null; end_date: string | null; first_start: string }
  const current =
    row.start_date && row.end_date ? { start: row.start_date, end: row.end_date } : null
  return { current, firstStart: row.first_start }
}

// On a weak connection a request can hang for minutes; give up after this,
// so staff get a clear answer while they are still at the counter.
export const SAVE_TIMEOUT_MS = 15_000

// Saves the entry and its anillados in one transaction if the PIN is right,
// and returns the entry's number.
// Errors come back as codes (see entryErrorMessage).
export async function registerAccountEntry(entry: AccountEntry): Promise<number> {
  const { data, error } = await supabase
    .rpc('register_account_entry', {
      p_account_id: entry.accountId,
      p_pin: entry.pin,
      p_entry_date: entry.entryDate,
      p_area_id: entry.areaId,
      p_description: entry.description,
      p_copias: entry.copias,
      p_anillados: entry.anillados.map((a) => ({ size_mm: a.sizeMm, quantity: a.quantity })),
    })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  return data
}

export type UndoResult = { kind: 'undone' } | { kind: 'pin_wrong'; attemptsLeft: number }

// Removes an entry just saved, with its account's PIN (migration 0025). A wrong PIN is a result,
// with the attempts left; the other refusals come back as codes (see undoMessages).
export async function undoEntry(entryId: number, pin: string): Promise<UndoResult> {
  const { data, error } = await supabase
    .rpc('undo_entry', { p_entry_id: entryId, p_pin: pin })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  const row = data as { result: string; attempts_left?: number }
  return row.result === 'undone'
    ? { kind: 'undone' }
    : { kind: 'pin_wrong', attemptsLeft: row.attempts_left ?? 0 }
}
