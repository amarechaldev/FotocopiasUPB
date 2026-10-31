import { useState, type FormEvent } from 'react'
import { formatDate, todayInBolivia } from './domain/dates'
import { hasEnded, nextAfterNewEnd, type BillingPeriod } from './domain/periods'
import { adminErrorMessage } from './lib/adminErrors'
import { setPeriodEnd } from './lib/periods'

type Props = {
  periods: BillingPeriod[] // the ones she can look at, oldest first, ending with the current one
  selected: BillingPeriod
  next: BillingPeriod | undefined // the period after the selected one, whose start a new end moves
  onSelect: (period: BillingPeriod) => void
  // The periods (and so the entries they contain) must be fetched again; stay on this month.
  onEndChanged: (month: string) => void
}

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'failed'; message: string }

// ‹ Anterior | 23/10/2026 – 22/11/2026 | Siguiente ›, and moving the end of the period shown.
export function PeriodBar({ periods, selected, next, onSelect, onEndChanged }: Props) {
  // The new end date while she is changing it, null = the form is closed.
  const [newEnd, setNewEnd] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const index = periods.findIndex((period) => period.month === selected.month)

  function select(period: BillingPeriod) {
    setNewEnd(null)
    setStatus({ kind: 'idle' })
    onSelect(period)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (newEnd === null) return
    setStatus({ kind: 'saving' })
    try {
      await setPeriodEnd(selected.month, newEnd)
      setNewEnd(null)
      setStatus({ kind: 'idle' })
      onEndChanged(selected.month)
    } catch (error) {
      setStatus({ kind: 'failed', message: adminErrorMessage(error) })
    }
  }

  return (
    <>
      <div className="period">
        <button
          type="button"
          className="secondary"
          disabled={index <= 0}
          onClick={() => select(periods[index - 1])}
        >
          ‹ Anterior
        </button>
        <div className="period-label">
          <strong>
            {formatDate(selected.start)} – {formatDate(selected.end)}
          </strong>
          {selected.isCurrent && <small>Periodo actual</small>}
          {selected.changeable && newEnd === null && (
            <button type="button" className="secondary" onClick={() => setNewEnd(selected.end)}>
              Cambiar cierre
            </button>
          )}
        </div>
        <button
          type="button"
          className="secondary"
          disabled={index === periods.length - 1}
          onClick={() => select(periods[index + 1])}
        >
          Siguiente ›
        </button>
      </div>

      {newEnd !== null && (
        <form className="period-end" onSubmit={handleSubmit}>
          {hasEnded(selected, todayInBolivia()) && (
            <div className="warning" role="alert">
              <p>
                Este periodo ya terminó. Si ya imprimió sus reportes, deberá imprimirlos de nuevo.
              </p>
            </div>
          )}
          {status.kind === 'failed' && (
            <div className="message error" role="alert">
              <strong>✗ No se cambió el cierre</strong>
              <p>{status.message}</p>
            </div>
          )}
          <label>
            Último día del periodo
            <input
              type="date"
              required
              min={selected.earliestEnd}
              max={selected.latestEnd}
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
            />
          </label>
          <p className="hint">
            Puede elegir del {formatDate(selected.earliestEnd)} al {formatDate(selected.latestEnd)}.
          </p>
          <NextPeriodHint selected={selected} next={next} newEnd={newEnd} />
          <div className="period-end-actions">
            <button type="submit" className="primary" disabled={status.kind === 'saving'}>
              {status.kind === 'saving' ? 'Guardando…' : 'Guardar cierre'}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={status.kind === 'saving'}
              onClick={() => {
                setNewEnd(null)
                setStatus({ kind: 'idle' })
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </>
  )
}

type HintProps = { selected: BillingPeriod; next: BillingPeriod | undefined; newEnd: string }

// What the change does to the next period, before she saves it.
function NextPeriodHint({ selected, next, newEnd }: HintProps) {
  if (
    next === undefined ||
    newEnd === '' ||
    newEnd < selected.earliestEnd ||
    newEnd > selected.latestEnd
  ) {
    return null // outside the limits: the date field already says so
  }
  const nextAfter = nextAfterNewEnd(next, newEnd)
  if (nextAfter === null) return null // too late: the database explains why when she saves

  const today = todayInBolivia()
  // Closing the current period before today moves today into the next one.
  const todayMoves = selected.isCurrent && newEnd < today
  // Moving the previous period's end to today or later brings today back into it.
  const todayReturns = !selected.isCurrent && newEnd >= today

  return (
    <p className="hint">
      El periodo siguiente irá del {formatDate(nextAfter.start)} al {formatDate(nextAfter.end)}.
      {todayMoves && <strong> Hoy ({formatDate(today)}) quedará en el periodo siguiente.</strong>}
      {todayReturns && <strong> Hoy ({formatDate(today)}) quedará en este periodo.</strong>}
    </p>
  )
}
