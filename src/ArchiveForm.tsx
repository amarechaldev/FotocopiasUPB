import { useState, type FormEvent, type ReactNode } from 'react'
import { periodName, type BillingPeriod } from './domain/periods'
import { useScrolledIntoView } from './scrollToTop'
import { listErrorMessage } from './lib/lists'

type Props = {
  title: string // e.g. "Archivar el área Marketing"
  choices: BillingPeriod[] // the periods an archive can start from, current first
  children?: ReactNode // what she should know first (e.g. the accounts affected)
  archive: (month: string) => Promise<unknown>
  onCancel: () => void
  onDone: (period: BillingPeriod) => void
}

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'failed'; message: string }

// Archiving a department or an anillado size (#33): from the current or the previous period. Entries
// dated before keep it; from that period on it can no longer be used.
export function ArchiveForm({ title, choices, children, archive, onCancel, onDone }: Props) {
  const [month, setMonth] = useState(choices[0].month)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const panel = useScrolledIntoView<HTMLFormElement>()
  const period = choices.find((p) => p.month === month) ?? choices[0]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus({ kind: 'saving' })
    try {
      await archive(period.month)
      onDone(period)
    } catch (error) {
      setStatus({ kind: 'failed', message: listErrorMessage(error) })
    }
  }

  return (
    <form className="list-form" onSubmit={handleSubmit} ref={panel}>
      <strong>{title}</strong>

      {status.kind === 'failed' && (
        <div className="message error" role="alert">
          <strong>✗ No se archivó</strong>
          <p>{status.message}</p>
        </div>
      )}

      <p className="hint">
        No se podrá usar en pedidos desde el periodo que elija. Los pedidos anteriores la conservan, y
        se puede reactivar.
      </p>
      {children}

      <label>
        Desde el periodo
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          {choices.map((p) => (
            <option key={p.month} value={p.month}>
              {periodName(p)} {p.isCurrent ? '(actual)' : '(anterior)'}
            </option>
          ))}
        </select>
      </label>

      <div className="period-end-actions">
        <button type="submit" className="primary" disabled={status.kind === 'saving'}>
          {status.kind === 'saving' ? 'Archivando…' : 'Archivar'}
        </button>
        <button type="button" className="secondary" disabled={status.kind === 'saving'} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
