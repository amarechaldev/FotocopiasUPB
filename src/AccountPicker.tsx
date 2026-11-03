import { useState } from 'react'
import { searchByName } from './domain/names'
import type { Account } from './lib/accounts'

// Enough to find a name on a phone screen without scrolling past the form.
const MAX_RESULTS = 6

// The on-screen keyboard opens a moment after the tap (and the browser then scrolls the field
// only just into view): wait for it before moving the name to the top.
const KEYBOARD_DELAY_MS = 300

// The name at the top of the screen, so the matching names and the "no account" box below it
// stay above the keyboard (#56).
function scrollToTopOfScreen(element: HTMLElement) {
  setTimeout(() => element.scrollIntoView({ block: 'start', behavior: 'smooth' }), KEYBOARD_DELAY_MS)
}

type Props = {
  accounts: Account[]
  selected: Account | null
  onSelect: (account: Account | null) => void
  operator?: boolean // the operator choosing someone else's name: no "su nombre"
  onCreateAccount?: () => void // staff: opens the "Crear cuenta" screen
}

// Type part of your name, then tap it in the list. Only real accounts can be chosen.
export function AccountPicker({
  accounts,
  selected,
  onSelect,
  operator = false,
  onCreateAccount,
}: Props) {
  const [query, setQuery] = useState('')

  if (selected) {
    return (
      <div className="picked">
        <span>
          <small>Nombre</small>
          <strong>{selected.name}</strong>
        </span>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setQuery('')
            onSelect(null)
          }}
        >
          Cambiar
        </button>
      </div>
    )
  }

  const matches = searchByName(accounts, query)
  const noAccount = query.trim() !== '' && matches.length === 0

  return (
    <div className="picker">
      <label>
        {operator ? 'Nombre' : 'Su nombre'}
        <input
          type="text"
          autoComplete="off"
          placeholder={operator ? 'Escriba parte del nombre' : 'Escriba parte de su nombre'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={(e) => {
            // The staff device's keyboard; the operator types on a computer.
            const picker = e.currentTarget.closest<HTMLElement>('.picker')
            if (!operator && picker) scrollToTopOfScreen(picker)
          }}
        />
      </label>
      {matches.length > 0 && (
        <div className="picker-results">
          {matches.slice(0, MAX_RESULTS).map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => {
                setQuery('') // after logout, the next person starts from an empty field
                onSelect(account)
              }}
            >
              {account.name}
            </button>
          ))}
        </div>
      )}
      {matches.length > MAX_RESULTS && (
        <p className="hint">Hay más nombres: escriba un poco más.</p>
      )}
      {/* Staff: the rest of the form stays locked until a name is chosen (EntryForm). */}
      {!operator && !noAccount && (
        <p className="hint">Elija su nombre de la lista para continuar.</p>
      )}
      {noAccount &&
        (operator ? (
          <p className="hint">No hay ninguna cuenta con ese nombre.</p>
        ) : (
          // Staff tend to go on filling the form without noticing (#56): a red box, at once.
          <div className="message error" role="alert">
            <strong>✗ No hay ninguna cuenta con ese nombre</strong>
            <p>Revise cómo lo escribió. Si todavía no tiene cuenta, créela primero.</p>
            {onCreateAccount && (
              <button type="button" className="secondary" onClick={onCreateAccount}>
                Crear cuenta
              </button>
            )}
          </div>
        ))}
    </div>
  )
}
