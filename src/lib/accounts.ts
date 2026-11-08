import { SAVE_TIMEOUT_MS } from './entries'
import { supabase } from './supabase'

export type Account = {
  id: number
  name: string
  areaIds: number[]
  defaultAreaId: number
  pinResetPending: boolean // the operator launched a PIN reset: a new PIN must be chosen (#31)
  // Departments archived by the operator (#33, #115): the main one must be replaced before
  // registering; the others are a warning, shown until dismissed.
  defaultAreaArchived: boolean
  archivedAreaNames: string[]
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
  default_area_archived: boolean
  archived_area_names: string[]
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
    defaultAreaArchived: row.default_area_archived ?? false,
    archivedAreaNames: row.archived_area_names ?? [],
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

// "Mi cuenta" (#30, migration 0019): name + PIN is the login, checked again by every call.
// Errors: account_invalid, pin_reset_pending, pin_wrong (see ownAccountErrorMessage).
export async function checkOwnPin(accountId: number, pin: string): Promise<void> {
  const { error } = await supabase
    .rpc('check_own_pin', { p_account_id: accountId, p_pin: pin })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
}

export type OwnAccountChanges = {
  name: string
  areaIds: number[]
  defaultAreaId: number
  newPin: string | null // null: keep the current PIN; already typed twice
}

// Saves the person's own name and departments, and the PIN if a new one is given. The new name
// also goes on all their entries. Same errors as checkOwnPin and createAccount.
export async function updateOwnAccount(
  accountId: number,
  pin: string,
  changes: OwnAccountChanges,
): Promise<void> {
  const { error } = await supabase
    .rpc('update_own_account', {
      p_account_id: accountId,
      p_pin: pin,
      p_name: changes.name,
      p_area_ids: changes.areaIds,
      p_default_area_id: changes.defaultAreaId,
      p_new_pin: changes.newPin,
    })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
}

// The person has seen the warning about their archived departments (migration 0021). No PIN: it
// only hides a message.
export async function dismissAreaNotices(accountId: number): Promise<void> {
  const { error } = await supabase
    .rpc('dismiss_area_notices', { p_account_id: accountId })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
}
