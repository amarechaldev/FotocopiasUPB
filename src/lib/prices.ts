import type { Prices } from '../domain/globalReport'
import { pricesForPeriod, type AnilladoPriceRow, type CopyPriceRow } from '../domain/prices'
import { ADMIN_MESSAGES } from './adminErrors'
import { SAVE_TIMEOUT_MS } from './entries'
import { errorDetail } from './errorDetail'
import { supabase } from './supabase'

// Prices by period (migration 0020), logged-in operator only.

export type PriceRows = { copy: CopyPriceRow[]; anillados: AnilladoPriceRow[] }

// Every price with the period it starts from.
export async function fetchPriceRows(): Promise<PriceRows> {
  const [copy, anillados] = await Promise.all([
    supabase.from('copy_prices').select('from_month, price_centavos'),
    supabase.from('anillado_prices').select('size_mm, from_month, price_centavos'),
  ])
  if (copy.error) throw copy.error
  if (anillados.error) throw anillados.error
  return {
    copy: copy.data.map((row) => ({ fromMonth: row.from_month, priceCentavos: row.price_centavos })),
    anillados: anillados.data.map((row) => ({
      sizeMm: row.size_mm,
      fromMonth: row.from_month,
      priceCentavos: row.price_centavos,
    })),
  }
}

// The copy and anillado prices in effect for the period named `month`.
export async function fetchPrices(month: string): Promise<Prices> {
  const rows = await fetchPriceRows()
  return pricesForPeriod(rows.copy, rows.anillados, month)
}

// A new price from the period named `month` (the current or the previous one).
export async function setCopyPrice(month: string, centavos: number): Promise<void> {
  const { error } = await supabase
    .rpc('set_copy_price', { p_from: month, p_price_centavos: centavos })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
}

export async function setAnilladoPrice(sizeMm: number, month: string, centavos: number): Promise<void> {
  const { error } = await supabase
    .rpc('set_anillado_price', { p_size_mm: sizeMm, p_from: month, p_price_centavos: centavos })
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
}

// The error codes of the price functions, worded for the operator. period_locked means the period a
// price starts from here, not a period's end as in adminErrors.ts.
export const PRICE_MESSAGES: Record<string, string> = {
  ...ADMIN_MESSAGES,
  period_locked: 'Un precio solo puede empezar en el periodo actual o en el anterior. Recargue la página.',
  price_not_positive: 'El precio debe ser mayor que cero.',
}

// A Spanish message for the operator, from whatever was thrown.
export function priceErrorMessage(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  return PRICE_MESSAGES[message] ?? errorDetail(error)
}
