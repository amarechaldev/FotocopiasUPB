import { useState } from 'react'
import { AccountForm } from './AccountForm'
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
          onClick={() => setView('entry')}
        >
          Registrar pedido
        </button>
        <button
          type="button"
          aria-current={view === 'account' ? 'page' : undefined}
          onClick={() => setView('account')}
        >
          Crear cuenta
        </button>
      </nav>
      <main>{view === 'entry' ? <EntryForm /> : <AccountForm />}</main>
    </>
  )
}

export default App
