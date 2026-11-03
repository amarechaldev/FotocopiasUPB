// The global report (story #8): one row per department with its amounts, signed by the
// department managers. Derived from the detailed report, so both reports always agree.
// Money in integer centavos; formatted as Bs only when drawn.

import type { DetailedReport, ReportRange, ReportTotals } from './detailedReport'

export type Prices = {
  copiaCentavos: number
  anilladoCentavos: Map<number, number> // by size in mm
}

export type GlobalReportAmounts = {
  copias: number
  copiasCentavos: number
  anillados: number // how many, whatever their size
  anilladosCentavos: number
  totalCentavos: number
}

export type GlobalReportRow = GlobalReportAmounts & { areaId: number; areaName: string }

export type GlobalReport = {
  range: ReportRange
  rows: GlobalReportRow[] // every department, in the order of the monthly report
  totals: GlobalReportAmounts // each column added up
}

function amountsOf(totals: ReportTotals, prices: Prices): GlobalReportAmounts {
  let anillados = 0
  let anilladosCentavos = 0
  for (const { sizeMm, quantity } of totals.anillados) {
    const price = prices.anilladoCentavos.get(sizeMm)
    // Billing it at 0 would undercharge without anyone noticing.
    if (price === undefined) throw new Error(`No hay precio para el anillado de ${sizeMm} mm.`)
    anillados += quantity
    anilladosCentavos += quantity * price
  }
  const copiasCentavos = totals.copias * prices.copiaCentavos
  return {
    copias: totals.copias,
    copiasCentavos,
    anillados,
    anilladosCentavos,
    totalCentavos: copiasCentavos + anilladosCentavos,
  }
}

function sum(rows: GlobalReportAmounts[], field: keyof GlobalReportAmounts): number {
  return rows.reduce((total, row) => total + row[field], 0)
}

export function buildGlobalReport(detailed: DetailedReport, prices: Prices): GlobalReport {
  const rows = detailed.departments.map((section) => ({
    areaId: section.areaId,
    areaName: section.areaName,
    ...amountsOf(section.totals, prices),
  }))
  // From the rows, so the bottom line is exactly the sum of each column.
  const totals: GlobalReportAmounts = {
    copias: sum(rows, 'copias'),
    copiasCentavos: sum(rows, 'copiasCentavos'),
    anillados: sum(rows, 'anillados'),
    anilladosCentavos: sum(rows, 'anilladosCentavos'),
    totalCentavos: sum(rows, 'totalCentavos'),
  }
  return { range: detailed.range, rows, totals }
}
