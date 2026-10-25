import { useState } from 'react'
import { searchByName } from './domain/names'
import type { Account } from './lib/accounts'

// Enough to find a name on a phone screen without scrolling past the form.
const MAX_RESULTS = 6

type Props = {
  accounts: Account[]
  selected: Account | null
  onSelect: (account: Account | null) => void
}

// Type part of your name, then tap it in the list. Only real accounts can be chosen.
export function AccountPicker({ accounts, selected, onSelect }: Props) {
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

  return (
    <div className="picker">
      <label>
        Su nombre
        <input
          type="text"
          autoComplete="off"
          placeholder="Escriba parte de su nombre"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
      {query.trim() !== '' && matches.length === 0 && (
        <p className="hint">
          No hay ninguna cuenta con ese nombre. Si es nuevo, créela en «Crear cuenta».
        </p>
      )}
    </div>
  )
}
