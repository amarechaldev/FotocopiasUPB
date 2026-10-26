import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AccountPicker } from './AccountPicker'
import { AnilladosField, type AnilladoRow } from './AnilladosField'
import { AreaSelect } from './AreaSelect'
import { todayInBolivia } from './domain/dates'
import { checkEntryContents } from './domain/entryRules'
import { pinDigits } from './domain/pin'
import { describeContents } from './domain/summary'
import { fetchAccounts, type Account } from './lib/accounts'
import { fetchAnilladoSizes, fetchAreas, registerAccountEntry, type Area } from './lib/entries'
import { entryErrorMessage, isRefusal } from './lib/entryErrors'
import { scrollToTop } from './scrollToTop'

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; id: number; name: string; areaName: string; contents: string }
  // Something the person can fix right away (name, wrong PIN): no need for the notebook.
  | { kind: 'rejected'; message: string }
  // The entry could not be saved (connection, server): the notebook takes over.
  | { kind: 'failed'; message: string }

type Fields = {
  entryDate: string
  description: string
  areaId: string // '' until a department is chosen
  copias: string // text, so the field can be empty while typing
}

function emptyFields(): Fields {
  return { entryDate: todayInBolivia(), description: '', areaId: '', copias: '' }
}

type Lists = {
  areas: Area[]
  sizes: number[]
  accounts: Account[]
}

export function EntryForm() {
  const [lists, setLists] = useState<Lists | null>(null)
  const [listsError, setListsError] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)
  const [fields, setFields] = useState<Fields>(emptyFields)
  const [anillados, setAnillados] = useState<AnilladoRow[]>([])
  const [outsideConfirmed, setOutsideConfirmed] = useState(false)
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  // A counter that survives redraws without causing one (unlike state).
  const lastKey = useRef(0)
  const newKey = () => ++lastKey.current

  // Load the lists once, when the form first appears. Switching to "Crear cuenta"
  // and back draws the form again, so a new account shows up in the names.
  useEffect(() => {
    Promise.all([fetchAreas(), fetchAnilladoSizes(), fetchAccounts()])
      .then(([areas, sizes, accounts]) => setLists({ areas, sizes, accounts }))
      .catch(() => setListsError(true))
  }, [])

  // The Guardar button is at the bottom of a long form, so the result message
  // would appear off screen: scroll up on every new message.
  useEffect(() => {
    if (status.kind === 'saved' || status.kind === 'rejected' || status.kind === 'failed') {
      scrollToTop()
    }
  }, [status])

  // The confirmation belongs to the previous person: hide it as soon as
  // someone starts a new entry. A failure message stays until the next save.
  function clearConfirmation() {
    setStatus((current) => (current.kind === 'saved' ? { kind: 'idle' } : current))
  }

  function update(field: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
    clearConfirmation()
  }

  // Choosing a name selects that person's default department.
  function selectAccount(chosen: Account | null) {
    setAccount(chosen)
    if (chosen) update('areaId', String(chosen.defaultAreaId))
    setOutsideConfirmed(false)
    clearConfirmation()
  }

  function selectArea(areaId: string) {
    update('areaId', areaId)
    setOutsideConfirmed(false)
  }

  function updateAnillados(rows: AnilladoRow[]) {
    setAnillados(rows)
    clearConfirmation()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault() // stop the browser from reloading the page
    if (account === null) {
      setStatus({ kind: 'rejected', message: 'Elija su nombre de la lista.' })
      return
    }
    const entry = {
      accountId: account.id,
      pin,
      entryDate: fields.entryDate,
      areaId: Number(fields.areaId),
      description: fields.description.trim(),
      copias: fields.copias === '' ? 0 : Number(fields.copias),
      anillados: anillados.map((row) => ({
        sizeMm: Number(row.sizeMm),
        quantity: Number(row.quantity),
      })),
    }
    const contentsProblem = checkEntryContents(
      entry.copias,
      entry.anillados.map((a) => a.quantity),
    )
    if (contentsProblem) {
      setStatus({ kind: 'rejected', message: contentsProblem })
      return
    }
    setStatus({ kind: 'saving' })
    try {
      const id = await registerAccountEntry(entry)
      setStatus({
        kind: 'saved',
        id,
        name: account.name,
        areaName: lists?.areas.find((area) => area.id === entry.areaId)?.name ?? '',
        contents: describeContents(
          entry.copias,
          entry.anillados.map((a) => a.quantity),
        ),
      })
      // Logged out: the next person must choose their name and type their PIN.
      setAccount(null)
      setPin('')
      setOutsideConfirmed(false)
      setFields(emptyFields())
      setAnillados([])
    } catch (error) {
      if (isRefusal(error)) {
        setPin('') // wrong PIN: type it again; everything else is kept
        setStatus({ kind: 'rejected', message: entryErrorMessage(error) })
      } else {
        // The form keeps what was typed, so it can be copied into the notebook.
        setStatus({ kind: 'failed', message: entryErrorMessage(error) })
      }
    }
  }

  if (listsError) {
    return <p className="notice">No se pudo cargar el formulario. Por favor, use el cuaderno.</p>
  }
  if (lists === null) {
    return <p className="notice">Cargando…</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="result">
        {status.kind === 'saved' && (
          <div className="message success" role="status">
            <strong>✓ Registro guardado (n.º {status.id})</strong>
            <p>
              {status.name} · {status.areaName} · {status.contents}
            </p>
            <p>Sesión cerrada. Para otro pedido, elija su nombre de nuevo.</p>
          </div>
        )}
        {status.kind === 'rejected' && (
          <div className="message error" role="alert">
            <strong>✗ No se guardó</strong>
            <p>{status.message}</p>
          </div>
        )}
        {status.kind === 'failed' && (
          <div className="message error" role="alert">
            <strong>✗ No se pudo guardar</strong>
            <p>Por favor, anote este pedido en el cuaderno.</p>
            <small>Detalle: {status.message}</small>
          </div>
        )}
      </div>

      <fieldset>
        <legend>Datos</legend>

        <AccountPicker accounts={lists.accounts} selected={account} onSelect={selectAccount} />

        <label>
          Fecha
          <input
            type="date"
            required
            value={fields.entryDate}
            onChange={(e) => update('entryDate', e.target.value)}
          />
        </label>

        <AreaSelect
          areas={lists.areas}
          account={account}
          value={fields.areaId}
          onChange={selectArea}
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
            title="Escriba qué fotocopia, p. ej. Exámenes"
            value={fields.description}
            onChange={(e) => update('description', e.target.value)}
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
            value={fields.copias}
            onChange={(e) => update('copias', e.target.value)}
          />
        </label>

        <AnilladosField
          rows={anillados}
          sizes={lists.sizes}
          onChange={updateAnillados}
          newKey={newKey}
        />
      </fieldset>

      <fieldset>
        <legend>Confirmación</legend>
        <p className="hint">Su PIN confirma que este pedido es suyo.</p>

        {/* Hidden digits without type="password" (see AccountForm). */}
        <label>
          Su PIN
          <input
            type="text"
            className="pin"
            inputMode="numeric"
            autoComplete="off"
            required
            pattern="[0-9]{4}"
            title="Escriba su PIN de 4 números"
            value={pin}
            onChange={(e) => {
              setPin(pinDigits(e.target.value))
              clearConfirmation()
            }}
          />
        </label>
      </fieldset>

      <button type="submit" className="primary" disabled={status.kind === 'saving'}>
        {status.kind === 'saving' ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}
