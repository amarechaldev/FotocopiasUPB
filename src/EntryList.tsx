import { useEffect, useMemo, useState } from 'react'
import { formatDate, formatDateTime, todayInBolivia } from './domain/dates'
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
import { periodOf, shiftPeriod, type Period } from './domain/periods'
import { fetchEntries } from './lib/adminEntries'
import { adminErrorMessage } from './lib/adminErrors'
import { fetchAreas, type Area } from './lib/entries'

type Loaded =
  | { kind: 'loading' }
  | { kind: 'loaded'; entries: ListedEntry[] }
  | { kind: 'failed'; message: string }

// The operator's list of entries: one billing period at a time, filtered and
// sorted in the browser (a period is a few hundred entries at most).
export function EntryList() {
  const currentPeriod = periodOf(todayInBolivia())
  const [period, setPeriod] = useState<Period>(currentPeriod)
  const [loaded, setLoaded] = useState<Loaded>({ kind: 'loading' })
  const [areas, setAreas] = useState<Area[]>([])
  const [areasError, setAreasError] = useState(false)
  const [filters, setFilters] = useState<EntryFilters>(noFilters)
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSort)

  useEffect(() => {
    fetchAreas()
      .then(setAreas)
      .catch(() => setAreasError(true))
  }, [])

  useEffect(() => {
    let current = true // ignore the answer if she has already moved to another period
    fetchEntries(period)
      .then((entries) => {
        if (current) setLoaded({ kind: 'loaded', entries })
      })
      .catch((error) => {
        if (current) setLoaded({ kind: 'failed', message: adminErrorMessage(error) })
      })
    return () => {
      current = false
    }
  }, [period])

  const shown = useMemo(
    () => (loaded.kind === 'loaded' ? sortEntries(filterEntries(loaded.entries, filters), sortOrder) : []),
    [loaded, filters, sortOrder],
  )

  function changePeriod(count: number) {
    setPeriod(shiftPeriod(period, count))
    setLoaded({ kind: 'loading' })
  }

  const isCurrent = period.start === currentPeriod.start
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
      <div className="period">
        <button type="button" className="secondary" onClick={() => changePeriod(-1)}>
          ‹ Anterior
        </button>
        <div className="period-label">
          <strong>
            {formatDate(period.start)} – {formatDate(period.end)}
          </strong>
          {isCurrent && <small>Periodo actual</small>}
        </div>
        <button
          type="button"
          className="secondary"
          disabled={isCurrent}
          onClick={() => changePeriod(1)}
        >
          Siguiente ›
        </button>
      </div>

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
                  </tr>
                </thead>
                <tbody>
                  {shown.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.createdAt)}</td>
                      <td>{formatDate(entry.entryDate)}</td>
                      <td>{entry.areaName}</td>
                      <td>{entry.name}</td>
                      <td>{entry.description}</td>
                      <td className="number">{entry.copias}</td>
                      <td>{describeAnillados(entry.anillados)}</td>
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
