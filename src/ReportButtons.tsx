import { useState } from 'react'
import { todayInBolivia } from './domain/dates'
import { buildDetailedReport, reportRange } from './domain/detailedReport'
import { buildGlobalReport } from './domain/globalReport'
import type { BillingPeriod } from './domain/periods'
import { fetchEntries } from './lib/adminEntries'
import { adminErrorMessage } from './lib/adminErrors'
import type { Area } from './lib/entries'
import { fetchPrices } from './lib/prices'

type Props = {
  period: BillingPeriod // the period shown in the list
  areas: Area[] // every active department, in the order of the monthly report
}

type Report = 'detailed' | 'global'

type Status =
  | { kind: 'idle' }
  | { kind: 'generating'; report: Report }
  | { kind: 'failed'; message: string }

const LABELS: Record<Report, string> = {
  detailed: 'Reporte detallado (PDF)',
  global: 'Reporte global (PDF)',
}

// Fetched again (not the list's copy), so the report is up to date. Prices are the period's own.
async function downloadReport(report: Report, period: BillingPeriod, areas: Area[]): Promise<void> {
  const generatedAt = new Date()
  const range = reportRange(period, todayInBolivia())
  const [entries, prices] = await Promise.all([
    fetchEntries(range),
    report === 'global' ? fetchPrices(period.month) : null,
  ])
  const detailed = buildDetailedReport(entries, areas, range)
  // Only now: the PDF code and its library are loaded the first time a report is made.
  const { downloadPdf } = await import('./reports/pdf')
  if (prices) {
    const global = buildGlobalReport(detailed, prices)
    const { globalReportDocument, globalReportFileName } = await import('./reports/globalReportPdf')
    await downloadPdf(
      globalReportDocument(global, period, generatedAt),
      globalReportFileName(global, period),
    )
  } else {
    const { detailedReportDocument, detailedReportFileName } = await import('./reports/detailedReportPdf')
    await downloadPdf(
      detailedReportDocument(detailed, period, generatedAt),
      detailedReportFileName(detailed, period),
    )
  }
}

// The PDF reports of the period shown, whole, even while it is still open.
export function ReportButtons({ period, areas }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function generate(report: Report) {
    setStatus({ kind: 'generating', report })
    try {
      await downloadReport(report, period, areas)
      setStatus({ kind: 'idle' })
    } catch (error) {
      setStatus({ kind: 'failed', message: adminErrorMessage(error) })
    }
  }

  const reports: Report[] = ['detailed', 'global']
  return (
    <div className="reports">
      {reports.map((report) => (
        <button
          key={report}
          type="button"
          className="secondary"
          disabled={status.kind === 'generating' || areas.length === 0}
          onClick={() => generate(report)}
        >
          {status.kind === 'generating' && status.report === report ? 'Generando…' : LABELS[report]}
        </button>
      ))}
      {status.kind === 'failed' && (
        <div className="message error" role="alert">
          <strong>✗ No se pudo generar el reporte</strong>
          <p>{status.message}</p>
        </div>
      )}
    </div>
  )
}
