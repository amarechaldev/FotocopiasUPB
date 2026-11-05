import { useEffect, useState, type FormEvent } from 'react'
import { AccountPicker } from './AccountPicker'
import { AreaChoices } from './AreaChoices'
import type { AreaSelection } from './domain/areaSelection'
import { cleanName, nameChanged } from './domain/names'
import { checkOptionalNewPin, pinDigits } from './domain/pin'
import { OWN_ACCOUNT_MESSAGES, ownAccountErrorMessage } from './lib/accountErrors'
import { checkOwnPin, fetchAccounts, updateOwnAccount, type Account } from './lib/accounts'
import { fetchAreas, type Area } from './lib/entries'
import { NewPinStep } from './NewPinStep'
import { scrollToTop } from './scrollToTop'

type Lists = { accounts: Account[]; areas: Area[] }

// Signed in: the account as it was loaded, and the PIN typed to get in (sent again on saving).
type Session = { account: Account; pin: string }

type Props = {
  onSaved: (name: string) => void // logged out: back to the entry screen, with a message
  onCreateAccount: () => void // a name without an account: go to "Crear cuenta"
}

// "Mi cuenta" (#30): staff sign in with their name and PIN, change their name, departments or
// PIN, and are logged out after saving. Nothing stays signed in on the shared device: leaving
// this screen (another nav button) logs out too.
export function OwnAccountForm({ onSaved, onCreateAccount }: Props) {
  const [lists, setLists] = useState<Lists | null>(null)
  const [listsError, setListsError] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)
  const [pin, setPin] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [busy, setBusy] = useState(false)
  // An object, not a string: the same message twice in a row still scrolls to it.
  const [problem, setProblem] = useState<{ message: string } | null>(null)
  // PIN reset (#31): why the new-PIN step appeared late (the list was older than the reset).
  const [pinNotice, setPinNotice] = useState<string | null>(null)

  // The fields being edited, filled from the account when signing in.
  const [name, setName] = useState('')
  const [selection, setSelection] = useState<AreaSelection>({ areaIds: [], defaultAreaId: null })
  const [newPin, setNewPin] = useState('')
  const [newPinAgain, setNewPinAgain] = useState('')

  useEffect(() => {
    Promise.all([fetchAccounts(), fetchAreas()])
      .then(([accounts, areas]) => setLists({ accounts, areas }))
      .catch(() => setListsError(true))
  }, [])

  // The messages are at the top, the buttons at the bottom: scroll up on every new message,
  // and when the edit form opens (its greeting is at the top).
  useEffect(() => {
    if (problem) scrollToTop()
  }, [problem])
  useEffect(() => {
    if (session) scrollToTop()
  }, [session])

  function selectAccount(chosen: Account | null) {
    setAccount(chosen)
    setPin('')
    setPinNotice(null)
    setProblem(null)
  }

  // The operator started or cancelled a reset after the list was loaded: follow the database.
  function markPinReset(accountId: number, pending: boolean) {
    const change = (a: Account) => (a.id === accountId ? { ...a, pinResetPending: pending } : a)
    setAccount((current) => (current ? change(current) : current))
    setLists((current) => current && { ...current, accounts: current.accounts.map(change) })
  }

  function signIn(signedIn: Account, typedPin: string) {
    setSession({ account: signedIn, pin: typedPin })
    setName(signedIn.name)
    setSelection({ areaIds: signedIn.areaIds, defaultAreaId: signedIn.defaultAreaId })
    setNewPin('')
    setNewPinAgain('')
    setProblem(null)
  }

  // Back to the name and PIN, with a message if there is one. Nothing typed in the edit is kept.
  function signOut(message: string | null = null) {
    setSession(null)
    setPin('')
    setProblem(message === null ? null : { message })
  }

  // A reset launched after the list was loaded: the new-PIN step appears, with this notice.
  function showPinReset(accountId: number) {
    signOut()
    markPinReset(accountId, true)
    setPinNotice(OWN_ACCOUNT_MESSAGES.pin_reset_pending)
  }

  async function handleSignIn(event: FormEvent) {
    event.preventDefault()
    if (account === null) {
      setProblem({ message: 'Elija su nombre de la lista.' })
      return
    }
    setBusy(true)
    setProblem(null)
    try {
      await checkOwnPin(account.id, pin)
      signIn(account, pin)
    } catch (error) {
      const message = ownAccountErrorMessage(error)
      if (message === OWN_ACCOUNT_MESSAGES.pin_reset_pending) {
        showPinReset(account.id)
      } else {
        setPin('') // wrong PIN: type it again
        setProblem({ message })
      }
    }
    setBusy(false)
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (session === null) return
    const defaultAreaId = selection.defaultAreaId
    if (selection.areaIds.length === 0 || defaultAreaId === null) {
      setProblem({ message: OWN_ACCOUNT_MESSAGES.areas_required })
      return
    }
    const pinProblem = checkOptionalNewPin(newPin, newPinAgain)
    if (pinProblem) {
      setProblem({ message: pinProblem })
      return
    }

    const savedName = cleanName(name)
    setBusy(true)
    setProblem(null)
    try {
      await updateOwnAccount(session.account.id, session.pin, {
        name: savedName,
        areaIds: selection.areaIds,
        defaultAreaId,
        newPin: newPin === '' ? null : newPin,
      })
      onSaved(savedName) // this screen closes: logged out
    } catch (error) {
      const message = ownAccountErrorMessage(error)
      if (message === OWN_ACCOUNT_MESSAGES.pin_reset_pending) {
        showPinReset(session.account.id)
      } else if (
        message === OWN_ACCOUNT_MESSAGES.pin_wrong ||
        message === OWN_ACCOUNT_MESSAGES.account_invalid
      ) {
        // The PIN changed or the account was archived meanwhile: sign in again.
        signOut(message)
      } else {
        setProblem({ message }) // name taken, connection…: everything typed is kept
      }
      setBusy(false)
    }
  }

  if (listsError) {
    return <p className="notice">No se pudo cargar la página. Intente más tarde.</p>
  }
  if (lists === null) {
    return <p className="notice">Cargando…</p>
  }

  if (session) {
    const renaming = nameChanged(session.account.name, name)
    return (
      <form onSubmit={handleSave}>
        <div className="result">
          {problem ? (
            <div className="message error" role="alert">
              <strong>✗ No se guardó</strong>
              <p>{problem.message}</p>
            </div>
          ) : (
            <div className="message success" role="status">
              <strong>✓ Hola, {session.account.name}</strong>
              <p>Cambie lo que necesite y toque «Guardar cambios».</p>
            </div>
          )}
        </div>

        <fieldset>
          <legend>Sus datos</legend>
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
          {renaming && (
            <p className="hint">Si cambia su nombre, también cambia en todos sus pedidos anteriores.</p>
          )}
        </fieldset>

        <AreaChoices
          areas={lists.areas}
          selection={selection}
          onChange={setSelection}
          legend="Sus áreas"
          hint="Marque todas las áreas para las que hace pedidos."
          defaultHint="Al registrar un pedido, esta área aparecerá ya elegida. Si un pedido es para otra de sus áreas, podrá elegirla en ese pedido."
        />

        <fieldset>
          <legend>Cambiar PIN (opcional)</legend>
          <p className="hint">
            Para mantener su PIN actual, deje estos campos vacíos. Para cambiarlo, escriba 4
            números nuevos dos veces.
          </p>
          {/* Hidden digits without type="password" (see AccountForm). */}
          <label>
            PIN nuevo
            <input
              type="text"
              className="pin"
              inputMode="numeric"
              autoComplete="off"
              value={newPin}
              onChange={(e) => setNewPin(pinDigits(e.target.value))}
            />
          </label>
          <label>
            Repita el PIN nuevo
            <input
              type="text"
              className="pin"
              inputMode="numeric"
              autoComplete="off"
              value={newPinAgain}
              onChange={(e) => setNewPinAgain(pinDigits(e.target.value))}
            />
          </label>
        </fieldset>

        <div className="editor-actions">
          <button type="button" className="secondary" disabled={busy} onClick={() => signOut()}>
            Cancelar
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    )
  }

  // Signing in. Nothing can be typed before a real name is chosen, nor before a new PIN is
  // chosen after a reset (#31).
  const locked = account === null || account.pinResetPending

  return (
    <form onSubmit={handleSignIn}>
      <div className="result">
        {problem && (
          <div className="message error" role="alert">
            <strong>✗ No se pudo entrar</strong>
            <p>{problem.message}</p>
          </div>
        )}
      </div>

      <fieldset>
        <legend>Mi cuenta</legend>
        <p className="hint">Para cambiar su nombre, sus áreas o su PIN, elija su nombre y escriba su PIN.</p>

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
            onSaved={(chosenPin) => {
              // Just typed twice: signed in with it, no need to type it a third time.
              markPinReset(account.id, false)
              setPinNotice(null)
              signIn({ ...account, pinResetPending: false }, chosenPin)
            }}
            onCancelled={(message) => {
              // The operator cancelled the reset meanwhile: the usual PIN field is back.
              markPinReset(account.id, false)
              setPinNotice(null)
              setProblem({ message })
            }}
          />
        )}

        <fieldset disabled={locked}>
          {/* Hidden digits without type="password" (see AccountForm). */}
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
        </fieldset>
      </fieldset>

      <button type="submit" className="primary" disabled={locked || busy}>
        {busy ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
