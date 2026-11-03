import { useState } from 'react'
import { AccountForm, type CreatedAccount } from './AccountForm'
import { AdminApp } from './AdminApp'
import { EntryForm } from './EntryForm'

// /admin is the operator's area; every other address is the shared device's screens.
// (No router: vercel.json sends every path to index.html, and we look at it here.)
const isAdminPath = /^\/admin(\/|$)/.test(window.location.pathname)

function App() {
  return isAdminPath ? <AdminApp /> : <StaffApp />
}

// One page, two screens: switching just draws the other form (no router needed yet).
type View = 'entry' | 'account'

function StaffApp() {
  const [view, setView] = useState<View>('entry')
  // Just created on the account screen: the entry screen opens with that name chosen (#57).
  const [created, setCreated] = useState<CreatedAccount | null>(null)

  // Switching screens by hand: the welcome message belongs to that one moment.
  function show(next: View) {
    setCreated(null)
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
      </nav>
      <main>
        {view === 'entry' ? (
          <EntryForm createdAccount={created} onCreateAccount={() => show('account')} />
        ) : (
          <AccountForm
            onCreated={(account) => {
              setCreated(account)
              setView('entry')
            }}
          />
        )}
      </main>
    </>
  )
}

export default App
