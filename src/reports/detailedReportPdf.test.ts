import type { DynamicContent } from 'pdfmake/interfaces'
import { describe, expect, test } from 'vitest'
import { buildDetailedReport, type ReportRange } from '../domain/detailedReport'
import type { ListedEntry } from '../domain/entryList'
import { detailedReportDocument, detailedReportFileName } from './detailedReportPdf'

const period = { start: '2026-10-23', end: '2026-11-22' }
const areas = [
  { id: 1, name: 'VRA' },
  { id: 2, name: 'Administración' },
  { id: 10, name: 'DAAE Cultura' },
]
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
  copias: 50,
  anillados: [{ sizeMm: 12, quantity: 2 }],
}

function documentFor(range: ReportRange) {
  return detailedReportDocument(
    buildDetailedReport([entry], areas, range),
    period,
    new Date('2026-10-31T15:30:00Z'),
  )
}

const closed = { ...period, partial: false }
const open = { ...period, partial: true }

describe('detailedReportDocument', () => {
  test('letter paper, one page per department, then the totals page', () => {
    const doc = documentFor(closed)
    expect(doc.pageSize).toBe('LETTER')
    const pages = doc.content as { pageBreak?: string }[]
    expect(pages).toHaveLength(areas.length + 1)
    expect(pages.map((page) => page.pageBreak)).toEqual([undefined, 'before', 'before', 'before'])
    expect(JSON.stringify(pages.at(-1))).toContain('Totales del periodo')
  })

  test('departments in the order of the monthly report', () => {
    const titles = (documentFor(closed).content as { stack: { text: string }[] }[])
      .slice(0, -1)
      .map((page) => page.stack[0].text)
    expect(titles).toEqual(['VRA', 'Administración', 'DAAE Cultura'])
  })

  test('an entry row in dd/mm/yyyy, anillados as in the list, and the department total', () => {
    const vra = JSON.stringify((documentFor(closed).content as unknown[])[0])
    expect(vra).toContain('25/10/2026')
    expect(vra).toContain('2 × 12 mm')
    expect(vra).toContain('Total VRA')
  })

  test('column titles on every department with entries, each table with its own row', () => {
    const doc = detailedReportDocument(
      buildDetailedReport([entry, { ...entry, id: 2, areaId: 10, areaName: 'DAAE Cultura' }], areas, closed),
      period,
      new Date(),
    )
    type Page = { stack: [unknown, { table: { headerRows: number; body: { text?: string }[][] } }] }
    const tables = (doc.content as Page[]).slice(0, -1).map((page) => page.stack[1].table)
    const [vra, administracion, cultura] = tables
    expect([vra.headerRows, administracion.headerRows, cultura.headerRows]).toEqual([1, 0, 1])
    expect(vra.body[0][0].text).toBe('Fecha')
    expect(cultura.body[0][0].text).toBe('Fecha')
    expect(administracion.body[0][0].text).toBe('Sin pedidos en este periodo.')
    // pdfmake writes into the cells it draws: a shared row would only show in the first table.
    expect(cultura.body[0]).not.toBe(vra.body[0])
  })

  test('copias with a thin space between thousands, in rows, department total and period totals', () => {
    const doc = detailedReportDocument(
      buildDetailedReport([{ ...entry, copias: 41_184 }], areas, closed),
      period,
      new Date(),
    )
    const vra = JSON.stringify((doc.content as unknown[])[0])
    expect(vra.match(/41 184/g)).toHaveLength(2) // the entry and "Total VRA"
    expect(JSON.stringify((doc.content as unknown[]).at(-1))).toContain('41 184')
  })

  test('a department without entries says so', () => {
    const administracion = JSON.stringify((documentFor(closed).content as unknown[])[1])
    expect(administracion).toContain('Sin pedidos en este periodo.')
  })

  test('the header shows the period, and "Parcial" only while it is open', () => {
    expect(JSON.stringify(documentFor(closed).header)).toContain('Periodo 23/10/2026 – 22/11/2026')
    expect(JSON.stringify(documentFor(closed).header)).not.toContain('Parcial')
    expect(JSON.stringify(documentFor(open).header)).toContain('Parcial: el periodo sigue abierto')
  })

  test('the footer numbers the pages and says when it was generated (Bolivian time)', () => {
    const footer = documentFor(closed).footer as DynamicContent
    const text = JSON.stringify(footer(2, 4, { width: 612, height: 792, orientation: 'portrait' }))
    expect(text).toContain('Página 2 de 4')
    expect(text).toContain('Generado el 31/10/2026 11:30')
  })
})

describe('detailedReportFileName', () => {
  test('the period dates, and _parcial while it is open', () => {
    const report = buildDetailedReport([], areas, closed)
    expect(detailedReportFileName(report, period)).toBe('reporte-detallado_23-10-2026_22-11-2026.pdf')
    const partial = buildDetailedReport([], areas, open)
    expect(detailedReportFileName(partial, period)).toBe(
      'reporte-detallado_23-10-2026_22-11-2026_parcial.pdf',
    )
  })
})
