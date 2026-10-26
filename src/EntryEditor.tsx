import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AccountPicker } from './AccountPicker'
import { AnilladosField, type AnilladoRow } from './AnilladosField'
import { AreaSelect } from './AreaSelect'
import { formatDate } from './domain/dates'
import type { ListedEntry } from './domain/entryList'
import { checkEntryContents } from './domain/entryRules'
import { fetchAccounts, type Account } from './lib/accounts'
import { updateEntry } from './lib/adminEntries'
import { adminErrorMessage } from './lib/adminErrors'
import { fetchAnilladoSizes, fetchAreas, type Area } from './lib/entries'

type Lists = {
  areas: Area[]
  sizes: number[]
  accounts: Account[]
}

type Props = {
  entry: ListedEntry
  onSaved: () => void
  onCancel: () => void
}

// The operator's form to change one entry. Checked like a new entry (the database checks
// again); saving marks the entry as modified.
export function EntryEditor({ entry, onSaved, onCancel }: Props) {
  const [lists, setLists] = useState<Lists | null>(null)
  const [listsError, setListsError] = useState(false)
  const [accountId, setAccountId] = useState<number | null>(entry.accountId)
  const [entryDate, setEntryDate] = useState(entry.entryDate)
  const [areaId, setAreaId] = useState(String(entry.areaId))
  const [outsideConfirmed, setOutsideConfirmed] = useState(false)
  const [description, setDescription] = useState(entry.description)
  const [copias, setCopias] = useState(String(entry.copias))
  // The entry's anillados get keys 1, 2, …; rows added later continue from there.
  const [anillados, setAnillados] = useState<AnilladoRow[]>(() =>
    entry.anillados.map((a, i) => ({
      key: i + 1,
      sizeMm: String(a.sizeMm),
      quantity: String(a.quantity),
    })),
  )
  const lastKey = useRef(entry.anillados.length)
  const newKey = () => ++lastKey.current
  const [saving, setSaving] = useState(false)
  // An object, not a string: the same message twice in a row is still a new problem,
  // so the effect below scrolls to it again.
  const [problem, setProblem] = useState<{ message: string } | null>(null)

  useEffect(() => {
    Promise.all([fetchAreas(), fetchAnilladoSizes(), fetchAccounts()])
      .then(([areas, sizes, accounts]) => setLists({ areas, sizes, accounts }))
      .catch(() => setListsError(true))
  }, [])

  // The message is at the top, the buttons at the bottom: bring every new message into view.
  const messageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (problem) messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [problem])

  const account = lists?.accounts.find((a) => a.id === accountId) ?? null

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
    const contentsProblem = checkEntryContents(
      changes.copias,
      changes.anillados.map((a) => a.quantity),
    )
    if (contentsProblem) {
      setProblem({ message: contentsProblem })
      return
    }
    setSaving(true)
    setProblem(null)
    try {
      await updateEntry(entry.id, changes)
      onSaved()
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
      <h2>
        Modificar el pedido de {entry.name} del {formatDate(entry.entryDate)}
      </h2>

      <div ref={messageRef} className="result">
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
            setOutsideConfirmed(false)
          }}
        />
        {entry.accountId === null && account === null && (
          <p className="hint">
            Este pedido se registró antes de las cuentas: elija la cuenta de {entry.name}.
          </p>
        )}

        <label>
          Fecha
          <input
            type="date"
            required
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </label>

        <AreaSelect
          areas={lists.areas}
          account={account}
          forName={account?.name ?? entry.name}
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
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
