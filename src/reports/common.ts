import type { Content, DynamicContent } from 'pdfmake/interfaces'
import { formatDate, formatDateTime } from '../domain/dates'
import type { ReportRange } from '../domain/detailedReport'
import type { Period } from '../domain/periods'

// What both reports share, so they look alike.

export const MARGIN = 40 // points: 72 = 1 inch

// "Periodo 23/10/2026 – 22/11/2026", and for an open period: "Parcial: pedidos hasta el 31/10/2026".
export function periodLines(range: ReportRange, period: Period): string[] {
  const lines = [`Periodo ${formatDate(period.start)} – ${formatDate(period.end)}`]
  if (range.partial) lines.push(`Parcial: pedidos hasta el ${formatDate(range.end)}`)
  return lines
}

// On every page: the report's name on the left, its dates on the right.
export function pageHeader(title: string, range: ReportRange, period: Period): Content {
  return {
    margin: [MARGIN, 24, MARGIN, 0],
    columns: [
      { text: `Fotocopias UPB · ${title}`, bold: true },
      { text: periodLines(range, period).join('\n'), alignment: 'right' },
    ],
  }
}

// When it was generated, so a reprint can be told apart, and the page numbers.
export function pageFooter(generatedAt: Date): DynamicContent {
  return (currentPage, pageCount) => ({
    margin: [MARGIN, 16, MARGIN, 0],
    fontSize: 8,
    columns: [
      `Generado el ${formatDateTime(generatedAt)}`,
      { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right' },
    ],
  })
}

// e.g. reporte-detallado_23-10-2026_22-11-2026_parcial.pdf
export function reportFileName(prefix: string, range: ReportRange, period: Period): string {
  const day = (date: string) => formatDate(date).replaceAll('/', '-')
  const partial = range.partial ? '_parcial' : ''
  return `${prefix}_${day(period.start)}_${day(period.end)}${partial}.pdf`
}
