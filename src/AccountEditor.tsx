import { useEffect, useState, type FormEvent } from 'react'
import { AreaChoices } from './AreaChoices'
import type { AreaSelection } from './domain/areaSelection'
import {
  accountAdminErrorMessage,
  deleteAccount,
  setAccountArchived,
  setPinReset,
  updateAccount,
  type AdminAccount,
} from './lib/adminAccounts'
import type { Area } from './lib/entries'
import { scrollToTop } from './scrollToTop'

type Props = {
  account: AdminAccount
  areas: Area[] // active departments
  onDone: (confirmation: string) => void // back to the list, with this green message
  onCancel: () => void
}

// One staff account, for the operator (#31): name and departments, PIN reset, archive, delete.
// The PIN itself is never shown.
export function AccountEditor({ account, areas, onDone, onCancel }: Props) {
  const [name, setName] = useState(account.name)
  const [selection, setSelection] = useState<AreaSelection>({
    areaIds: account.areaIds,
    defaultAreaId: account.defaultAreaId,
  })
  const [busy, setBusy] = useState(false)
  // An object, not a string: the same message twice in a row still scrolls to it.
  const [problem, setProblem] = useState<{ message: string } | null>(null)

  // The message is at the top, the buttons further down: scroll up on every new message.
  useEffect(() => {
    if (problem) scrollToTop()
  }, [problem])

  // Runs one change; on success, back to the list with its confirmation.
  async function act(action: () => Promise<void>, confirmation: string) {
    setBusy(true)
    setProblem(null)
    try {
      await action()
      onDone(confirmation)
    } catch (error) {
      setProblem({ message: accountAdminErrorMessage(error) })
      setBusy(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const defaultAreaId = selection.defaultAreaId
    if (selection.areaIds.length === 0 || defaultAreaId === null) {
      setProblem({ message: 'Elija al menos un área.' })
      return
    }
    const cleanName = name.trim().replace(/\s+/g, ' ')
    void act(
      () => updateAccount(account.id, { name: cleanName, areaIds: selection.areaIds, defaultAreaId }),
      `✓ Cuenta de ${cleanName} guardada.`,
    )
  }

  function handleDelete() {
    if (!window.confirm(`¿Eliminar la cuenta de ${account.name}? No se puede deshacer.`)) return
    void act(() => deleteAccount(account.id), `✓ Cuenta de ${account.name} eliminada.`)
  }

  return (
    <div className="account-editor">
      <h2>Cuenta de {account.name}</h2>

      <div className="result">
        {problem && (
          <div className="message error" role="alert">
            <strong>✗ No se guardó</strong>
            <p>{problem.message}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Datos</legend>
          <label>
            Nombre y apellido
            <input
              type="text"
              required
              pattern=".*\S.*"
              autoComplete="off"
              title="Escriba el nombre y apellido"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <p className="hint">Si cambia el nombre, también cambia en todos sus pedidos anteriores.</p>
        </fieldset>

        <AreaChoices
          areas={areas}
          selection={selection}
          onChange={setSelection}
          legend="Áreas"
          hint="Las áreas para las que esta persona hace pedidos."
          defaultHint="El área que aparece ya elegida cuando esta persona registra un pedido."
        />

        <div className="editor-actions">
          <button type="button" className="secondary" disabled={busy} onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <section className="account-action">
        <h3>PIN</h3>
        {account.pinResetPending ? (
          <>
            <p className="hint">
              Reinicio pendiente: la próxima vez que elija su nombre en la tablet, se le pedirá un
              PIN nuevo. Su PIN anterior no funciona mientras tanto.
            </p>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() =>
                act(
                  () => setPinReset(account.id, false),
                  `✓ Reinicio de PIN cancelado para ${account.name}: su PIN anterior vuelve a funcionar.`,
                )
              }
            >
              Cancelar reinicio
            </button>
          </>
        ) : (
          <>
            <p className="hint">
              Si olvidó su PIN: hágalo con la persona presente. Luego ella elige un PIN nuevo en la
              tablet. Nadie puede ver un PIN, tampoco usted.
            </p>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() =>
                act(
                  () => setPinReset(account.id, true),
                  `✓ Reinicio de PIN iniciado para ${account.name}. La próxima vez que elija su nombre en la tablet, se le pedirá un PIN nuevo. Mientras tanto, su PIN anterior ya no funciona.`,
                )
              }
            >
              Reiniciar PIN
            </button>
          </>
        )}
      </section>

      <section className="account-action">
        <h3>{account.archived ? 'Cuenta archivada' : 'Archivar'}</h3>
        <p className="hint">
          {account.archived
            ? 'No aparece en la lista de nombres de la tablet. Sus pedidos se conservan.'
            : 'Para quien ya no hace pedidos: desaparece de la lista de nombres de la tablet, y sus pedidos se conservan. Se puede reactivar.'}
        </p>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={() =>
            act(
              () => setAccountArchived(account.id, !account.archived),
              account.archived
                ? `✓ Cuenta de ${account.name} reactivada.`
                : `✓ Cuenta de ${account.name} archivada.`,
            )
          }
        >
          {account.archived ? 'Reactivar cuenta' : 'Archivar cuenta'}
        </button>
      </section>

      <section className="account-action">
        <h3>Eliminar</h3>
        {account.entryCount === 0 ? (
          <>
            <p className="hint">Esta cuenta no tiene pedidos, así que se puede eliminar.</p>
            <button type="button" className="danger" disabled={busy} onClick={handleDelete}>
              Eliminar cuenta
            </button>
          </>
        ) : (
          <p className="hint">
            {account.entryCount === 1 ? 'Tiene 1 pedido' : `Tiene ${account.entryCount} pedidos`}:
            solo se puede archivar.
          </p>
        )}
      </section>
    </div>
  )
}
