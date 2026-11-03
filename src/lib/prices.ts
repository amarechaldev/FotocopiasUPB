import type { Prices } from '../domain/globalReport'
import { supabase } from './supabase'

// The copy price (0013, logged-in operator only) and the price of each anillado size (0001).
export async function fetchPrices(): Promise<Prices> {
  const [copy, sizes] = await Promise.all([
    supabase.from('copy_price').select('price_centavos').maybeSingle(),
    supabase.from('anillado_sizes').select('size_mm, price_centavos'),
  ])
  if (copy.error) throw copy.error
  if (sizes.error) throw sizes.error
  if (!copy.data) throw new Error('Falta el precio de la copia en la base de datos.')
  return {
    copiaCentavos: copy.data.price_centavos,
    anilladoCentavos: new Map(sizes.data.map((row) => [row.size_mm, row.price_centavos])),
  }
}
