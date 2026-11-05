import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { checkPin, pinDigits } from './domain/pin'
import { setNewPin, type Account } from './lib/accounts'
import { ENTRY_MESSAGES, entryErrorMessage, isRefusal } from './lib/entryErrors'
import { scrollToTopOfScreen } from './scrollToTop'

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'rejected'; message: string } // fixable on the spot (PINs differ, …)
  | { kind: 'failed'; message: string } // connection or server: the notebook takes over

type Props = {
  account: Account
  notice: string | null // why the step appeared, if not from the start (e.g. reset just launched)
  onSaved: (pin: string) => void
  onCancelled: (message: string) => void // the operator cancelled the reset meanwhile
}

// After the operator reset someone's PIN (#31): the person chooses a new one, typed twice, before
// registering. Inside the entry form, so it has no form of its own: Enter is handled here.
export function NewPinStep({ account, notice, onSaved, onCancelled }: Props) {
  const [pin, setPin] = useState('')
  const [pinAgain, setPinAgain] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const panel = useRef<HTMLFieldSetElement>(null)

  // The name was just chosen with the keyboard open (or a save just failed): once the keyboard
  // has closed, bring the whole step to the top of the screen, its title included.
  useEffect(() => {
    if (panel.current) scrollToTopOfScreen(panel.current)
  }, [])

  async function save() {
    const problem = checkPin(pin, pinAgain)
    if (problem) {
      setStatus({ kind: 'rejected', message: problem })
      return
    }
    setStatus({ kind: 'saving' })
    try {
      await setNewPin(account.id, pin)
      onSaved(pin)
    } catch (error) {
      const message = entryErrorMessage(error)
      if (message === ENTRY_MESSAGES.pin_reset_not_pending) {
        onCancelled(message)
      } else if (isRefusal(error)) {
        setStatus({ kind: 'rejected', message })
      } else {
        setStatus({ kind: 'failed', message })
      }
    }
  }

  // Enter in a PIN field saves the PIN, not the whole entry.
  function handleEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    void save()
  }

  return (
    <fieldset className="panel new-pin" ref={panel}>
      <legend>PIN nuevo</legend>
      {notice && (
        <div className="warning" role="status">
          <p>⚠ {notice}</p>
        </div>
      )}
      <p className="hint">
        La operadora reinició su PIN. Elija 4 números nuevos. No los comparta: nadie más puede
        verlos.
      </p>

      {status.kind === 'rejected' && (
        <div className="message error" role="alert">
          <strong>✗ No se guardó el PIN</strong>
          <p>{status.message}</p>
        </div>
      )}
      {status.kind === 'failed' && (
        <div className="message error" role="alert">
          <strong>✗ No se pudo guardar el PIN</strong>
          <p>Por favor, anote su pedido en el cuaderno.</p>
          <small>Detalle: {status.message}</small>
        </div>
      )}

      {/* Hidden digits without type="password" (see AccountForm). */}
      <label>
        PIN nuevo
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
      <label>
        Repita el PIN nuevo
        <input
          type="text"
          className="pin"
          inputMode="numeric"
          autoComplete="off"
          value={pinAgain}
          onChange={(e) => setPinAgain(pinDigits(e.target.value))}
          onKeyDown={handleEnter}
        />
      </label>

      <button
        type="button"
        className="primary"
        disabled={status.kind === 'saving'}
        onClick={() => void save()}
      >
        {status.kind === 'saving' ? 'Guardando…' : 'Guardar PIN nuevo'}
      </button>
    </fieldset>
  )
}
