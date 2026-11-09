import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useScrolledIntoView } from './scrollToTop'

type Props = {
  question: string // e.g. "¿Eliminar el área Marketing?"
  detail: string // what happens, e.g. "No se puede deshacer."
  children?: ReactNode // more to know first, e.g. the accounts that still have a department
  canConfirm?: boolean // false: it cannot be deleted yet; only "Cerrar" is offered
  onConfirm: () => Promise<void>
  onCancel: () => void
}

// Asks before deleting, in the app's own style instead of the browser's confirm box (PO, 08/11).
// It comes into view where it opens, and "Cancelar" has the focus, so pressing Enter by accident
// deletes nothing.
export function ConfirmPanel({ question, detail, children, canConfirm = true, onConfirm, onCancel }: Props) {
  const [busy, setBusy] = useState(false)
  const panel = useScrolledIntoView<HTMLDivElement>('center')
  const cancel = useRef<HTMLButtonElement>(null)

  useEffect(() => {
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
      {children}
      <div className="period-end-actions">
        {canConfirm && (
          <button type="button" className="danger" disabled={busy} onClick={confirm}>
            {busy ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        )}
        <button type="button" className="secondary" disabled={busy} onClick={onCancel} ref={cancel}>
          {canConfirm ? 'Cancelar' : 'Cerrar'}
        </button>
      </div>
    </div>
  )
}
