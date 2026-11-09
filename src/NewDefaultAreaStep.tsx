import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { withNewDefault } from './domain/areaSelection'
import { pinDigits } from './domain/pin'
import { updateOwnAccount, type Account } from './lib/accounts'
import { isOwnAccountRefusal, ownAccountErrorMessage } from './lib/accountErrors'
import type { Area } from './lib/entries'
import { scrollToTopOfScreen } from './scrollToTop'

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'rejected'; message: string } // fixable on the spot (wrong PIN, …)
  | { kind: 'failed'; message: string } // connection or server: the notebook takes over

type Props = {
  account: Account
  areas: Area[] // the departments in use (archived ones are not listed)
  onSaved: (changes: { areaIds: number[]; defaultAreaId: number; pin: string }) => void
}

// The operator archived the person's main department (#33): they choose another, confirmed with
// their PIN, before registering (#115, PO 08/11). Saved like "Mi cuenta" (0019), keeping the name;
// archived departments leave the account. Inside the entry form, so Enter is handled here.
export function NewDefaultAreaStep({ account, areas, onSaved }: Props) {
  const own = areas.filter((area) => account.areaIds.includes(area.id))
  const others = areas.filter((area) => !account.areaIds.includes(area.id))
  const [areaId, setAreaId] = useState(own.length === 1 ? String(own[0].id) : '')
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const panel = useRef<HTMLFieldSetElement>(null)

  // The name was just chosen with the keyboard open: once it has closed, bring the step to the top.
  useEffect(() => {
    if (panel.current) scrollToTopOfScreen(panel.current)
  }, [])

  async function save() {
    if (areaId === '') {
      setStatus({ kind: 'rejected', message: 'Elija su nueva área principal.' })
      return
    }
    if (pin.length !== 4) {
      setStatus({ kind: 'rejected', message: 'Escriba su PIN de 4 números.' })
      return
    }
    const changes = withNewDefault(
      account.areaIds,
      areas.map((area) => area.id),
      Number(areaId),
    )
    setStatus({ kind: 'saving' })
    try {
      await updateOwnAccount(account.id, pin, { name: account.name, ...changes, newPin: null })
      onSaved({ ...changes, pin })
    } catch (error) {
      const message = ownAccountErrorMessage(error)
      if (isOwnAccountRefusal(error)) {
        setPin('')
        setStatus({ kind: 'rejected', message })
      } else {
        setStatus({ kind: 'failed', message })
      }
    }
  }

  // Enter in the PIN field saves this step, not the whole entry.
  function handleEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    void save()
  }

  return (
    <fieldset className="panel new-pin" ref={panel}>
      <legend>Nueva área principal</legend>
      <p className="hint">
        Su área principal fue archivada y ya no se puede usar en los pedidos. Elija otra para
        continuar.
      </p>

      {status.kind === 'rejected' && (
        <div className="message error" role="alert">
          <strong>✗ No se guardó el área</strong>
          <p>{status.message}</p>
        </div>
      )}
      {status.kind === 'failed' && (
        <div className="message error" role="alert">
          <strong>✗ No se pudo guardar el área</strong>
          <p>Por favor, anote su pedido en el cuaderno.</p>
          <small>Detalle: {status.message}</small>
        </div>
      )}

      <label>
        Área principal
        <select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
          <option value="" disabled>
            Elija su área principal
          </option>
          {own.length > 0 ? (
            <>
              <optgroup label="Sus áreas">
                {own.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Otras áreas">
                {others.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </optgroup>
            </>
          ) : (
            others.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))
          )}
        </select>
      </label>

      {/* Hidden digits without type="password" (see AccountForm). */}
      <label>
        Su PIN
        <input
          type="text"
          className="pin"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(pinDigits(e.target.value))}
          onKeyDown={handleEnter}
        />
      </label>

      <button
        type="button"
        className="primary"
        disabled={status.kind === 'saving'}
        onClick={() => void save()}
      >
        {status.kind === 'saving' ? 'Guardando…' : 'Guardar área principal'}
      </button>
    </fieldset>
  )
}
