import { supabase } from './supabase'

export type Area = {
  id: number
  name: string
}

export type Anillado = {
  sizeMm: number
  quantity: number
}

export type NewEntry = {
  entryDate: string // YYYY-MM-DD
  areaId: number
  name: string
  description: string
  copias: number
  anillados: Anillado[]
}

// An entry saved with an account: the name comes from the account, the PIN proves it.
export type AccountEntry = Omit<NewEntry, 'name'> & {
  accountId: number
  pin: string // 4 digits, as text
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

// On a weak connection a request can hang for minutes; give up after this,
// so staff get a clear answer while they are still at the counter.
export const SAVE_TIMEOUT_MS = 15_000

// Saves the entry and its anillados in one transaction, and returns the entry's number.
export async function registerEntry(entry: NewEntry): Promise<number> {
  const { data, error } = await supabase
    .rpc('register_entry', {
      p_entry_date: entry.entryDate,
      p_area_id: entry.areaId,
      p_name: entry.name,
      p_description: entry.description,
      p_copias: entry.copias,
      p_anillados: entry.anillados.map((a) => ({ size_mm: a.sizeMm, quantity: a.quantity })),
    })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  return data
}

// Saves the entry for the account if the PIN is right, and returns the entry's number.
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
