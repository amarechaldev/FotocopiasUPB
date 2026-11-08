import { SAVE_TIMEOUT_MS } from './entries'
import { errorDetail } from './errorDetail'
import { PRICE_MESSAGES } from './prices'
import { supabase } from './supabase'

// The operator's lists (migrations 0020 and 0021). Admins only for every change: anyone else gets
// 'not_admin'. Reading is open to the logged-in operator.

// A department, archived ones included. archivedFrom: the period (month) it is archived from.
export type ListedArea = { id: number; name: string; archivedFrom: string | null }

// An anillado size, archived ones included.
export type ListedSize = { sizeMm: number; archivedFrom: string | null }

export async function fetchAllAreas(): Promise<ListedArea[]> {
  const { data, error } = await supabase.from('areas').select('id, name, archived_from').order('id')
  if (error) throw error
  return data.map((row) => ({ id: row.id, name: row.name, archivedFrom: row.archived_from }))
}

export async function fetchAllSizes(): Promise<ListedSize[]> {
  const { data, error } = await supabase
    .from('anillado_sizes')
    .select('size_mm, archived_from')
    .order('size_mm')
  if (error) throw error
  return data.map((row) => ({ sizeMm: row.size_mm, archivedFrom: row.archived_from }))
}

// Every change is one database function; same timeout as saving an entry.
async function call(fn: string, args: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase.rpc(fn, args).abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  return data
}

// Departments: last in the forms and the monthly report. A new name shows in every report.
export const createArea = (name: string) => call('create_area', { p_name: name })
export const renameArea = (id: number, name: string) => call('rename_area', { p_area_id: id, p_name: name })
export const archiveArea = (id: number, month: string) => call('archive_area', { p_area_id: id, p_from: month })
export const reactivateArea = (id: number) => call('reactivate_area', { p_area_id: id })
// Only without entries and without accounts (0022); its usual descriptions lose it.
export const deleteArea = (id: number) => call('delete_area', { p_area_id: id })

// Per department: how many entries and accounts have it (0022).
export type AreaUsage = { entryCount: number; accountCount: number }

export async function fetchAreaUsage(): Promise<Map<number, AreaUsage>> {
  const rows = (await call('list_area_usage', {})) as {
    area_id: number
    entry_count: number
    account_count: number
  }[]
  return new Map(
    rows.map((row) => [row.area_id, { entryCount: row.entry_count, accountCount: row.account_count }]),
  )
}

// Sizes: created with their first price.
export const createSize = (sizeMm: number, month: string, centavos: number) =>
  call('create_anillado_size', { p_size_mm: sizeMm, p_from: month, p_price_centavos: centavos })
export const archiveSize = (sizeMm: number, month: string) =>
  call('archive_anillado_size', { p_size_mm: sizeMm, p_from: month })
export const reactivateSize = (sizeMm: number) => call('reactivate_anillado_size', { p_size_mm: sizeMm })
// Only without entries (0023); its prices go with it.
export const deleteSize = (sizeMm: number) => call('delete_anillado_size', { p_size_mm: sizeMm })

// Per size: how many entries use it (0023).
export async function fetchSizeUsage(): Promise<Map<number, number>> {
  const rows = (await call('list_size_usage', {})) as { size_mm: number; entry_count: number }[]
  return new Map(rows.map((row) => [row.size_mm, row.entry_count]))
}

// Descriptions: old = null for a new one, otherwise the text being changed.
export const saveCommonDescription = (old: string | null, description: string, areaIds: number[]) =>
  call('save_common_description', { p_old: old, p_description: description, p_area_ids: areaIds })
export const deleteCommonDescription = (description: string) =>
  call('delete_common_description', { p_description: description })
export const saveVagueDescription = (old: string | null, description: string) =>
  call('save_vague_description', { p_old: old, p_description: description })
export const deleteVagueDescription = (description: string) =>
  call('delete_vague_description', { p_description: description })

// The error codes of the list functions (0021), worded for the operator. period_locked here is
// the period an archive or a new size starts from.
export const LIST_MESSAGES: Record<string, string> = {
  ...PRICE_MESSAGES,
  period_locked: 'Solo se puede elegir el periodo actual o el anterior. Recargue la página.',
  name_required: 'Escriba el nombre.',
  area_name_taken: 'Ya existe un área con ese nombre (puede estar archivada).',
  area_invalid: 'Una de las áreas ya no existe o está archivada. Recargue la página.',
  areas_required: 'Elija al menos un área.',
  area_has_entries: 'Esta área tiene pedidos: solo se puede archivar.',
  area_has_accounts:
    'Hay cuentas con esta área. Quítela de esas cuentas en «Cuentas» y vuelva a intentarlo.',
  area_in_use:
    'Hay pedidos con esta área en ese periodo o después. Cámbielos de área primero, o archívela desde un periodo posterior.',
  anillado_size_has_entries: 'Este tamaño tiene pedidos: solo se puede archivar.',
  anillado_size_in_use:
    'Hay pedidos con este tamaño en ese periodo o después. Cámbielos primero, o archívelo desde un periodo posterior.',
  size_invalid: 'Escriba el tamaño en milímetros: un número entero mayor que cero.',
  size_taken: 'Ese tamaño ya existe (puede estar archivado: reactívelo).',
  description_required: 'Escriba la descripción.',
  description_taken: 'Esa descripción ya está en la lista.',
  description_missing: 'Esa descripción ya no existe. Recargue la página.',
  description_in_both_lists:
    'Esa descripción está en la otra lista. Una descripción no puede ser usual y demasiado vaga a la vez.',
}

// A Spanish message for the operator, from whatever was thrown.
export function listErrorMessage(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  return LIST_MESSAGES[message] ?? errorDetail(error)
}
