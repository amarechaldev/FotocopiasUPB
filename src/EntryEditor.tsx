import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AccountPicker } from './AccountPicker'
import { AnilladosField, type AnilladoRow } from './AnilladosField'
import { AreaSelect } from './AreaSelect'
import { formatDate, todayInBolivia } from './domain/dates'
import type { ListedEntry } from './domain/entryList'
import {
  checkDescription,
  checkEntryContents,
  checkEntryDate,
  movedPeriodWarning,
  newEntryPeriodWarning,
} from './domain/entryRules'
import type { BillingPeriod } from './domain/periods'
import type { Account } from './lib/accounts'
import { fetchAdminAccounts } from './lib/adminAccounts'
import { registerManualEntry, updateEntry } from './lib/adminEntries'
import { adminErrorMessage } from './lib/adminErrors'
import { fetchAnilladoSizes, fetchAreas, fetchVagueDescriptions, type Area } from './lib/entries'
import { scrollToTop } from './scrollToTop'

type Lists = {
  areas: Area[]
  sizes: number[]
  accounts: Account[]
  vague: string[] // too-vague descriptions
}

// A manual entry just registered, for the undo bar.
export type CreatedEntry = { id: number; name: string; entryDate: string }

type Props = {
  entry: ListedEntry | null // null = a new entry on someone's behalf (e.g. from the notebook)
  periods: BillingPeriod[] // from the first one, oldest first (for the date checks and warnings)
  onSaved: (created?: CreatedEntry) => void
  onCancel: () => void
}

// The operator's form to change one entry, or to register one for someone else. Checked
// like a staff entry (the database checks again); an edit is marked as modified, a new
// entry as manual.
export function EntryEditor({ entry, periods, onSaved, onCancel }: Props) {
  const [lists, setLists] = useState<Lists | null>(null)
  const [listsError, setListsError] = useState(false)
  const [accountId, setAccountId] = useState<number | null>(entry?.accountId ?? null)
  const [entryDate, setEntryDate] = useState(entry?.entryDate ?? todayInBolivia())
  const [areaId, setAreaId] = useState(entry ? String(entry.areaId) : '')
  const [outsideConfirmed, setOutsideConfirmed] = useState(false)
  const [description, setDescription] = useState(entry?.description ?? '')
  const [copias, setCopias] = useState(entry ? String(entry.copias) : '')
  // The entry's anillados get keys 1, 2, …; rows added later continue from there.
  const [anillados, setAnillados] = useState<AnilladoRow[]>(() =>
    (entry?.anillados ?? []).map((a, i) => ({
      key: i + 1,
      sizeMm: String(a.sizeMm),
      quantity: String(a.quantity),
    })),
  )
  const lastKey = useRef(entry?.anillados.length ?? 0)
  const newKey = () => ++lastKey.current
  const [saving, setSaving] = useState(false)
  // An object, not a string: the same message twice in a row is still a new problem,
  // so the effect below scrolls to it again.
  const [problem, setProblem] = useState<{ message: string } | null>(null)

  useEffect(() => {
    // An edit keeps showing its department and sizes, even if archived since (#33); the database
    // says whether they are still valid for the date.
    Promise.all([
      fetchAreas(entry ? [entry.areaId] : []),
      fetchAnilladoSizes(entry?.anillados.map((a) => a.sizeMm) ?? []),
      fetchAdminAccounts(),
      fetchVagueDescriptions(),
    ])
      .then(([areas, sizes, all, vague]) => {
        // Archived accounts can't be chosen for a new entry, but an entry of one keeps its name.
        const accounts = all.filter((a) => !a.archived || a.id === entry?.accountId)
        setLists({ areas, sizes, accounts, vague })
      })
      .catch(() => setListsError(true))
  }, [entry])

  // The message is at the top, the buttons at the bottom: scroll up on every new message.
  useEffect(() => {
    if (problem) scrollToTop()
  }, [problem])

  const account = lists?.accounts.find((a) => a.id === accountId) ?? null
  const firstStart = periods[0]?.start ?? ''
  // An edit: only if it moves the entry to another period. A new entry: outside the current one.
  const periodWarning = entry
    ? movedPeriodWarning(entry.entryDate, entryDate, periods)
    : newEntryPeriodWarning(entryDate, periods.find((p) => p.isCurrent) ?? null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (account === null) {
      setProblem({ message: 'Elija un nombre de la lista.' })
      return
    }
    const changes = {
      accountId: account.id,
      entryDate,
      areaId: Number(areaId),
      description: description.trim(),
      copias: copias === '' ? 0 : Number(copias),
      anillados: anillados.map((row) => ({
        sizeMm: Number(row.sizeMm),
        quantity: Number(row.quantity),
      })),
    }
    // A quick message; the database checks the same again (#3).
    const refusal =
      checkEntryDate(changes.entryDate, firstStart) ??
      checkDescription(changes.description, lists?.vague ?? []) ??
      checkEntryContents(
        changes.copias,
        changes.anillados.map((a) => a.quantity),
      )
    if (refusal) {
      setProblem({ message: refusal })
      return
    }
    setSaving(true)
    setProblem(null)
    try {
      if (entry) {
        await updateEntry(entry.id, changes)
        onSaved()
      } else {
        const id = await registerManualEntry(changes)
        onSaved({ id, name: account.name, entryDate: changes.entryDate })
      }
    } catch (error) {
      setProblem({ message: adminErrorMessage(error) })
      setSaving(false)
    }
  }

  if (listsError) {
    return <p className="notice">No se pudo cargar el formulario. Recargue la página.</p>
  }
  if (lists === null) {
    return <p className="notice">Cargando…</p>
  }

  return (
    <form onSubmit={handleSubmit} className="entry-editor">
      {entry ? (
        <h2>
          Modificar el pedido de {entry.name} del {formatDate(entry.entryDate)}
        </h2>
      ) : (
        <>
          <h2>Registrar un pedido del cuaderno</h2>
          <p className="hint">
            Para pedidos anotados en el cuaderno, p. ej. cuando no hubo conexión. Se verá como
            «Ingreso manual» en esta lista, no en los reportes.
          </p>
        </>
      )}

      <div className="result">
        {problem && (
          <div className="message error" role="alert">
            <strong>✗ No se guardó</strong>
            <p>{problem.message}</p>
          </div>
        )}
      </div>

      <fieldset>
        <legend>Datos</legend>

        <AccountPicker
          accounts={lists.accounts}
          selected={account}
          operator
          onSelect={(chosen) => {
            setAccountId(chosen?.id ?? null)
            // A new entry starts in the person's main department, as on the staff form;
            // an edit keeps its department.
            if (!entry && chosen) setAreaId(String(chosen.defaultAreaId))
            setOutsideConfirmed(false)
          }}
        />
        {entry?.accountId === null && account === null && (
          <p className="hint">
            Este pedido se registró antes de las cuentas: elija la cuenta de {entry.name}.
          </p>
        )}

        <label>
          Fecha
          <input
            type="date"
            required
            min={firstStart || undefined}
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </label>
        {periodWarning && (
          <div className="warning" role="status">
            <p>⚠ {periodWarning}</p>
          </div>
        )}

        <AreaSelect
          areas={lists.areas}
          account={account}
          forName={account?.name ?? entry?.name ?? 'esta persona'}
          value={areaId}
          onChange={(value) => {
            setAreaId(value)
            setOutsideConfirmed(false)
          }}
          confirmed={outsideConfirmed}
          onConfirm={setOutsideConfirmed}
        />

        <label>
          Descripción
          <input
            type="text"
            required
            pattern=".*\S.*"
            autoComplete="off"
            title="Escriba qué se fotocopió, p. ej. Exámenes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Pedido</legend>

        <label>
          Copias
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={copias}
            onChange={(e) => setCopias(e.target.value)}
          />
        </label>

        <AnilladosField rows={anillados} sizes={lists.sizes} onChange={setAnillados} newKey={newKey} />
      </fieldset>

      <div className="editor-actions">
        <button type="button" className="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'Guardando…' : entry ? 'Guardar cambios' : 'Registrar pedido'}
        </button>
      </div>
    </form>
  )
}
