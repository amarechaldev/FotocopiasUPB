import type { Account } from './accounts'
import { ADMIN_MESSAGES } from './adminErrors'
import { errorDetail } from './errorDetail'
import { SAVE_TIMEOUT_MS } from './entries'
import { supabase } from './supabase'

// The operator's access to staff accounts (migration 0018). Admins only: anyone else gets
// 'not_admin'. PINs never come back, not even to her.

export type AdminAccount = Account & {
  archived: boolean
  entryCount: number // 0: the account can be deleted
}

type AdminAccountRow = {
  id: number
  name: string
  area_ids: number[]
  default_area_id: number
  archived: boolean
  pin_reset_pending: boolean
  entry_count: number
}

// Every account, archived ones included, sorted by name.
export async function fetchAdminAccounts(): Promise<AdminAccount[]> {
  const { data, error } = await supabase
    .rpc('list_accounts_admin')
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  return (data as AdminAccountRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    areaIds: row.area_ids,
    defaultAreaId: row.default_area_id,
    archived: row.archived,
    pinResetPending: row.pin_reset_pending,
    // The staff form's concern (#115); her screens show the departments themselves.
    defaultAreaArchived: false,
    archivedAreaNames: [],
    entryCount: row.entry_count,
  }))
}

export type AccountChanges = {
  name: string
  areaIds: number[]
  defaultAreaId: number
}

// Name, departments and default department. The new name also goes on all the account's entries.
export async function updateAccount(id: number, changes: AccountChanges): Promise<void> {
  await call('update_account', {
    p_account_id: id,
    p_name: changes.name,
    p_area_ids: changes.areaIds,
    p_default_area_id: changes.defaultAreaId,
  })
}

// true: the person must choose a new PIN on the shared device; false: cancel, the old PIN is back.
export async function setPinReset(id: number, pending: boolean): Promise<void> {
  await call('set_pin_reset', { p_account_id: id, p_pending: pending })
}

export async function setAccountArchived(id: number, archived: boolean): Promise<void> {
  await call('set_account_archived', { p_account_id: id, p_archived: archived })
}

// Only an account without entries ('account_has_entries' otherwise).
export async function deleteAccount(id: number): Promise<void> {
  await call('delete_account', { p_account_id: id })
}

async function call(fn: string, args: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.rpc(fn, args).abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
}

// The error codes of the account functions, worded for the operator. account_invalid means a
// missing account here, not "choose a name" as in the entry editor.
export const ACCOUNT_ADMIN_MESSAGES: Record<string, string> = {
  ...ADMIN_MESSAGES,
  name_required: 'Escriba el nombre.',
  name_taken: 'Ya existe una cuenta con ese nombre (puede ser una cuenta archivada).',
  areas_required: 'Elija al menos un área.',
  default_invalid: 'Elija el área principal.',
  area_invalid: 'Una de las áreas ya no está disponible. Recargue la página.',
  account_invalid: 'Esta cuenta ya no existe. Recargue la página.',
  account_has_entries: 'Esta cuenta tiene pedidos: solo se puede archivar.',
}

// A Spanish message for the operator, from whatever was thrown.
export function accountAdminErrorMessage(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : ''
  return ACCOUNT_ADMIN_MESSAGES[message] ?? errorDetail(error)
}
