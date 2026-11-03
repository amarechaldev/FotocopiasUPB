// How amounts and quantities are written in the reports (PO, 02/11/2026): a comma for decimals,
// a short space between thousands, two decimals for every amount: 12 519,70 and 41 184.

// U+2009, thin space: the built-in PDF font has no narrow no-break space (U+202F).
// It may break a line, so the cells that show numbers must not wrap.
const THIN_SPACE = ' '

// 1234567 → "1 234 567"
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+$)/g, THIN_SPACE)
}

// Whole numbers: copias, anillados.
export function formatQuantity(n: number): string {
  return (n < 0 ? '-' : '') + groupThousands(String(Math.abs(n)))
}

// Centavos as Bs, without "Bs" (the column title says it): 1251970 → "12 519,70".
// Integer arithmetic only, so no rounding can creep in.
export function formatAmount(centavos: number): string {
  const sign = centavos < 0 ? '-' : ''
  const abs = Math.abs(centavos)
  const bs = Math.trunc(abs / 100)
  const cents = String(abs % 100).padStart(2, '0')
  return `${sign}${groupThousands(String(bs))},${cents}`
}
