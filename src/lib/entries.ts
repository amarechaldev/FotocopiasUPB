import { supabase } from './supabase'

export type Area = {
  id: number
  name: string
}

export type NewEntry = {
  entryDate: string // YYYY-MM-DD
  areaId: number
  name: string
  description: string
  copias: number
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

// Saves the entry and returns its number.
export async function registerEntry(entry: NewEntry): Promise<number> {
  const { data, error } = await supabase.rpc('register_entry', {
    p_entry_date: entry.entryDate,
    p_area_id: entry.areaId,
    p_name: entry.name,
    p_description: entry.description,
    p_copias: entry.copias,
    p_anillados: [], // added in #13
  })
  if (error) throw error
  return data
}
