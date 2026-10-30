import type { BillingPeriod } from '../domain/periods'
import { SAVE_TIMEOUT_MS } from './entries'
import { supabase } from './supabase'

// Billing periods (migrations 0011 and 0012). Admins only: anyone else gets 'not_admin', and the other
// error codes are listed in adminErrors.ts.

type PeriodRow = {
  month: string
  start_date: string
  end_date: string
  is_current: boolean
  changeable: boolean
  earliest_end: string
  latest_end: string
}

// From the first period up to the one after the current period, oldest first.
export async function fetchPeriods(): Promise<BillingPeriod[]> {
  const { data, error } = await supabase
    .rpc('list_periods')
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  return (data as PeriodRow[]).map((row) => ({
    month: row.month,
    start: row.start_date,
    end: row.end_date,
    isCurrent: row.is_current,
    changeable: row.changeable,
    earliestEnd: row.earliest_end,
    latestEnd: row.latest_end,
  }))
}

// Moves the end of a period (the next one then starts the day after).
export async function setPeriodEnd(month: string, end: string): Promise<void> {
  const { error } = await supabase
    .rpc('set_period_end', { p_month: month, p_end: end })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
}
