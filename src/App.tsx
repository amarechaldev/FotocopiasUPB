import { useState } from 'react'
import { AccountForm, type CreatedAccount } from './AccountForm'
import { AdminApp } from './AdminApp'
import { EntryForm } from './EntryForm'
import { OwnAccountForm } from './OwnAccountForm'

// /admin is the operator's area; every other address is the shared device's screens.
// (No router: vercel.json sends every path to index.html, and we look at it here.)
const isAdminPath = /^\/admin(\/|$)/.test(window.location.pathname)

function App() {
  return isAdminPath ? <AdminApp /> : <StaffApp />
}

// One page, three screens: switching just draws the other form (no router needed yet).
type View = 'entry' | 'account' | 'own'

function StaffApp() {
  const [view, setView] = useState<View>('entry')
  // Just created on the account screen: the entry screen opens with that name chosen (#57).
  const [created, setCreated] = useState<CreatedAccount | null>(null)
  // Just saved in "Mi cuenta" (#30): the entry screen says so, and that the person was logged out.
  const [profileSaved, setProfileSaved] = useState<string | null>(null)

  // Switching screens by hand: the messages belong to that one moment.
  function show(next: View) {
    setCreated(null)
    setProfileSaved(null)
    setView(next)
  }

  return (
    <>
      <header className="app-header">
        <h1>Fotocopias UPB</h1>
        <p>Registro de servicios</p>
      </header>
      <nav className="app-nav">
        <button
          type="button"
          aria-current={view === 'entry' ? 'page' : undefined}
          onClick={() => show('entry')}
        >
          Registrar pedido
        </button>
        <button
          type="button"
          aria-current={view === 'account' ? 'page' : undefined}
          onClick={() => show('account')}
        >
          Crear cuenta
        </button>
        <button
          type="button"
          aria-current={view === 'own' ? 'page' : undefined}
          onClick={() => show('own')}
        >
          Mi cuenta
        </button>
      </nav>
      <main>
        {view === 'entry' && (
          <EntryForm
            createdAccount={created}
            profileSaved={profileSaved}
            onCreateAccount={() => show('account')}
          />
        )}
        {view === 'account' && (
          <AccountForm
            onCreated={(account) => {
              setCreated(account)
              setView('entry')
            }}
          />
        )}
        {view === 'own' && (
          <OwnAccountForm
            onSaved={(name) => {
              setProfileSaved(name)
              setView('entry')
            }}
            onCreateAccount={() => show('account')}
          />
        )}
      </main>
    </>
  )
}

export default App
