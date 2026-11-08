import { useEffect, useMemo, useState } from 'react'
import { AccountEditor } from './AccountEditor'
import {
  defaultAccountSort,
  describeAreas,
  filterArchived,
  filterByArea,
  isDefaultAccountSort,
  nextAccountSort,
  sortAccounts,
  type AccountSortKey,
  type AccountSortOrder,
  type ArchivedFilter,
} from './domain/accountList'
import { filterByName } from './domain/names'
import { accountAdminErrorMessage, fetchAdminAccounts, type AdminAccount } from './lib/adminAccounts'
import { fetchAllAreas, type ListedArea } from './lib/lists'
import { scrollToTop } from './scrollToTop'

type Loaded =
  | { kind: 'loading' }
  | { kind: 'loaded'; accounts: AdminAccount[]; areas: ListedArea[] } // archived departments too
  | { kind: 'failed'; message: string }

// The operator's list of staff accounts (#31): archived ones included (always last), with a
// search, filters on department and on archived accounts, and sorting by column.
export function AccountList() {
  const [loaded, setLoaded] = useState<Loaded>({ kind: 'loading' })
  const [reloads, setReloads] = useState(0) // +1 = fetch the accounts again
  const [query, setQuery] = useState('')
  const [archivedFilter, setArchivedFilter] = useState<ArchivedFilter>('all')
  // A department: e.g. to find who still has one before deleting it (#33).
  const [areaFilter, setAreaFilter] = useState<number | null>(null)
  const [sortOrder, setSortOrder] = useState<AccountSortOrder>(defaultAccountSort)
  const [editing, setEditing] = useState<AdminAccount | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchAdminAccounts(), fetchAllAreas()])
      .then(([accounts, areas]) => setLoaded({ kind: 'loaded', accounts, areas }))
      .catch((error) => setLoaded({ kind: 'failed', message: accountAdminErrorMessage(error) }))
  }, [reloads])

  // The confirmation is above the table, maybe far from the row she clicked.
  useEffect(() => {
    if (confirmation) scrollToTop()
  }, [confirmation])

  const areaNames = useMemo(
    () =>
      new Map(
        loaded.kind === 'loaded'
          ? loaded.areas.map((area) => [area.id, area.archivedFrom ? `${area.name} (archivada)` : area.name])
          : [],
      ),
    [loaded],
  )
  // The order she chose wins over the search's best-match order.
  const shown = useMemo(
    () =>
      loaded.kind === 'loaded'
        ? sortAccounts(
            filterByName(filterByArea(filterArchived(loaded.accounts, archivedFilter), areaFilter), query),
            sortOrder,
            areaNames,
          )
        : [],
    [loaded, archivedFilter, areaFilter, query, sortOrder, areaNames],
  )

  if (loaded.kind === 'loading') return <p className="notice">Cargando…</p>
  if (loaded.kind === 'failed') {
    return (
      <section className="entry-list">
        <div className="message error" role="alert">
          <strong>✗ No se pudieron cargar las cuentas</strong>
          <p>{loaded.message}</p>
        </div>
      </section>
    )
  }

  if (editing) {
    return (
      <section className="entry-list">
        <AccountEditor
          account={editing}
          areas={loaded.areas.filter((area) => !area.archivedFrom)} // a new choice must be in use
          onDone={(message) => {
            setEditing(null)
            setConfirmation(message)
            setReloads((n) => n + 1)
          }}
          onCancel={() => setEditing(null)}
        />
      </section>
    )
  }

  // A column title that sorts by that column (a plain function, as in EntryList).
  function sortHeader(key: AccountSortKey, label: string, className?: string) {
    const inCharge = sortOrder[0]
    const active = inCharge.key === key
    return (
      <th
        className={className}
        aria-sort={active ? (inCharge.descending ? 'descending' : 'ascending') : undefined}
      >
        <button type="button" onClick={() => setSortOrder(nextAccountSort(sortOrder, key))}>
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

  const total = loaded.accounts.length
  const filtered = query.trim() !== '' || archivedFilter !== 'all' || areaFilter !== null

  return (
    <section className="entry-list account-list">
      <div className="filters">
        <label>
          Buscar
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label>
          Área
          <select
            value={areaFilter ?? ''}
            onChange={(e) => setAreaFilter(e.target.value === '' ? null : Number(e.target.value))}
          >
            <option value="">Todas</option>
            {loaded.areas.map((area) => (
              <option key={area.id} value={area.id}>
                {areaNames.get(area.id)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mostrar
          <select
            value={archivedFilter}
            onChange={(e) => setArchivedFilter(e.target.value as ArchivedFilter)}
          >
            <option value="all">Todas</option>
            <option value="active">Solo activas</option>
            <option value="archived">Solo archivadas</option>
          </select>
        </label>
        <button
          type="button"
          className="secondary"
          disabled={!filtered}
          onClick={() => {
            setQuery('')
            setArchivedFilter('all')
            setAreaFilter(null)
          }}
        >
          Quitar filtros
        </button>
      </div>

      <div className="result">
        {confirmation && (
          <div className="message success" role="status">
            <strong>{confirmation}</strong>
          </div>
        )}
      </div>

      <div className="count">
        <p>{filtered ? `${shown.length} de ${total} cuentas` : `${total} cuentas`}</p>
        <button
          type="button"
          className="secondary"
          disabled={isDefaultAccountSort(sortOrder)}
          onClick={() => setSortOrder(defaultAccountSort)}
        >
          Orden predeterminado
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="notice">
          {total === 0 ? 'Todavía no hay cuentas.' : 'Ninguna cuenta coincide con los filtros.'}
        </p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {sortHeader('name', 'Nombre')}
                {sortHeader('area', 'Áreas')}
                {sortHeader('entries', 'Pedidos', 'number')}
                <th>
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((account) => (
                <tr key={account.id} className={account.archived ? 'archived' : undefined}>
                  <td>
                    {account.name}
                    {account.pinResetPending && <span className="tag">Reinicio de PIN pendiente</span>}
                    {account.archived && <span className="tag manual">Archivada</span>}
                  </td>
                  <td>{describeAreas(account, areaNames)}</td>
                  <td className="number">{account.entryCount}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setConfirmation(null)
                        setEditing(account)
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
