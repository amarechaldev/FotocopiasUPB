import { useEffect, useState, type FormEvent } from 'react'
import { chooseDefault, noAreas, toggleArea, type AreaSelection } from './domain/areaSelection'
import { checkPin, pinDigits } from './domain/pin'
import { ACCOUNT_MESSAGES, accountErrorMessage } from './lib/accountErrors'
import { createAccount } from './lib/accounts'
import { fetchAreas, type Area } from './lib/entries'
import { scrollToTop } from './scrollToTop'

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'failed'; message: string }

// What the entry screen needs to choose the new name and welcome its owner.
export type CreatedAccount = {
  id: number
  name: string
  defaultAreaName: string
}

type Props = {
  onCreated: (account: CreatedAccount) => void // opens the entry screen (#57)
}

export function AccountForm({ onCreated }: Props) {
  const [areas, setAreas] = useState<Area[] | null>(null)
  const [areasError, setAreasError] = useState(false)
  const [name, setName] = useState('')
  const [selection, setSelection] = useState<AreaSelection>(noAreas)
  const [pin, setPin] = useState('')
  const [pinAgain, setPinAgain] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    fetchAreas()
      .then(setAreas)
      .catch(() => setAreasError(true))
  }, [])

  // The message is at the top, the button at the bottom: scroll up on every new
  // message, including a second error in a row (same kind, new message).
  useEffect(() => {
    if (status.kind === 'failed') scrollToTop()
  }, [status])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (selection.areaIds.length === 0 || selection.defaultAreaId === null) {
      setStatus({ kind: 'failed', message: ACCOUNT_MESSAGES.areas_required })
      return
    }
    const pinProblem = checkPin(pin, pinAgain)
    if (pinProblem) {
      setStatus({ kind: 'failed', message: pinProblem })
      return
    }

    setStatus({ kind: 'saving' })
    const defaultAreaId = selection.defaultAreaId
    try {
      const id = await createAccount({
        name: name.trim(),
        pin,
        areaIds: selection.areaIds,
        defaultAreaId,
      })
      // On to the entry screen, where the green message is shown (#57).
      onCreated({
        id,
        name: name.trim().replace(/\s+/g, ' '),
        defaultAreaName: areas?.find((area) => area.id === defaultAreaId)?.name ?? '',
      })
    } catch (error) {
      setStatus({ kind: 'failed', message: accountErrorMessage(error) })
    }
  }

  if (areasError) {
    return <p className="notice">No se pudo cargar la lista de áreas. Intente más tarde.</p>
  }
  if (areas === null) {
    return <p className="notice">Cargando…</p>
  }

  const chosenAreas = areas.filter((area) => selection.areaIds.includes(area.id))

  return (
    <form onSubmit={handleSubmit}>
      <div className="result">
        {status.kind === 'failed' && (
          <div className="message error" role="alert">
            <strong>✗ No se pudo crear la cuenta</strong>
            <p>{status.message}</p>
          </div>
        )}
      </div>

      <fieldset>
        <legend>Nueva cuenta</legend>

        <label>
          Nombre y apellido
          <input
            type="text"
            required
            pattern=".*\S.*"
            autoComplete="off"
            autoCapitalize="words"
            title="Escriba su nombre y apellido"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Sus áreas</legend>
        <p className="hint">Marque todas las áreas para las que hace pedidos.</p>
        <div className="choices">
          {areas.map((area) => (
            <label key={area.id} className="choice">
              <input
                type="checkbox"
                checked={selection.areaIds.includes(area.id)}
                onChange={() => setSelection((current) => toggleArea(current, area.id))}
              />
              {area.name}
            </label>
          ))}
        </div>
      </fieldset>

      {chosenAreas.length > 1 && (
        <fieldset className="panel">
          <legend>Área principal</legend>
          <p className="hint">
            Al registrar un pedido, esta área aparecerá ya elegida. Si un pedido es para otra de
            sus áreas, podrá elegirla en ese pedido.
          </p>
          <div className="choices">
            {chosenAreas.map((area) => (
              <label key={area.id} className="choice">
                <input
                  type="radio"
                  name="default-area"
                  checked={selection.defaultAreaId === area.id}
                  onChange={() => setSelection((current) => chooseDefault(current, area.id))}
                />
                {area.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend>PIN</legend>
        <p className="hint">Elija 4 números. No los comparta: nadie más puede ver su PIN.</p>

        {/* Text fields with hidden digits rather than type="password", so that
            Chrome does not offer to save the PIN on the shared device. */}
        <label>
          PIN
          <input
            type="text"
            className="pin"
            inputMode="numeric"
            autoComplete="off"
            required
            value={pin}
            onChange={(e) => setPin(pinDigits(e.target.value))}
          />
        </label>

        <label>
          Repita el PIN
          <input
            type="text"
            className="pin"
            inputMode="numeric"
            autoComplete="off"
            required
            value={pinAgain}
            onChange={(e) => setPinAgain(pinDigits(e.target.value))}
          />
        </label>
      </fieldset>

      <button type="submit" className="primary" disabled={status.kind === 'saving'}>
        {status.kind === 'saving' ? 'Creando…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
