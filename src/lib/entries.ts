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

// Active departments, in the order of the monthly report.
export async function fetchAreas(): Promise<Area[]> {
  const { data, error } = await supabase
    .from('areas')
    .select('id, name')
    .eq('active', true)
    .order('id')
  if (error) throw error
  return data
}

// Anillado sizes in mm, smallest first.
export async function fetchAnilladoSizes(): Promise<number[]> {
  const { data, error } = await supabase
    .from('anillado_sizes')
    .select('size_mm')
    .order('size_mm')
  if (error) throw error
  return data.map((row) => row.size_mm)
}

// The too-vague descriptions (migration 0014), as the operator wrote them.
export async function fetchVagueDescriptions(): Promise<string[]> {
  const { data, error } = await supabase.from('vague_descriptions').select('description')
  if (error) throw error
  return data.map((row) => row.description)
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
