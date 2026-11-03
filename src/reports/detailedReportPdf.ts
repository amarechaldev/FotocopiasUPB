import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import { formatDate } from '../domain/dates'
import type { DetailedReport, ReportTotals } from '../domain/detailedReport'
import { describeAnillados } from '../domain/entryList'
import { formatQuantity } from '../domain/money'
import type { Period } from '../domain/periods'
import { MARGIN, pageFooter, pageHeader, reportFileName } from './common'

// The detailed report as a pdfmake document: a plain description of the pages, built here
// without pdfmake itself, so it can be tested. Letter paper, one department per page
// (user, 31/10/2026), then the totals of the period.

function anilladosText(totals: ReportTotals): string {
  return totals.anillados.length > 0 ? describeAnillados(totals.anillados) : '—'
}

// 41 184: right-aligned, and never wrapped at the thin space between thousands.
function copiasCell(copias: number): { text: string; alignment: 'right'; noWrap: true } {
  return { text: formatQuantity(copias), alignment: 'right', noWrap: true }
}

// A new row for each table: pdfmake writes its layout into the cells it draws, so a row shared
// by several tables is only drawn properly in the first one.
function headerRow(): TableCell[] {
  return ['Fecha', 'Área', 'Nombre', 'Descripción', 'Copias', 'Anillados'].map(
    (text): TableCell => ({ text, style: 'tableHeader' }),
  )
}

export function detailedReportDocument(
  report: DetailedReport,
  period: Period,
  generatedAt: Date,
): TDocumentDefinitions {
  const departmentPages: Content[] = report.departments.map((section, index) => {
    const hasEntries = section.entries.length > 0
    const rows: TableCell[][] = section.entries.map((entry) => [
      formatDate(entry.entryDate),
      entry.areaName,
      entry.name,
      entry.description,
      copiasCell(entry.copias),
      describeAnillados(entry.anillados),
    ])
    if (!hasEntries) {
      rows.push([{ text: 'Sin pedidos en este periodo.', colSpan: 6, italics: true }, '', '', '', '', ''])
    }
    const total: TableCell[] = [
      { text: `Total ${section.areaName}`, colSpan: 4, bold: true },
      '',
      '',
      '',
      { ...copiasCell(section.totals.copias), bold: true },
      { text: anilladosText(section.totals), bold: true },
    ]
    return {
      stack: [
        { text: section.areaName, style: 'department' },
        {
          table: {
            // Column titles on every page with entries: repeated if a department needs more
            // than one page; none for a department without entries.
            headerRows: hasEntries ? 1 : 0,
            widths: [52, 72, '*', '*', 40, 80],
            body: hasEntries ? [headerRow(), ...rows, total] : [...rows, total],
          },
          layout: 'lightHorizontalLines',
        },
      ],
      pageBreak: index > 0 ? 'before' : undefined,
    }
  })

  const entryCount = report.departments.reduce((sum, section) => sum + section.entries.length, 0)
  const totalsPage: Content = {
    stack: [
      { text: 'Totales del periodo', style: 'department' },
      {
        table: {
          widths: [120, '*'],
          body: [
            ['Pedidos', formatQuantity(entryCount)],
            ['Copias', formatQuantity(report.totals.copias)],
            ['Anillados', anilladosText(report.totals)],
          ],
        },
        layout: 'lightHorizontalLines',
      },
    ],
    pageBreak: 'before',
  }

  return {
    pageSize: 'LETTER',
    pageOrientation: 'portrait',
    pageMargins: [MARGIN, 70, MARGIN, 50],
    header: pageHeader('Reporte detallado', report.range, period),
    footer: pageFooter(generatedAt),
    content: [...departmentPages, totalsPage],
    defaultStyle: { font: 'Roboto', fontSize: 9 },
    styles: {
      department: { fontSize: 14, bold: true, margin: [0, 0, 0, 8] },
      tableHeader: { bold: true },
    },
  }
}

// e.g. reporte-detallado_23-10-2026_22-11-2026_parcial.pdf
export function detailedReportFileName(report: DetailedReport, period: Period): string {
  return reportFileName('reporte-detallado', report.range, period)
}
