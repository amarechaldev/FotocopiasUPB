export type AnilladoRow = {
  key: number // stable identity for React; never shown
  sizeMm: string // '' until a size is chosen
  quantity: string
}

type Props = {
  rows: AnilladoRow[]
  sizes: number[]
  onChange: (rows: AnilladoRow[]) => void
  newKey: () => number
}

// The list of anillados of one entry: zero or more rows of size + quantity.
// The rows live in the parent form's state; this component only shows them
// and reports changes through onChange.
export function AnilladosField({ rows, sizes, onChange, newKey }: Props) {
  function updateRow(key: number, field: 'sizeMm' | 'quantity', value: string) {
    onChange(rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    onChange([...rows, { key: newKey(), sizeMm: '', quantity: '1' }])
  }

  function removeRow(key: number) {
    onChange(rows.filter((row) => row.key !== key))
  }

  return (
    <fieldset className="anillados">
      <legend>Anillados</legend>

      {rows.map((row) => (
        <div className="anillado-row" key={row.key}>
          <label>
            Tamaño
            <select
              required
              value={row.sizeMm}
              onChange={(e) => updateRow(row.key, 'sizeMm', e.target.value)}
            >
              <option value="" disabled>
                Elija
              </option>
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size} mm
                </option>
              ))}
            </select>
          </label>

          <label>
            Cantidad
            <input
              type="number"
              inputMode="numeric"
              required
              min="1"
              step="1"
              value={row.quantity}
              onChange={(e) => updateRow(row.key, 'quantity', e.target.value)}
            />
          </label>

          <button type="button" className="danger" onClick={() => removeRow(row.key)}>
            Quitar
          </button>
        </div>
      ))}

      <button type="button" className="secondary" onClick={addRow}>
        + Añadir anillado
      </button>
    </fieldset>
  )
}
