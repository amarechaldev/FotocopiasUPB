import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArchiveForm } from './ArchiveForm'
import { ConfirmPanel } from './ConfirmPanel'
import { filterByArea } from './domain/accountList'
import { affectedAccounts, affectedAccountsWarning } from './domain/lists'
import { periodName, type BillingPeriod } from './domain/periods'
import { useScrolledIntoView } from './scrollToTop'
import { fetchAdminAccounts, type AdminAccount } from './lib/adminAccounts'
import {
  archiveArea,
  createArea,
  deleteArea,
  fetchAllAreas,
  fetchAreaUsage,
  listErrorMessage,
  reactivateArea,
  renameArea,
  type AreaUsage,
  type ListedArea,
} from './lib/lists'
import { fetchPeriods } from './lib/periods'

type Loaded =
  | { kind: 'loading' }
  | {
      kind: 'loaded'
      areas: ListedArea[]
      periods: BillingPeriod[]
      usage: Map<number, AreaUsage>
    }
  | { kind: 'failed'; message: string }

type Open =
  | { kind: 'new' }
  | { kind: 'rename'; area: ListedArea }
  | { kind: 'archive'; area: ListedArea }
  | { kind: 'delete'; area: ListedArea }

type Props = {
  onChanged: () => void // the other lists show department names: they must fetch them again
}

// The operator's departments (#33), in the order of the monthly report: added (last), renamed,
// archived from a period and reactivated. Deleted only if no entry and no account has it (0022).
// Archiving shows the active accounts that have the department: the staff fix their own accounts
// (PO, 08/11; staff form in #115).
export function AreaList({ onChanged }: Props) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: 'loading' })
  const [reloads, setReloads] = useState(0)
  const [open, setOpen] = useState<Open | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const top = useRef<HTMLElement>(null)

  useEffect(() => {
    Promise.all([fetchAllAreas(), fetchPeriods(), fetchAreaUsage()])
      .then(([areas, periods, usage]) =>
        setLoaded({ kind: 'loaded', areas, periods, usage }),
      )
      .catch((error) => setLoaded({ kind: 'failed', message: listErrorMessage(error) }))
  }, [reloads])

  useEffect(() => {
    if (confirmation || actionError) top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [confirmation, actionError])

  if (loaded.kind === 'loading') return <p className="notice">Cargando…</p>
  if (loaded.kind === 'failed') {
    return (
      <section className="entry-list lists">
        <div className="message error" role="alert">
          <strong>✗ No se pudieron cargar las áreas</strong>
          <p>{loaded.message}</p>
        </div>
      </section>
    )
  }

  const { areas, periods, usage } = loaded
  const choices = periods.filter((period) => period.changeable).reverse() // current first

  function startOf(month: string): string {
    const period = periods.find((p) => p.month === month)
    return period ? periodName(period) : month
  }
  function done(message: string) {
    setOpen(null)
    setActionError(null)
    setConfirmation(message)
    setReloads((n) => n + 1)
    onChanged()
  }
  function openForm(form: Open) {
    setConfirmation(null)
    setActionError(null)
    setOpen(form)
  }
  async function remove(area: ListedArea) {
    try {
      await deleteArea(area.id)
      done(`✓ Área ${area.name} eliminada.`)
    } catch (error) {
      setOpen(null)
      setActionError(listErrorMessage(error))
    }
  }
  async function reactivate(area: ListedArea) {
    setConfirmation(null)
    try {
      await reactivateArea(area.id)
      done(`✓ Área ${area.name} reactivada: se puede usar otra vez en los pedidos.`)
    } catch (error) {
      setActionError(listErrorMessage(error))
    }
  }

  return (
    <section className="entry-list lists" ref={top}>
      <h2>Áreas</h2>
      <p className="hint">
        En el orden del reporte mensual; un área nueva va al final. Un nombre nuevo se ve en todos los
        reportes, también los de periodos anteriores. Un área sin pedidos se puede eliminar; con
        pedidos, solo archivar.
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
            + Agregar área
          </button>
        </div>
      )}

      {open?.kind === 'new' && (
        <AreaNameForm
          title="Nueva área"
          initial=""
          save={(name) => createArea(name)}
          onCancel={() => setOpen(null)}
          onSaved={(name) => done(`✓ Área ${name} agregada.`)}
        />
      )}
      {open?.kind === 'rename' && (
        <AreaNameForm
          title={`Cambiar el nombre de ${open.area.name}`}
          initial={open.area.name}
          save={(name) => renameArea(open.area.id, name)}
          onCancel={() => setOpen(null)}
          onSaved={(name) => done(`✓ Área ${open.area.name} renombrada: ahora es ${name}.`)}
        />
      )}
      {open?.kind === 'archive' && (
        <ArchiveForm
          title={`Archivar el área ${open.area.name}`}
          choices={choices}
          archive={(month) => archiveArea(open.area.id, month)}
          onCancel={() => setOpen(null)}
          onDone={(period) => done(`✓ Área ${open.area.name} archivada desde el periodo ${periodName(period)}.`)}
        >
          <AffectedAccounts area={open.area} />
        </ArchiveForm>
      )}
      {open?.kind === 'delete' && (
        <DeleteAreaPanel
          area={open.area}
          onConfirm={() => remove(open.area)}
          onCancel={() => setOpen(null)}
        />
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Área</th>
              <th>
                <span className="visually-hidden">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.id} className={area.archivedFrom ? 'archived' : undefined}>
                <td>
                  {area.name}
                  {area.archivedFrom && (
                    <span className="tag manual">Archivada desde {startOf(area.archivedFrom)}</span>
                  )}
                </td>
                <td className="row-actions">
                  <button
                    type="button"
                    className="secondary"
                    disabled={open !== null}
                    onClick={() => openForm({ kind: 'rename', area })}
                  >
                    Cambiar nombre
                  </button>
                  {area.archivedFrom ? (
                    <button
                      type="button"
                      className="secondary"
                      disabled={open !== null}
                      onClick={() => reactivate(area)}
                    >
                      Reactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="secondary"
                      disabled={open !== null}
                      onClick={() => openForm({ kind: 'archive', area })}
                    >
                      Archivar
                    </button>
                  )}
                  {usage.get(area.id)?.entryCount === 0 && (
                    <button type="button" className="danger" disabled={open !== null} onClick={() => openForm({ kind: 'delete', area })}>
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// The accounts as they are now, fetched when a panel that depends on them opens: staff may have
// changed their departments on the tablet since this screen was loaded (found in #103).
function useFreshAccounts(): AdminAccount[] | 'loading' | 'failed' {
  const [accounts, setAccounts] = useState<AdminAccount[] | 'loading' | 'failed'>('loading')
  useEffect(() => {
    fetchAdminAccounts()
      .then((fresh) => setAccounts(fresh))
      .catch(() => setAccounts('failed'))
  }, [])
  return accounts
}

const CHECKING = <p className="notice">Comprobando las cuentas…</p>
const CHECK_FAILED = (
  <div className="message error" role="alert">
    <strong>✗ No se pudieron comprobar las cuentas</strong>
    <p>Recargue la página y vuelva a intentarlo.</p>
  </div>
)

// Deleting a department: only if no account has it, archived accounts included (0022). Otherwise
// it says which accounts to change first, instead of offering a delete the database would refuse.
function DeleteAreaPanel({
  area,
  onConfirm,
  onCancel,
}: {
  area: ListedArea
  onConfirm: () => Promise<void>
  onCancel: () => void
}) {
  const accounts = useFreshAccounts()
  if (accounts === 'loading') return CHECKING
  if (accounts === 'failed') {
    return (
      <ConfirmPanel
        question={`¿Eliminar el área ${area.name}?`}
        detail=""
        canConfirm={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      >
        {CHECK_FAILED}
      </ConfirmPanel>
    )
  }
  const holders = filterByArea(accounts, area.id)
  if (holders.length === 0) {
    return (
      <ConfirmPanel
        question={`¿Eliminar el área ${area.name}?`}
        detail="No se puede deshacer. Las descripciones usuales la pierden, y las que solo eran de esta área se eliminan."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
  }
  return (
    <ConfirmPanel
      question={`El área ${area.name} todavía no se puede eliminar`}
      detail={
        holders.length === 1
          ? 'Esta cuenta la tiene. Quítele el área en «Cuentas» (puede filtrar por área) y vuelva a intentarlo:'
          : 'Estas cuentas la tienen. Quíteles el área en «Cuentas» (puede filtrar por área) y vuelva a intentarlo:'
      }
      canConfirm={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <ul>
        {holders.map((account) => (
          <li key={account.id}>
            {account.name}
            {account.defaultAreaId === area.id && ' (área principal)'}
            {account.archived && ' (cuenta archivada)'}
          </li>
        ))}
      </ul>
    </ConfirmPanel>
  )
}

// Who will notice the archive, before she confirms it.
function AffectedAccounts({ area }: { area: ListedArea }) {
  const accounts = useFreshAccounts()
  if (accounts === 'loading') return CHECKING
  if (accounts === 'failed') return CHECK_FAILED
  const { main, other } = affectedAccounts(accounts, area.id)
  if (main.length === 0 && other.length === 0) {
    return <p className="hint">Ninguna cuenta activa tiene esta área.</p>
  }
  const warning = affectedAccountsWarning(
    main.map((a) => a.name),
    other.map((a) => a.name),
  )
  return (
    <div className="warning" role="status">
      {warning.main && <p>⚠ {warning.main}</p>}
      {warning.other && <p>⚠ {warning.other}</p>}
    </div>
  )
}

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'failed'; message: string }

function AreaNameForm({
  title,
  initial,
  save,
  onCancel,
  onSaved,
}: {
  title: string
  initial: string
  save: (name: string) => Promise<unknown>
  onCancel: () => void
  onSaved: (name: string) => void
}) {
  const [name, setName] = useState(initial)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const panel = useScrolledIntoView<HTMLFormElement>()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const clean = name.trim().replace(/\s+/g, ' ')
    setStatus({ kind: 'saving' })
    try {
      await save(clean)
      onSaved(clean)
    } catch (error) {
      setStatus({ kind: 'failed', message: listErrorMessage(error) })
    }
  }

  return (
    <form className="list-form" onSubmit={handleSubmit} ref={panel}>
      <strong>{title}</strong>
      {status.kind === 'failed' && (
        <div className="message error" role="alert">
          <strong>✗ No se guardó</strong>
          <p>{status.message}</p>
        </div>
      )}
      <label>
        Nombre
        <input
          type="text"
          required
          pattern=".*\S.*"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="period-end-actions">
        <button type="submit" className="primary" disabled={status.kind === 'saving'}>
          {status.kind === 'saving' ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" className="secondary" disabled={status.kind === 'saving'} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
