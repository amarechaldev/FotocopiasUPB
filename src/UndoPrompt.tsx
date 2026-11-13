import { useEffect, useEffectEvent, useRef, useState, type KeyboardEvent } from 'react'
import { pinDigits } from './domain/pin'
import { undoEntry } from './lib/entries'
import {
  UNDO_PROMPT_MS,
  cancelledMessage,
  expiredMessage,
  undoErrorStep,
  undoResultStep,
  type UndoStep,
} from './lib/undoMessages'

type Props = {
  entryId: number
  onBusy: (busy: boolean) => void // the form is locked while the undo is on its way
  onUndone: (pin: string) => void
  onClosed: (message: string) => void // the entry stays saved (or nobody knows: see the message)
}

// Asks the PIN again to undo the entry just saved (#20). It sits inside the saved message, so
// starting a new entry, which hides that message, closes it too; the form stays usable meanwhile.
// Not a <form>: it is inside the entry form, and forms cannot be nested.
export function UndoPrompt({ entryId, onBusy, onUndone, onClosed }: Props) {
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  // Refs: read by the timer and after the request, which see the values of an older draw.
  const busyRef = useRef(false)
  const unsure = useRef(false) // the last try got no answer
  const expired = useRef(false) // the minute ended while a request was on its way

  // Closes by itself after 1 minute, but never in the middle of a request: then the answer decides.
  // An effect event sees the latest props without being a dependency: the timer starts once, when
  // the prompt opens, and the minute counts from then.
  const expire = useEffectEvent(() => {
    if (busyRef.current) expired.current = true
    else onClosed(expiredMessage(entryId, unsure.current))
  })
  useEffect(() => {
    const timer = setTimeout(expire, UNDO_PROMPT_MS)
    return () => clearTimeout(timer)
  }, [])

  function setRequest(value: boolean) {
    busyRef.current = value
    setBusy(value)
    onBusy(value)
  }

  async function submit() {
    if (busy) return
    if (pin.length !== 4) {
      setMessage('Escriba su PIN de 4 números.')
      return
    }
    setRequest(true)
    let step: UndoStep
    try {
      step = undoResultStep(entryId, await undoEntry(entryId, pin))
    } catch (error) {
      step = undoErrorStep(entryId, error)
    }
    setRequest(false)

    if (step.kind === 'removed') {
      onUndone(pin)
    } else if (step.kind === 'closed') {
      onClosed(step.message)
    } else if (expired.current) {
      onClosed(expiredMessage(entryId, step.unsure))
    } else {
      unsure.current = step.unsure
      setMessage(step.message)
      if (!step.unsure) setPin('') // wrong PIN: type it again; no answer: the same PIN is retried
    }
  }

  // Enter in the PIN field would send the entry form around this prompt.
  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <div className="undo">
      {/* Hidden digits without type="password" (see AccountForm); no required/pattern: they would
          stop the entry form around it from being sent. */}
      <label>
        Para deshacer el registro n.º {entryId}, escriba su PIN
        <input
          type="text"
          className="pin"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          disabled={busy}
          onChange={(e) => setPin(pinDigits(e.target.value))}
          onKeyDown={handleKey}
        />
      </label>
      {message && (
        <p className="undo-message" role="alert">
          {message}
        </p>
      )}
      <button type="button" className="primary" disabled={busy} onClick={() => void submit()}>
        {busy ? 'Deshaciendo…' : 'Deshacer registro'}
      </button>
      <button
        type="button"
        className="secondary"
        disabled={busy}
        onClick={() => onClosed(unsure.current ? expiredMessage(entryId, true) : cancelledMessage(entryId))}
      >
        Cancelar
      </button>
    </div>
  )
}
