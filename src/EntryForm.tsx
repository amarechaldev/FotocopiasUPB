import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AccountPicker } from './AccountPicker'
import { AnilladosField, type AnilladoRow } from './AnilladosField'
import { AreaSelect } from './AreaSelect'
import { DescriptionField } from './DescriptionField'
import type { CommonDescription } from './domain/descriptions'
import { todayInBolivia } from './domain/dates'
import {
  checkDescription,
  checkEntryContents,
  checkEntryDate,
  newEntryPeriodWarning,
} from './domain/entryRules'
import { pinDigits } from './domain/pin'
import { describeContents } from './domain/summary'
import type { CreatedAccount } from './AccountForm'
import { fetchAccounts, type Account } from './lib/accounts'
import {
  fetchAnilladoSizes,
  fetchAreas,
  fetchCommonDescriptions,
  fetchCurrentPeriod,
  fetchVagueDescriptions,
  registerAccountEntry,
  type Area,
  type CurrentPeriod,
} from './lib/entries'
import { ENTRY_MESSAGES, entryErrorMessage, isRefusal } from './lib/entryErrors'
import { NewPinStep } from './NewPinStep'
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
  vague: string[] // too-vague descriptions
  common: CommonDescription[] // suggested, by department
  period: CurrentPeriod
}

type Props = {
  createdAccount?: CreatedAccount | null // just created: chosen and welcomed (#57)
  profileSaved?: string | null // the name just saved in "Mi cuenta" (#30): logged out, says why
  onCreateAccount: () => void // a name without an account: go to "Crear cuenta"
}

export function EntryForm({ createdAccount = null, profileSaved = null, onCreateAccount }: Props) {
  const [lists, setLists] = useState<Lists | null>(null)
  const [listsError, setListsError] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)
  const [fields, setFields] = useState<Fields>(emptyFields)
  const [anillados, setAnillados] = useState<AnilladoRow[]>([])
  const [outsideConfirmed, setOutsideConfirmed] = useState(false)
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  // Kept apart from status: typing clears a confirmation, but this one stays while the new
  // account's owner fills their first entry.
  const [welcome, setWelcome] = useState<CreatedAccount | null>(createdAccount)
  const [savedProfile, setSavedProfile] = useState<string | null>(profileSaved)
  // PIN reset (#31): why the new-PIN step appeared late (the list was older than the reset), and
  // the green message once the new PIN is saved.
  const [pinNotice, setPinNotice] = useState<string | null>(null)
  const [pinSaved, setPinSaved] = useState(false)

  // A counter that survives redraws without causing one (unlike state).
  const lastKey = useRef(0)
  const newKey = () => ++lastKey.current

  // The account the form was opened with, read only when it first appears: a later change
  // of the prop must not choose a name again.
  const arrivedWith = useRef(createdAccount)

  // Load the lists once, when the form first appears. Switching to "Crear cuenta"
  // and back draws the form again, so a new account shows up in the names.
  useEffect(() => {
    Promise.all([
      fetchAreas(),
      fetchAnilladoSizes(),
      fetchAccounts(),
      fetchVagueDescriptions(),
      fetchCommonDescriptions(),
      fetchCurrentPeriod(),
    ])
      .then(([areas, sizes, accounts, vague, common, period]) => {
        setLists({ areas, sizes, accounts, vague, common, period })
        // Straight from "Crear cuenta": the new name is already chosen (#57).
        const created = accounts.find((a) => a.id === arrivedWith.current?.id)
        if (created) {
          setAccount(created)
          setFields((current) => ({ ...current, areaId: String(created.defaultAreaId) }))
        }
      })
      .catch(() => setListsError(true))
  }, [])

  // Arriving from "Crear cuenta" or "Mi cuenta", whose buttons were at the bottom of a long form.
  const arrivedSaved = useRef(profileSaved)
  useEffect(() => {
    if (arrivedWith.current || arrivedSaved.current) scrollToTop()
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
    setWelcome(null) // "Cambiar": maybe someone else now
    setSavedProfile(null) // the next person has started
    setPinNotice(null)
    setPinSaved(false)
    if (chosen) update('areaId', String(chosen.defaultAreaId))
    setOutsideConfirmed(false)
    clearConfirmation()
  }

  // The operator started or cancelled a reset after the list was loaded: the chosen account and
  // the list follow the database.
  function markPinReset(accountId: number, pending: boolean) {
    const change = (a: Account) => (a.id === accountId ? { ...a, pinResetPending: pending } : a)
    setAccount((current) => (current ? change(current) : current))
    setLists((current) => current && { ...current, accounts: current.accounts.map(change) })
  }

  // The new PIN is saved: the form opens, with the PIN field already filled (typed twice just now).
  function handleNewPin(newPin: string) {
    if (account) markPinReset(account.id, false)
    setPin(newPin)
    setPinNotice(null)
    setPinSaved(true)
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
    // A quick message; the database checks the same again (#3).
    const problem =
      checkEntryDate(entry.entryDate, lists?.period.firstStart ?? '') ??
      checkDescription(entry.description, lists?.vague ?? []) ??
      checkEntryContents(
        entry.copias,
        entry.anillados.map((a) => a.quantity),
      )
    if (problem) {
      setStatus({ kind: 'rejected', message: problem })
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
      setWelcome(null)
      setSavedProfile(null)
      setPinSaved(false)
      setPin('')
      setOutsideConfirmed(false)
      setFields(emptyFields())
      setAnillados([])
    } catch (error) {
      if (entryErrorMessage(error) === ENTRY_MESSAGES.pin_reset_pending) {
        // Reset after the list was loaded: the new-PIN step appears (and scrolls itself into
        // view, with this notice); the entry is kept.
        markPinReset(account.id, true)
        setPin('')
        setPinNotice(entryErrorMessage(error))
        setStatus({ kind: 'idle' })
      } else if (isRefusal(error)) {
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

  // Nothing can be filled before a real name is chosen (#56), nor before a new PIN is chosen
  // after a reset (#31); what was typed is kept. A disabled fieldset disables every field inside it.
  const locked = account === null || account.pinResetPending
  const periodWarning = newEntryPeriodWarning(fields.entryDate, lists.period.current)

  return (
    <form onSubmit={handleSubmit}>
      <div className="result">
        {/* Hidden behind a failure message, so only the red one shows. */}
        {welcome && (status.kind === 'idle' || status.kind === 'saving') && (
          <div className="message success" role="status">
            <strong>✓ Cuenta creada</strong>
            <p>
              {welcome.name} · Área principal: {welcome.defaultAreaName}
            </p>
            <p>Ahora registre su pedido.</p>
          </div>
        )}
        {savedProfile && (status.kind === 'idle' || status.kind === 'saving') && (
          <div className="message success" role="status">
            <strong>✓ Cambios guardados</strong>
            <p>{savedProfile}</p>
            <p>
              Por seguridad, su sesión se cerró. Para registrar un pedido, elija su nombre de nuevo.
            </p>
          </div>
        )}
        {pinSaved && (status.kind === 'idle' || status.kind === 'saving') && (
          <div className="message success" role="status">
            <strong>✓ PIN nuevo guardado</strong>
            <p>Ahora registre su pedido.</p>
          </div>
        )}
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

        <AccountPicker
          accounts={lists.accounts}
          selected={account}
          onSelect={selectAccount}
          onCreateAccount={onCreateAccount}
        />

        {account?.pinResetPending && (
          <NewPinStep
            key={account.id} // another person: empty fields
            account={account}
            notice={pinNotice}
            onSaved={handleNewPin}
            onCancelled={(message) => {
              // The operator cancelled the reset meanwhile: the usual PIN field is back.
              markPinReset(account.id, false)
              setPinNotice(null)
              setStatus({ kind: 'rejected', message })
            }}
          />
        )}

        <fieldset disabled={locked}>
          <label>
            Fecha
            <input
              type="date"
              required
              min={lists.period.firstStart}
              value={fields.entryDate}
              onChange={(e) => update('entryDate', e.target.value)}
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
            value={fields.areaId}
            onChange={selectArea}
            confirmed={outsideConfirmed}
            onConfirm={setOutsideConfirmed}
          />

          <DescriptionField
            common={lists.common}
            areaId={fields.areaId === '' ? null : Number(fields.areaId)}
            value={fields.description}
            onChange={(value) => update('description', value)}
          />
        </fieldset>
      </fieldset>

      <fieldset disabled={locked}>
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

      <fieldset disabled={locked}>
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

      <button type="submit" className="primary" disabled={locked || status.kind === 'saving'}>
        {status.kind === 'saving' ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}
