import { useEffect, useRef, useState, type FormEvent } from 'react'
import { chooseDefault, noAreas, toggleArea, type AreaSelection } from './domain/areaSelection'
import { checkPin } from './domain/pin'
import { ACCOUNT_MESSAGES, accountErrorMessage } from './lib/accountErrors'
import { createAccount } from './lib/accounts'
import { fetchAreas, type Area } from './lib/entries'

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'created'; name: string; defaultAreaName: string }
  | { kind: 'failed'; message: string }

export function AccountForm() {
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
  const messageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (status.kind === 'created' || status.kind === 'failed') {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [status])

  // The confirmation belongs to the previous person.
  function clearConfirmation() {
    setStatus((current) => (current.kind === 'created' ? { kind: 'idle' } : current))
  }

  // Digits only, at most 4: the numeric keyboard can still type "." or ",".
  function pinValue(text: string) {
    clearConfirmation()
    return text.replace(/\D/g, '').slice(0, 4)
  }

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
      await createAccount({ name: name.trim(), pin, areaIds: selection.areaIds, defaultAreaId })
      setStatus({
        kind: 'created',
        name: name.trim().replace(/\s+/g, ' '),
        defaultAreaName: areas?.find((area) => area.id === defaultAreaId)?.name ?? '',
      })
      setName('')
      setSelection(noAreas)
      setPin('')
      setPinAgain('')
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
      <div ref={messageRef} className="result">
        {status.kind === 'created' && (
          <div className="message success" role="status">
            <strong>✓ Cuenta creada</strong>
            <p>
              {status.name} · Área principal: {status.defaultAreaName}
            </p>
            <p>Ya puede registrar sus pedidos con su nombre y su PIN.</p>
          </div>
        )}
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
            onChange={(e) => {
              setName(e.target.value)
              clearConfirmation()
            }}
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
                onChange={() => {
                  setSelection((current) => toggleArea(current, area.id))
                  clearConfirmation()
                }}
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
            onChange={(e) => setPin(pinValue(e.target.value))}
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
            onChange={(e) => setPinAgain(pinValue(e.target.value))}
          />
        </label>
      </fieldset>

      <button type="submit" className="primary" disabled={status.kind === 'saving'}>
        {status.kind === 'saving' ? 'Creando…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
