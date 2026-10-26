import type { Account } from './lib/accounts'
import type { Area } from './lib/entries'

type Props = {
  areas: Area[]
  account: Account | null // the person the entry is for, once chosen
  forName?: string // set when the operator edits someone else's entry; staff talk about "sus áreas"
  value: string // '' until a department is chosen
  onChange: (areaId: string) => void
  confirmed: boolean
  onConfirm: (confirmed: boolean) => void
}

function areaOption(area: Area) {
  return (
    <option key={area.id} value={area.id}>
      {area.name}
    </option>
  )
}

// The department of an entry. With a person chosen, their departments come first, and a
// department outside them must be confirmed with the checkbox (required by the form).
export function AreaSelect({ areas, account, forName, value, onChange, confirmed, onConfirm }: Props) {
  const ownAreas = account ? areas.filter((area) => account.areaIds.includes(area.id)) : []
  const otherAreas = account ? areas.filter((area) => !account.areaIds.includes(area.id)) : areas
  const outsideArea = account ? otherAreas.find((area) => String(area.id) === value) : undefined

  return (
    <>
      <label>
        Área
        <select required value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>
            {forName ? 'Elija el área' : 'Elija su área'}
          </option>
          {ownAreas.length > 0 ? (
            <>
              <optgroup label={forName ? `Áreas de ${forName}` : 'Sus áreas'}>
                {ownAreas.map(areaOption)}
              </optgroup>
              <optgroup label="Otras áreas">{otherAreas.map(areaOption)}</optgroup>
            </>
          ) : (
            otherAreas.map(areaOption)
          )}
        </select>
      </label>

      {outsideArea && (
        <div className="warning" role="alert">
          <p>
            ⚠ {outsideArea.name}{' '}
            {forName ? `no es un área de ${forName}.` : 'no es una de sus áreas.'}
          </p>
          <label className="choice">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => onConfirm(e.target.checked)}
            />
            Sí, este pedido es para {outsideArea.name}
          </label>
        </div>
      )}
    </>
  )
}
