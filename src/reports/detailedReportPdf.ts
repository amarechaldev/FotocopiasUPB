import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import { formatDate } from '../domain/dates'
import type { DetailedReport, ReportTotals } from '../domain/detailedReport'
import { describeAnillados } from '../domain/entryList'
import { formatQuantity } from '../domain/money'
import type { Period } from '../domain/periods'
import { MARGIN, pageFooter, pageHeader, reportFileName } from './common'

// The detailed report as a pdfmake document: a plain description of the pages, built here
// without pdfmake itself, so it can be tested. Letter paper, one page per department with entries
// (user, 31/10/2026; #82), then the totals of the period.

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
  // Only departments with entries: no empty pages (#82). The global report still lists them all.
  const withEntries = report.departments.filter((section) => section.entries.length > 0)
  const departmentPages: Content[] = withEntries.map((section, index) => {
    const rows: TableCell[][] = section.entries.map((entry) => [
      formatDate(entry.entryDate),
      entry.areaName,
      entry.name,
      entry.description,
      copiasCell(entry.copias),
      describeAnillados(entry.anillados),
    ])
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
            // Column titles repeated if a department needs more than one page.
            headerRows: 1,
            widths: [52, 72, '*', '*', 40, 80],
            body: [headerRow(), ...rows, total],
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
    // A period without entries: the totals page alone, not after an empty one.
    pageBreak: departmentPages.length > 0 ? 'before' : undefined,
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
