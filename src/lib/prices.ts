import type { Prices } from '../domain/globalReport'
import { pricesForPeriod } from '../domain/prices'
import { supabase } from './supabase'

// The copy and anillado prices in effect for the period named `month` (0020, logged-in operator only).
export async function fetchPrices(month: string): Promise<Prices> {
  const [copy, anillados] = await Promise.all([
    supabase.from('copy_prices').select('from_month, price_centavos'),
    supabase.from('anillado_prices').select('size_mm, from_month, price_centavos'),
  ])
  if (copy.error) throw copy.error
  if (anillados.error) throw anillados.error
  return pricesForPeriod(
    copy.data.map((row) => ({ fromMonth: row.from_month, priceCentavos: row.price_centavos })),
    anillados.data.map((row) => ({
      sizeMm: row.size_mm,
      fromMonth: row.from_month,
      priceCentavos: row.price_centavos,
    })),
    month,
  )
}
