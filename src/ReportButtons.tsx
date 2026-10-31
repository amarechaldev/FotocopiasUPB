import { useState } from 'react'
import { todayInBolivia } from './domain/dates'
import { buildDetailedReport, reportRange } from './domain/detailedReport'
import type { Period } from './domain/periods'
import { fetchEntries } from './lib/adminEntries'
import { adminErrorMessage } from './lib/adminErrors'
import type { Area } from './lib/entries'

type Props = {
  period: Period // the period shown in the list
  areas: Area[] // every active department, in the order of the monthly report
}

type Status = { kind: 'idle' } | { kind: 'generating' } | { kind: 'failed'; message: string }

// The PDF reports of the period shown. A current period is reported up to today.
export function ReportButtons({ period, areas }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function generateDetailed() {
    setStatus({ kind: 'generating' })
    try {
      // Fetched again (not the list's copy): the report stops at today, and must be up to date.
      const range = reportRange(period, todayInBolivia())
      const entries = await fetchEntries(range)
      const report = buildDetailedReport(entries, areas, range)
      // Only now: the PDF code and its library are loaded the first time a report is made.
      const [{ detailedReportDocument, detailedReportFileName }, { downloadPdf }] = await Promise.all([
        import('./reports/detailedReportPdf'),
        import('./reports/pdf'),
      ])
      await downloadPdf(
        detailedReportDocument(report, period, new Date()),
        detailedReportFileName(report, period),
      )
      setStatus({ kind: 'idle' })
    } catch (error) {
      setStatus({ kind: 'failed', message: adminErrorMessage(error) })
    }
  }

  return (
    <div className="reports">
      <button
        type="button"
        className="secondary"
        disabled={status.kind === 'generating' || areas.length === 0}
        onClick={generateDetailed}
      >
        {status.kind === 'generating' ? 'Generando…' : 'Reporte detallado (PDF)'}
      </button>
      {status.kind === 'failed' && (
        <div className="message error" role="alert">
          <strong>✗ No se pudo generar el reporte</strong>
          <p>{status.message}</p>
        </div>
      )}
    </div>
  )
}
