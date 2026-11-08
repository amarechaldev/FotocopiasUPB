import { useEffect, useRef, useState } from 'react'

type Props = {
  question: string // e.g. "¿Eliminar el área Marketing?"
  detail: string // what happens, e.g. "No se puede deshacer."
  onConfirm: () => Promise<void>
  onCancel: () => void
}

// Asks before deleting, in the app's own style instead of the browser's confirm box (PO, 08/11).
// It comes into view where it opens, and "Cancelar" has the focus, so pressing Enter by accident
// deletes nothing.
export function ConfirmPanel({ question, detail, onConfirm, onCancel }: Props) {
  const [busy, setBusy] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    panel.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    cancel.current?.focus({ preventScroll: true })
  }, [])

  async function confirm() {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="list-form" role="alertdialog" aria-labelledby="confirm-question" ref={panel}>
      <strong id="confirm-question">{question}</strong>
      <p className="hint">{detail}</p>
      <div className="period-end-actions">
        <button type="button" className="danger" disabled={busy} onClick={confirm}>
          {busy ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
        <button type="button" className="secondary" disabled={busy} onClick={onCancel} ref={cancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
