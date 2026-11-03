import type { TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { GlobalReport, GlobalReportAmounts } from '../domain/globalReport'
import { formatAmount, formatQuantity } from '../domain/money'
import type { Period } from '../domain/periods'
import { MARGIN, pageFooter, pageHeader, reportFileName } from './common'

// The global report as a pdfmake document: one row per department and the totals, on one
// letter page signed by the department managers. Nothing is drawn below the table: the rest of
// the page is the space for signatures, without lines or labels (PO).

// Numbers are right-aligned and never wrap: the thin space between thousands may break a line.
function amountCells(amounts: GlobalReportAmounts, bold = false): TableCell[] {
  return [
    formatQuantity(amounts.copias),
    formatAmount(amounts.copiasCentavos),
    formatQuantity(amounts.anillados),
    formatAmount(amounts.anilladosCentavos),
    formatAmount(amounts.totalCentavos),
  ].map((text): TableCell => ({ text, alignment: 'right', noWrap: true, bold }))
}

export function globalReportDocument(
  report: GlobalReport,
  period: Period,
  generatedAt: Date,
): TDocumentDefinitions {
  const header: TableCell[] = [
    { text: 'Área', style: 'tableHeader' },
    ...['Copias', 'Copias Bs', 'Anillados', 'Anillados Bs', 'Total Bs'].map(
      (text): TableCell => ({ text, style: 'tableHeader', alignment: 'right' }),
    ),
  ]
  const rows = report.rows.map((row): TableCell[] => [row.areaName, ...amountCells(row)])
  const total: TableCell[] = [
    { text: 'Total', bold: true },
    ...amountCells(report.totals, true),
  ]

  return {
    pageSize: 'LETTER',
    pageOrientation: 'portrait',
    pageMargins: [MARGIN, 70, MARGIN, 50],
    header: pageHeader('Reporte global', report.range, period),
    footer: pageFooter(generatedAt),
    content: [
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: ['*', 60, 75, 60, 80, 80],
          body: [header, ...rows, total],
        },
        layout: 'lightHorizontalLines',
        unbreakable: true, // the whole table on one page
      },
    ],
    defaultStyle: { font: 'Roboto', fontSize: 11 },
    styles: {
      tableHeader: { bold: true },
    },
  }
}

// e.g. reporte-global_23-10-2026_22-11-2026_parcial.pdf
export function globalReportFileName(report: GlobalReport, period: Period): string {
  return reportFileName('reporte-global', report.range, period)
}
