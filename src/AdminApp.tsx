import { useEffect, useState, type FormEvent } from 'react'
import { currentAdmin, signIn, signOut, type Admin } from './lib/admin'
import { AccountList } from './AccountList'
import { EntryList } from './EntryList'
import { adminErrorMessage } from './lib/adminErrors'

// The operator's area, at /admin on her own computer.
type State =
  | { kind: 'checking' }
  | { kind: 'login' }
  | { kind: 'home'; admin: Admin }

// Her two screens: switching just draws the other one, which fetches its data again (so a
// renamed account shows in the entries).
type View = 'entries' | 'accounts'

export function AdminApp() {
  const [state, setState] = useState<State>({ kind: 'checking' })
  const [view, setView] = useState<View>('entries')

  // Still logged in from an earlier visit?
  useEffect(() => {
    currentAdmin()
      .then((admin) => setState(admin ? { kind: 'home', admin } : { kind: 'login' }))
      .catch(() => setState({ kind: 'login' }))
  }, [])

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      setState({ kind: 'login' })
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>Fotocopias UPB</h1>
        <p>Admin</p>
      </header>
      {state.kind === 'home' && (
        <nav className="app-nav">
          <button
            type="button"
            aria-current={view === 'entries' ? 'page' : undefined}
            onClick={() => setView('entries')}
          >
            Pedidos
          </button>
          <button
            type="button"
            aria-current={view === 'accounts' ? 'page' : undefined}
            onClick={() => setView('accounts')}
          >
            Cuentas
          </button>
        </nav>
      )}
      {/* The list needs a computer-wide screen; the login form stays narrow. */}
      <main className={state.kind === 'home' ? 'wide' : undefined}>
        {state.kind === 'checking' && <p className="notice">Cargando…</p>}
        {state.kind === 'login' && (
          <AdminLogin onSignedIn={(admin) => setState({ kind: 'home', admin })} />
        )}
        {state.kind === 'home' && (
          <section className="card">
            <div className="session">
              <span>
                Sesión iniciada como <strong>{state.admin.email}</strong>
              </span>
              <button type="button" className="secondary" onClick={handleSignOut}>
                Cerrar sesión
              </button>
            </div>
          </section>
        )}
        {state.kind === 'home' && (view === 'entries' ? <EntryList /> : <AccountList />)}
      </main>
    </>
  )
}

type LoginStatus = { kind: 'idle' } | { kind: 'sending' } | { kind: 'failed'; message: string }

function AdminLogin({ onSignedIn }: { onSignedIn: (admin: Admin) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<LoginStatus>({ kind: 'idle' })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus({ kind: 'sending' })
    try {
      onSignedIn(await signIn(email.trim(), password))
    } catch (error) {
      setPassword('')
      setStatus({ kind: 'failed', message: adminErrorMessage(error) })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {status.kind === 'failed' && (
        <div className="message error" role="alert">
          <strong>✗ No se pudo iniciar sesión</strong>
          <p>{status.message}</p>
        </div>
      )}

      <fieldset>
        <legend>Iniciar sesión</legend>

        {/* A real password field: on her own computer, letting the browser save it is fine
            (unlike staff PINs on the shared device). */}
        <label>
          Correo
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      </fieldset>

      <button type="submit" className="primary" disabled={status.kind === 'sending'}>
        {status.kind === 'sending' ? 'Entrando…' : 'Iniciar sesión'}
      </button>
    </form>
  )
}
