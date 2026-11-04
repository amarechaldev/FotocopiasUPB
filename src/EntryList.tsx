import { useEffect, useMemo, useState } from 'react'
import { formatDate, formatDateTime } from './domain/dates'
import {
  defaultSort,
  describeAnillados,
  filterEntries,
  isDefaultSort,
  nextSort,
  noFilters,
  sortEntries,
  type EntryFilters,
  type ListedEntry,
  type SortOrder,
  type SortKey,
} from './domain/entryList'
import { browsablePeriods, type BillingPeriod } from './domain/periods'
import { EntryEditor, type CreatedEntry } from './EntryEditor'
import { deleteEntry, fetchEntries, restoreEntry } from './lib/adminEntries'
import { adminErrorMessage } from './lib/adminErrors'
import { fetchAreas, type Area } from './lib/entries'
import { fetchPeriods } from './lib/periods'
import { PeriodBar } from './PeriodBar'
import { ReportButtons } from './ReportButtons'
import { scrollToTop } from './scrollToTop'

type LoadedPeriods =
  | { kind: 'loading' }
  | { kind: 'loaded'; periods: BillingPeriod[] } // up to the one after the current, oldest first
  | { kind: 'failed'; message: string }

type Loaded =
  | { kind: 'loading' }
  | { kind: 'loaded'; entries: ListedEntry[] }
  | { kind: 'failed'; message: string }

// The last change, which can still be undone: the entry as it was before it.
// Kept only here, in memory, until the next change or a period change (no history).
// A manual entry just registered is undone by deleting it.
type Undo =
  | { kind: 'edited' | 'deleted'; before: ListedEntry }
  | { kind: 'created'; created: CreatedEntry }

// The operator's list of entries: one billing period at a time, filtered and
// sorted in the browser (a period is a few hundred entries at most).
export function EntryList() {
  const [periods, setPeriods] = useState<LoadedPeriods>({ kind: 'loading' })
  // The period shown, by its month; null = the current one (until the periods arrive).
  const [month, setMonth] = useState<string | null>(null)
  const [periodReloads, setPeriodReloads] = useState(0) // +1 = fetch the periods again
  const [loaded, setLoaded] = useState<Loaded>({ kind: 'loading' })
  const [areas, setAreas] = useState<Area[]>([])
  const [areasError, setAreasError] = useState(false)
  const [filters, setFilters] = useState<EntryFilters>(noFilters)
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSort)
  // The entry open in the form, 'new' for a manual entry, null = the list is shown.
  const [editing, setEditing] = useState<ListedEntry | 'new' | null>(null)
  const [undo, setUndo] = useState<Undo | null>(null)
  const [busy, setBusy] = useState(false) // a delete or undo is on its way
  const [actionError, setActionError] = useState<string | null>(null)
  const [reloads, setReloads] = useState(0) // +1 = fetch the period again

  // The undo bar and errors appear above the table, maybe far from the row she clicked:
  // scroll up on every new one.
  useEffect(() => {
    if (undo || actionError) scrollToTop()
  }, [undo, actionError])

  useEffect(() => {
    fetchAreas()
      .then(setAreas)
      .catch(() => setAreasError(true))
  }, [])

  useEffect(() => {
    fetchPeriods()
      .then((all) => setPeriods({ kind: 'loaded', periods: all }))
      .catch((error) => setPeriods({ kind: 'failed', message: adminErrorMessage(error) }))
  }, [periodReloads])

  // The month she chose, or the current period (also if a change of end dates removed hers).
  const allPeriods = periods.kind === 'loaded' ? periods.periods : []
  const browsable = browsablePeriods(allPeriods)
  const period: BillingPeriod | undefined =
    browsable.find((p) => p.month === month) ?? browsable.find((p) => p.isCurrent)
  // The period after the one shown: moving the end changes its start.
  const nextPeriod = period && allPeriods[allPeriods.indexOf(period) + 1]
  const start = period?.start
  const end = period?.end

  useEffect(() => {
    if (start === undefined || end === undefined) return
    let current = true // ignore the answer if she has already moved to another period
    fetchEntries({ start, end })
      .then((entries) => {
        if (current) setLoaded({ kind: 'loaded', entries })
      })
      .catch((error) => {
        if (current) setLoaded({ kind: 'failed', message: adminErrorMessage(error) })
      })
    return () => {
      current = false
    }
  }, [start, end, reloads])

  const shown = useMemo(
    () => (loaded.kind === 'loaded' ? sortEntries(filterEntries(loaded.entries, filters), sortOrder) : []),
    [loaded, filters, sortOrder],
  )

  function changePeriod(chosen: BillingPeriod) {
    setMonth(chosen.month)
    setLoaded({ kind: 'loading' })
    setUndo(null)
    setActionError(null)
  }

  // A moved end date changes this period and its neighbour: fetch the periods again. The
  // entries follow, since the dates of the period shown change. Stay on the period she
  // changed, even if today now belongs to another one.
  function handleEndChanged(changedMonth: string) {
    setMonth(changedMonth)
    setPeriodReloads((n) => n + 1)
  }

  // Runs a delete or undo, then fetches the period again (the table stays meanwhile).
  async function act(action: () => Promise<void>, nextUndo: Undo | null) {
    setBusy(true)
    setActionError(null)
    try {
      await action()
      setUndo(nextUndo)
      setReloads((n) => n + 1)
    } catch (error) {
      setActionError(adminErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  function handleSaved(created?: CreatedEntry) {
    if (created) setUndo({ kind: 'created', created })
    else if (editing && editing !== 'new') setUndo({ kind: 'edited', before: editing })
    setEditing(null)
    setActionError(null)
    setReloads((n) => n + 1)
  }

  if (editing) {
    return (
      <section className="entry-list">
        <EntryEditor
          entry={editing === 'new' ? null : editing}
          periods={allPeriods}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      </section>
    )
  }

  if (periods.kind !== 'loaded' || period === undefined) {
    return (
      <section className="entry-list">
        {periods.kind === 'loading' && <p className="notice">Cargando…</p>}
        {periods.kind === 'failed' && (
          <div className="message error" role="alert">
            <strong>✗ No se pudieron cargar los periodos</strong>
            <p>{periods.message}</p>
          </div>
        )}
        {periods.kind === 'loaded' && <p className="notice">Todavía no empezó ningún periodo.</p>}
      </section>
    )
  }

  const filtered =
    filters.areaId !== null || filters.name.trim() !== '' || filters.description.trim() !== ''

  // A column title that sorts by that column (a plain function, not a component, so
  // React does not rebuild the header on every render).
  function sortHeader(sortKey: SortKey, label: string) {
    const inCharge = sortOrder[0]
    const active = inCharge.key === sortKey
    return (
      <th aria-sort={active ? (inCharge.descending ? 'descending' : 'ascending') : undefined}>
        <button type="button" onClick={() => setSortOrder(nextSort(sortOrder, sortKey))}>
          {label}{' '}
          {active ? (
            inCharge.descending ? '▼' : '▲'
          ) : (
            <span className="sortable" aria-hidden="true">
              ↕
            </span>
          )}
        </button>
      </th>
    )
  }

  return (
    <section className="entry-list">
      <div className="list-actions">
        <button type="button" className="primary" disabled={busy} onClick={() => setEditing('new')}>
          + Registrar pedido del cuaderno
        </button>
      </div>

      <PeriodBar
        periods={browsable}
        selected={period}
        next={nextPeriod}
        onSelect={changePeriod}
        onEndChanged={handleEndChanged}
      />

      <ReportButtons period={period} areas={areas} />

      <div className="filters">
        <label>
          Área
          <select
            value={filters.areaId ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, areaId: e.target.value === '' ? null : Number(e.target.value) })
            }
          >
            <option value="">{areasError ? 'Todas (no se pudo cargar la lista)' : 'Todas'}</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nombre
          <input
            type="search"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </label>
        <label>
          Descripción
          <input
            type="search"
            value={filters.description}
            onChange={(e) => setFilters({ ...filters, description: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="secondary"
          disabled={!filtered}
          onClick={() => setFilters(noFilters)}
        >
          Quitar filtros
        </button>
      </div>

      <div className="result">
        {undo && (
          <div className="undo-bar" role="status">
            <span>
              {undo.kind === 'created'
                ? `Pedido de ${undo.created.name} del ${formatDate(undo.created.entryDate)} registrado.`
                : `Pedido de ${undo.before.name} del ${formatDate(undo.before.entryDate)} ${
                    undo.kind === 'edited' ? 'modificado' : 'eliminado'
                  }.`}
            </span>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() =>
                act(
                  undo.kind === 'created'
                    ? () => deleteEntry(undo.created.id)
                    : () => restoreEntry(undo.before),
                  null,
                )
              }
            >
              Deshacer
            </button>
          </div>
        )}
        {actionError && (
          <div className="message error" role="alert">
            <strong>✗ No se pudo completar</strong>
            <p>{actionError}</p>
          </div>
        )}
      </div>

      {loaded.kind === 'loading' && <p className="notice">Cargando…</p>}
      {loaded.kind === 'failed' && (
        <div className="message error" role="alert">
          <strong>✗ No se pudieron cargar los pedidos</strong>
          <p>{loaded.message}</p>
        </div>
      )}
      {loaded.kind === 'loaded' && (
        <>
          <div className="count">
            <p>
              {filtered
                ? `${shown.length} de ${loaded.entries.length} pedidos`
                : `${loaded.entries.length} pedidos`}
            </p>
            <button
              type="button"
              className="secondary"
              disabled={isDefaultSort(sortOrder)}
              onClick={() => setSortOrder(defaultSort)}
            >
              Orden predeterminado
            </button>
          </div>
          {shown.length === 0 ? (
            <p className="notice">
              {filtered ? 'Ningún pedido coincide con los filtros.' : 'No hay pedidos en este periodo.'}
            </p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {sortHeader('createdAt', 'Registrado')}
                    {sortHeader('entryDate', 'Fecha')}
                    {sortHeader('area', 'Área')}
                    {sortHeader('name', 'Nombre')}
                    <th>Descripción</th>
                    <th className="number">Copias</th>
                    <th>Anillados</th>
                    <th>
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        {formatDateTime(entry.createdAt)}
                        {entry.manual && (
                          <span className="tag manual" title="Registrado por la operadora">
                            Ingreso manual
                          </span>
                        )}
                        {entry.modifiedAt && (
                          <span
                            className="tag"
                            title={`Modificado el ${formatDateTime(entry.modifiedAt)}`}
                          >
                            Modificado
                          </span>
                        )}
                      </td>
                      <td>{formatDate(entry.entryDate)}</td>
                      <td>{entry.areaName}</td>
                      <td>{entry.name}</td>
                      <td>{entry.description}</td>
                      <td className="number">{entry.copias}</td>
                      <td>{describeAnillados(entry.anillados)}</td>
                      <td className="row-actions">
                        <button
                          type="button"
                          className="secondary"
                          disabled={busy}
                          onClick={() => setEditing(entry)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="danger"
                          disabled={busy}
                          onClick={() => act(() => deleteEntry(entry.id), { kind: 'deleted', before: entry })}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
