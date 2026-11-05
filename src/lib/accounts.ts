import { SAVE_TIMEOUT_MS } from './entries'
import { supabase } from './supabase'

export type Account = {
  id: number
  name: string
  areaIds: number[]
  defaultAreaId: number
  pinResetPending: boolean // the operator launched a PIN reset: a new PIN must be chosen (#31)
}

export type NewAccount = {
  name: string
  pin: string // 4 digits, as text
  areaIds: number[]
  defaultAreaId: number
}

type AccountRow = {
  id: number
  name: string
  area_ids: number[]
  default_area_id: number
  pin_reset_pending: boolean
}

// Creates the account and returns its id. The PIN is hashed by the database;
// errors come back as codes (see accountErrorMessage).
export async function createAccount(account: NewAccount): Promise<number> {
  const { data, error } = await supabase
    .rpc('create_account', {
      p_name: account.name,
      p_pin: account.pin,
      p_area_ids: account.areaIds,
      p_default_area_id: account.defaultAreaId,
    })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  return data
}

// All accounts, sorted by name, with their departments (never the PIN).
export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase.rpc('list_accounts')
  if (error) throw error
  return (data as AccountRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    areaIds: row.area_ids,
    defaultAreaId: row.default_area_id,
    pinResetPending: row.pin_reset_pending,
  }))
}

// After a PIN reset by the operator (migration 0018): the new PIN, already typed twice.
// Errors: account_invalid, pin_reset_not_pending, pin_invalid (see entryErrorMessage).
export async function setNewPin(accountId: number, pin: string): Promise<void> {
  const { error } = await supabase
    .rpc('set_new_pin', { p_account_id: accountId, p_pin: pin })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
}
