import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import { formatDate, formatDateTime } from '../domain/dates'
import type { DetailedReport, ReportTotals } from '../domain/detailedReport'
import { describeAnillados } from '../domain/entryList'
import type { Period } from '../domain/periods'

// The detailed report as a pdfmake document: a plain description of the pages, built here
// without pdfmake itself, so it can be tested. Letter paper, one department per page
// (user, 31/10/2026), then the totals of the period.

const MARGIN = 40 // points: 72 = 1 inch

function anilladosText(totals: ReportTotals): string {
  return totals.anillados.length > 0 ? describeAnillados(totals.anillados) : '—'
}

// "23/10/2026 – 22/11/2026", and for an open period: "Parcial: pedidos hasta el 31/10/2026".
function periodLines(report: DetailedReport, period: Period): string[] {
  const lines = [`Periodo ${formatDate(period.start)} – ${formatDate(period.end)}`]
  if (report.range.partial) lines.push(`Parcial: pedidos hasta el ${formatDate(report.range.end)}`)
  return lines
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
      { text: String(entry.copias), alignment: 'right' },
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
      { text: String(section.totals.copias), alignment: 'right', bold: true },
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
            ['Pedidos', String(entryCount)],
            ['Copias', String(report.totals.copias)],
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
    header: {
      margin: [MARGIN, 24, MARGIN, 0],
      columns: [
        { text: 'Fotocopias UPB · Reporte detallado', bold: true },
        { text: periodLines(report, period).join('\n'), alignment: 'right' },
      ],
    },
    footer: (currentPage, pageCount) => ({
      margin: [MARGIN, 16, MARGIN, 0],
      fontSize: 8,
      columns: [
        `Generado el ${formatDateTime(generatedAt)}`,
        { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right' },
      ],
    }),
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
  const day = (date: string) => formatDate(date).replaceAll('/', '-')
  const partial = report.range.partial ? '_parcial' : ''
  return `reporte-detallado_${day(period.start)}_${day(period.end)}${partial}.pdf`
}
