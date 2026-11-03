import type { ContentTable, TableCell } from 'pdfmake/interfaces'
import { describe, expect, test } from 'vitest'
import { buildDetailedReport, type ReportRange } from '../domain/detailedReport'
import type { ListedEntry } from '../domain/entryList'
import { buildGlobalReport, type Prices } from '../domain/globalReport'
import { globalReportDocument, globalReportFileName } from './globalReportPdf'

const period = { start: '2026-10-23', end: '2026-11-22' }
const areas = [
  { id: 1, name: 'VRA' },
  { id: 2, name: 'Administración' },
]
const prices: Prices = { copiaCentavos: 30, anilladoCentavos: new Map([[9, 450]]) }
const entry: ListedEntry = {
  id: 1,
  entryDate: '2026-10-25',
  createdAt: new Date('2026-10-25T14:00:00Z'),
  modifiedAt: null,
  manual: false,
  areaId: 1,
  areaName: 'VRA',
  accountId: 1,
  name: 'Ana Pérez',
  description: 'Cartas',
  copias: 3_497,
  anillados: [{ sizeMm: 9, quantity: 1 }],
}

const closed: ReportRange = { ...period, partial: false }
const open: ReportRange = { start: '2026-10-23', end: '2026-10-31', partial: true }

function documentFor(range: ReportRange) {
  const report = buildGlobalReport(buildDetailedReport([entry], areas, range), prices)
  return globalReportDocument(report, period, new Date('2026-10-31T15:30:00Z'))
}

// The table's rows as plain text, the thin space between thousands written as _.
function rows(range = closed): string[][] {
  const content = documentFor(range).content as ContentTable[]
  return content[0].table.body.map((row) =>
    row.map((cell: TableCell) =>
      String(typeof cell === 'object' && cell !== null && 'text' in cell ? cell.text : cell).replaceAll(
        ' ',
        '_',
      ),
    ),
  )
}

describe('globalReportDocument', () => {
  test('letter paper, one table that is never split across pages', () => {
    const doc = documentFor(closed)
    expect(doc.pageSize).toBe('LETTER')
    const content = doc.content as ContentTable[]
    expect(content).toHaveLength(1)
    expect(content[0].unbreakable).toBe(true)
  })

  test('the column titles, one row per department in order, then the totals', () => {
    expect(rows().map((row) => row[0])).toEqual(['Área', 'VRA', 'Administración', 'Total'])
    expect(rows()[0]).toEqual(['Área', 'Copias', 'Copias Bs', 'Anillados', 'Anillados Bs', 'Total Bs'])
  })

  test('amounts with a comma and two decimals, thousands apart', () => {
    expect(rows()[1]).toEqual(['VRA', '3_497', '1_049,10', '1', '4,50', '1_053,60'])
  })

  test('a department without entries is a row of zeros', () => {
    expect(rows()[2]).toEqual(['Administración', '0', '0,00', '0', '0,00', '0,00'])
  })

  test('the totals row adds up each column', () => {
    expect(rows().at(-1)).toEqual(['Total', '3_497', '1_049,10', '1', '4,50', '1_053,60'])
  })

  test('the header shows the period, and "Parcial" only while it is open', () => {
    expect(JSON.stringify(documentFor(closed).header)).toContain('Periodo 23/10/2026 – 22/11/2026')
    expect(JSON.stringify(documentFor(closed).header)).not.toContain('Parcial')
    expect(JSON.stringify(documentFor(open).header)).toContain('Parcial: pedidos hasta el 31/10/2026')
  })
})

describe('globalReportFileName', () => {
  test('the period dates, and _parcial while it is open', () => {
    const name = (range: ReportRange) =>
      globalReportFileName(buildGlobalReport(buildDetailedReport([], areas, range), prices), period)
    expect(name(closed)).toBe('reporte-global_23-10-2026_22-11-2026.pdf')
    expect(name(open)).toBe('reporte-global_23-10-2026_22-11-2026_parcial.pdf')
  })
})
