import { chooseDefault, toggleArea, type AreaSelection } from './domain/areaSelection'
import type { Area } from './lib/entries'

type Props = {
  areas: Area[]
  selection: AreaSelection
  onChange: (selection: AreaSelection) => void
  legend: string // "Sus áreas" for staff, "Áreas" for the operator
  hint: string
  defaultHint: string // under "Área principal"
}

// The departments of an account (checkboxes), then the main one (radios) when more than one is
// ticked. Shared by account creation, the operator's editor (#31) and the staff's own (#30).
export function AreaChoices({ areas, selection, onChange, legend, hint, defaultHint }: Props) {
  const chosenAreas = areas.filter((area) => selection.areaIds.includes(area.id))

  return (
    <>
      <fieldset>
        <legend>{legend}</legend>
        <p className="hint">{hint}</p>
        <div className="choices">
          {areas.map((area) => (
            <label key={area.id} className="choice">
              <input
                type="checkbox"
                checked={selection.areaIds.includes(area.id)}
                onChange={() => onChange(toggleArea(selection, area.id))}
              />
              {area.name}
            </label>
          ))}
        </div>
      </fieldset>

      {chosenAreas.length > 1 && (
        <fieldset className="panel">
          <legend>Área principal</legend>
          <p className="hint">{defaultHint}</p>
          <div className="choices">
            {chosenAreas.map((area) => (
              <label key={area.id} className="choice">
                <input
                  type="radio"
                  name="default-area"
                  checked={selection.defaultAreaId === area.id}
                  onChange={() => onChange(chooseDefault(selection, area.id))}
                />
                {area.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </>
  )
}
