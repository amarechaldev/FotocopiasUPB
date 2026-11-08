// Prices start from a period (migration 0020, story #33): the price of a period is the one with the
// latest start on or before it, so a change never alters the reports of earlier periods.
// Months are ISO dates of a period's name (its first day, e.g. 2026-11-01), which compare as text.

import type { Prices } from './globalReport'

export type CopyPriceRow = { fromMonth: string; priceCentavos: number }
export type AnilladoPriceRow = CopyPriceRow & { sizeMm: number }

// The row in effect for the period of `month`, or undefined if every row starts later.
export function inEffect<R extends CopyPriceRow>(rows: R[], month: string): R | undefined {
  let found: R | undefined
  for (const row of rows) {
    if (row.fromMonth <= month && (!found || row.fromMonth > found.fromMonth)) found = row
  }
  return found
}

// A size with no price yet for the period is left out: the global report refuses to bill it at 0.
export function pricesForPeriod(
  copyRows: CopyPriceRow[],
  anilladoRows: AnilladoPriceRow[],
  month: string,
): Prices {
  const copy = inEffect(copyRows, month)
  if (!copy) throw new Error('Falta el precio de la copia para este periodo en la base de datos.')
  const anilladoCentavos = new Map<number, number>()
  for (const sizeMm of new Set(anilladoRows.map((row) => row.sizeMm))) {
    const price = inEffect(anilladoRows.filter((row) => row.sizeMm === sizeMm), month)
    if (price) anilladoCentavos.set(sizeMm, price.priceCentavos)
  }
  return { copiaCentavos: copy.priceCentavos, anilladoCentavos }
}

// A price typed by the operator, in Bs, into centavos: "1.50", "1,50", "1,5" and "2" are all
// accepted (a comma is usual in Bolivia). Null unless it is a positive amount with at most two
// decimals. Parsed as text, never as a float, so 0.29 cannot become 28 centavos.
export function parseBs(text: string): number | null {
  const match = /^(\d{1,6})(?:[.,](\d{1,2}))?$/.exec(text.trim())
  if (!match) return null
  const centavos = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  return centavos > 0 ? centavos : null
}
