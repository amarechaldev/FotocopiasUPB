import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArchiveForm } from './ArchiveForm'
import { ConfirmPanel } from './ConfirmPanel'
import { todayInBolivia } from './domain/dates'
import { formatAmount } from './domain/money'
import { hasEnded, periodName, type BillingPeriod } from './domain/periods'
import { inEffect, parseBs, type CopyPriceRow } from './domain/prices'
import {
  archiveSize,
  createSize,
  deleteSize,
  fetchAllSizes,
  fetchSizeUsage,
  listErrorMessage,
  reactivateSize,
  type ListedSize,
} from './lib/lists'
import { fetchPeriods } from './lib/periods'
import {
  fetchPriceRows,
  priceErrorMessage,
  setAnilladoPrice,
  setCopyPrice,
  type PriceRows,
} from './lib/prices'

// One price of the list: the copy, or one anillado size.
type Item = { kind: 'copia' } | { kind: 'anillado'; sizeMm: number }

type Loaded =
  | { kind: 'loading' }
  | {
      kind: 'loaded'
      periods: BillingPeriod[]
      rows: PriceRows
      sizes: ListedSize[]
      usage: Map<number, number> // entries per size
    }
  | { kind: 'failed'; message: string }

// The form open under the title, if any.
type Open =
  | { kind: 'price'; item: Item }
  | { kind: 'archive'; sizeMm: number }
  | { kind: 'delete'; sizeMm: number }
  | { kind: 'new' }

function itemName(item: Item): string {
  return item.kind === 'copia' ? 'Copia' : `Anillado de ${item.sizeMm} mm`
}

// Bs with a comma, as in the reports, but with a plain space between thousands (an input field).
function bs(centavos: number): string {
  return formatAmount(centavos).replace(/ /g, ' ')
}

// The operator's prices and anillado sizes (#33): the price of each item in the current period and
// the period it starts from. A change starts in the current or the previous period (0020): reports
// of earlier periods keep their prices. Sizes are added with their first price, and archived from
// a period; one without entries can be deleted (0023).
export function PriceList() {
  const [loaded, setLoaded] = useState<Loaded>({ kind: 'loading' })
  const [reloads, setReloads] = useState(0) // +1 = fetch the prices again
  const [open, setOpen] = useState<Open | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const top = useRef<HTMLElement>(null)

  useEffect(() => {
    Promise.all([fetchPeriods(), fetchPriceRows(), fetchAllSizes(), fetchSizeUsage()])
      .then(([periods, rows, sizes, usage]) => setLoaded({ kind: 'loaded', periods, rows, sizes, usage }))
      .catch((error) => setLoaded({ kind: 'failed', message: priceErrorMessage(error) }))
  }, [reloads])

  // The message is at the top of the section, maybe far from the row she clicked.
  useEffect(() => {
    if (confirmation || actionError) top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [confirmation, actionError])

  if (loaded.kind === 'loading') return <p className="notice">Cargando…</p>
  if (loaded.kind === 'failed') {
    return (
      <section className="entry-list lists">
        <div className="message error" role="alert">
          <strong>✗ No se pudieron cargar los precios</strong>
          <p>{loaded.message}</p>
        </div>
      </section>
    )
  }

  const { periods, rows, sizes, usage } = loaded
  const current = periods.find((period) => period.isCurrent)
  if (!current) return <p className="notice">El primer periodo todavía no empezó.</p>
  const choices = periods.filter((period) => period.changeable).reverse() // current first

  function rowsOf(item: Item): CopyPriceRow[] {
    return item.kind === 'copia' ? rows.copy : rows.anillados.filter((row) => row.sizeMm === item.sizeMm)
  }
  function startOf(month: string): string {
    const period = periods.find((p) => p.month === month)
    return period ? periodName(period) : month
  }
  function done(message: string) {
    setOpen(null)
    setActionError(null)
    setConfirmation(message)
    setReloads((n) => n + 1)
  }
  function openForm(form: Open) {
    setConfirmation(null)
    setActionError(null)
    setOpen(form)
  }
  async function remove(sizeMm: number) {
    try {
      await deleteSize(sizeMm)
      done(`✓ Anillado de ${sizeMm} mm eliminado.`)
    } catch (error) {
      setOpen(null)
      setActionError(listErrorMessage(error))
    }
  }
  async function reactivate(sizeMm: number) {
    setConfirmation(null)
    try {
      await reactivateSize(sizeMm)
      done(`✓ Anillado de ${sizeMm} mm reactivado: se puede usar otra vez en los pedidos.`)
    } catch (error) {
      setActionError(listErrorMessage(error))
    }
  }

  return (
    <section className="entry-list lists" ref={top}>
      <h2>Precios y anillados</h2>
      <p className="hint">
        Precios del periodo actual ({periodName(current)}). Un cambio vale desde el periodo que elija:
        el actual o el anterior. Los reportes de periodos anteriores mantienen sus precios.
      </p>

      <div className="result">
        {confirmation && (
          <div className="message success" role="status">
            <strong>{confirmation}</strong>
          </div>
        )}
        {actionError && (
          <div className="message error" role="alert">
            <strong>✗ No se guardó</strong>
            <p>{actionError}</p>
          </div>
        )}
      </div>

      {open === null && (
        <div className="list-actions">
          <button type="button" className="secondary" onClick={() => openForm({ kind: 'new' })}>
            + Agregar tamaño de anillado
          </button>
        </div>
      )}

      {open?.kind === 'price' && (
        <PriceForm
          item={open.item}
          current={inEffect(rowsOf(open.item), current.month)}
          choices={choices}
          onCancel={() => setOpen(null)}
          onSaved={done}
        />
      )}
      {open?.kind === 'new' && <NewSizeForm choices={choices} onCancel={() => setOpen(null)} onSaved={done} />}
      {open?.kind === 'archive' && (
        <ArchiveForm
          title={`Archivar el anillado de ${open.sizeMm} mm`}
          choices={choices}
          archive={(month) => archiveSize(open.sizeMm, month)}
          onCancel={() => setOpen(null)}
          onDone={(period) =>
            done(`✓ Anillado de ${open.sizeMm} mm archivado desde el periodo ${periodName(period)}.`)
          }
        />
      )}
      {open?.kind === 'delete' && (
        <ConfirmPanel
          question={`¿Eliminar el anillado de ${open.sizeMm} mm?`}
          detail="No se puede deshacer. Sus precios también se eliminan."
          onConfirm={() => remove(open.sizeMm)}
          onCancel={() => setOpen(null)}
        />
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th className="number">Precio (Bs)</th>
              <th>Desde el periodo</th>
              <th>
                <span className="visually-hidden">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {[{ kind: 'copia' } as Item, ...sizes.map((s) => ({ kind: 'anillado' as const, sizeMm: s.sizeMm }))].map(
              (item) => {
                const row = inEffect(rowsOf(item), current.month)
                const size = item.kind === 'anillado' ? sizes.find((s) => s.sizeMm === item.sizeMm) : undefined
                const archived = size?.archivedFrom ?? null
                return (
                  <tr key={item.kind === 'copia' ? 'copia' : item.sizeMm} className={archived ? 'archived' : undefined}>
                    <td>
                      {itemName(item)}
                      {archived && <span className="tag manual">Archivado desde {startOf(archived)}</span>}
                    </td>
                    <td className="number">{row ? bs(row.priceCentavos) : '—'}</td>
                    <td>{row ? startOf(row.fromMonth) : 'Todavía sin precio'}</td>
                    <td className="row-actions">
                      <button
                        type="button"
                        className="secondary"
                        disabled={open !== null}
                        onClick={() => openForm({ kind: 'price', item })}
                      >
                        Cambiar precio
                      </button>
                      {item.kind === 'anillado' &&
                        (archived ? (
                          <button
                            type="button"
                            className="secondary"
                            disabled={open !== null}
                            onClick={() => reactivate(item.sizeMm)}
                          >
                            Reactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="secondary"
                            disabled={open !== null}
                            onClick={() => openForm({ kind: 'archive', sizeMm: item.sizeMm })}
                          >
                            Archivar
                          </button>
                        ))}
                      {item.kind === 'anillado' && usage.get(item.sizeMm) === 0 && (
                        <button
                          type="button"
                          className="danger"
                          disabled={open !== null}
                          onClick={() => openForm({ kind: 'delete', sizeMm: item.sizeMm })}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              },
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'failed'; message: string }

// The period a price starts from, current first, with the note about printed reports.
function PeriodChoice({
  choices,
  month,
  onChange,
}: {
  choices: BillingPeriod[]
  month: string
  onChange: (month: string) => void
}) {
  const period = choices.find((p) => p.month === month) ?? choices[0]
  return (
    <>
      <label>
        Desde el periodo
        <select value={month} onChange={(e) => onChange(e.target.value)}>
          {choices.map((p) => (
            <option key={p.month} value={p.month}>
              {periodName(p)} {p.isCurrent ? '(actual)' : '(anterior)'}
            </option>
          ))}
        </select>
      </label>
      {hasEnded(period, todayInBolivia()) && (
        <p className="hint">
          Este periodo ya cerró. Si ya imprimió sus reportes, vuelva a generarlos con el nuevo precio.
        </p>
      )}
    </>
  )
}

function FormButtons({ saving, label, onCancel }: { saving: boolean; label: string; onCancel: () => void }) {
  return (
    <div className="period-end-actions">
      <button type="submit" className="primary" disabled={saving}>
        {saving ? 'Guardando…' : label}
      </button>
      <button type="button" className="secondary" disabled={saving} onClick={onCancel}>
        Cancelar
      </button>
    </div>
  )
}

function Failure({ status, title }: { status: Status; title: string }) {
  if (status.kind !== 'failed') return null
  return (
    <div className="message error" role="alert">
      <strong>✗ {title}</strong>
      <p>{status.message}</p>
    </div>
  )
}

const PRICE_HINT = 'Escriba un precio mayor que cero, por ejemplo 1,50.'

type FormProps = {
  item: Item
  current: CopyPriceRow | undefined // its price in the current period
  choices: BillingPeriod[] // the periods a change can start from, current first
  onCancel: () => void
  onSaved: (confirmation: string) => void
}

function PriceForm({ item, current, choices, onCancel, onSaved }: FormProps) {
  const [price, setPrice] = useState(current ? bs(current.priceCentavos) : '')
  const [month, setMonth] = useState(choices[0].month)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const period = choices.find((p) => p.month === month) ?? choices[0]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const centavos = parseBs(price)
    if (centavos === null) {
      setStatus({ kind: 'failed', message: PRICE_HINT })
      return
    }
    setStatus({ kind: 'saving' })
    try {
      if (item.kind === 'copia') await setCopyPrice(period.month, centavos)
      else await setAnilladoPrice(item.sizeMm, period.month, centavos)
      onSaved(`✓ Precio guardado: ${itemName(item)}, ${bs(centavos)} Bs desde el periodo ${periodName(period)}.`)
    } catch (error) {
      setStatus({ kind: 'failed', message: priceErrorMessage(error) })
    }
  }

  return (
    <form className="list-form" onSubmit={handleSubmit}>
      <strong>Nuevo precio: {itemName(item)}</strong>
      <Failure status={status} title="No se guardó el precio" />
      <label>
        Precio (Bs)
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      <PeriodChoice choices={choices} month={month} onChange={setMonth} />
      <FormButtons saving={status.kind === 'saving'} label="Guardar precio" onCancel={onCancel} />
    </form>
  )
}

// A new anillado size: its size in mm and its first price, from the current or the previous period.
function NewSizeForm({
  choices,
  onCancel,
  onSaved,
}: {
  choices: BillingPeriod[]
  onCancel: () => void
  onSaved: (confirmation: string) => void
}) {
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [month, setMonth] = useState(choices[0].month)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const period = choices.find((p) => p.month === month) ?? choices[0]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const sizeMm = /^\d{1,4}$/.test(size.trim()) ? Number(size.trim()) : 0
    const centavos = parseBs(price)
    if (sizeMm <= 0) {
      setStatus({ kind: 'failed', message: listErrorMessage({ message: 'size_invalid' }) })
      return
    }
    if (centavos === null) {
      setStatus({ kind: 'failed', message: PRICE_HINT })
      return
    }
    setStatus({ kind: 'saving' })
    try {
      await createSize(sizeMm, period.month, centavos)
      onSaved(
        `✓ Anillado de ${sizeMm} mm agregado, a ${bs(centavos)} Bs desde el periodo ${periodName(period)}.`,
      )
    } catch (error) {
      setStatus({ kind: 'failed', message: listErrorMessage(error) })
    }
  }

  return (
    <form className="list-form" onSubmit={handleSubmit}>
      <strong>Nuevo tamaño de anillado</strong>
      <Failure status={status} title="No se agregó el tamaño" />
      <label>
        Tamaño (mm)
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />
      </label>
      <label>
        Precio (Bs)
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      <PeriodChoice choices={choices} month={month} onChange={setMonth} />
      <FormButtons saving={status.kind === 'saving'} label="Agregar tamaño" onCancel={onCancel} />
    </form>
  )
}
