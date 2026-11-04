import { useState } from 'react'
import { suggestDescriptions, type CommonDescription } from './domain/descriptions'
import { scrollToTopOfScreen } from './scrollToTop'

type Props = {
  common: CommonDescription[]
  areaId: number | null // the entry's department: only its descriptions are suggested
  value: string
  onChange: (value: string) => void
}

// The description, with the department's common descriptions under it while the field is in use
// (#32). Tapping one fills the field; any other text can still be typed.
export function DescriptionField({ common, areaId, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const suggestions = open ? suggestDescriptions(common, areaId, value) : []

  return (
    <div className="description-field">
      <label>
        Descripción
        <input
          type="text"
          required
          pattern=".*\S.*"
          autoComplete="off"
          title="Escriba qué fotocopia, p. ej. Exámenes"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          // On every tap, as the name field (#56): the suggestions stay above the keyboard.
          onClick={(e) => {
            setOpen(true)
            const field = e.currentTarget.closest<HTMLElement>('.description-field')
            if (field) scrollToTopOfScreen(field)
          }}
        />
      </label>
      {suggestions.length > 0 && (
        <div className="picker-results">
          {suggestions.map((description) => (
            <button
              key={description}
              type="button"
              // Keeps the focus in the field: otherwise the field loses it first, the list
              // closes, and the tap lands on nothing.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(description)
                setOpen(false)
              }}
            >
              {description}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
