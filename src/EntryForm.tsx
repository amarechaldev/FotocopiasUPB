import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnilladosField, type AnilladoRow } from './AnilladosField'
import { todayInBolivia } from './domain/dates'
import { fetchAnilladoSizes, fetchAreas, registerEntry, type Area } from './lib/entries'

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; id: number }
  | { kind: 'failed'; message: string }

type Fields = {
  entryDate: string
  name: string
  description: string
  areaId: string // '' until a department is chosen
  copias: string // text, so the field can be empty while typing
}

function emptyFields(): Fields {
  return { entryDate: todayInBolivia(), name: '', description: '', areaId: '', copias: '' }
}

type Lists = {
  areas: Area[]
  sizes: number[]
}

export function EntryForm() {
  const [lists, setLists] = useState<Lists | null>(null)
  const [listsError, setListsError] = useState(false)
  const [fields, setFields] = useState<Fields>(emptyFields)
  const [anillados, setAnillados] = useState<AnilladoRow[]>([])
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  // A counter that survives redraws without causing one (unlike state).
  const lastKey = useRef(0)
  const newKey = () => ++lastKey.current

  // Load the departments and anillado sizes once, when the form first appears.
  useEffect(() => {
    Promise.all([fetchAreas(), fetchAnilladoSizes()])
      .then(([areas, sizes]) => setLists({ areas, sizes }))
      .catch(() => setListsError(true))
  }, [])

  function update(field: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault() // stop the browser from reloading the page
    setStatus({ kind: 'saving' })
    try {
      const id = await registerEntry({
        entryDate: fields.entryDate,
        areaId: Number(fields.areaId),
        name: fields.name.trim(),
        description: fields.description.trim(),
        copias: fields.copias === '' ? 0 : Number(fields.copias),
        anillados: anillados.map((row) => ({
          sizeMm: Number(row.sizeMm),
          quantity: Number(row.quantity),
        })),
      })
      setStatus({ kind: 'saved', id })
      setFields(emptyFields()) // ready for the next person
      setAnillados([])
    } catch (error) {
      setStatus({ kind: 'failed', message: error instanceof Error ? error.message : String(error) })
    }
  }

  if (listsError) {
    return <p>No se pudo cargar el formulario. Por favor, use el cuaderno.</p>
  }
  if (lists === null) {
    return <p>Cargando…</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Fecha
        <input
          type="date"
          required
          value={fields.entryDate}
          onChange={(e) => update('entryDate', e.target.value)}
        />
      </label>

      <label>
        Área
        <select required value={fields.areaId} onChange={(e) => update('areaId', e.target.value)}>
          <option value="" disabled>
            Elija su área
          </option>
          {lists.areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Nombre
        <input
          type="text"
          required
          pattern=".*\S.*"
          autoComplete="off"
          title="Escriba su nombre"
          value={fields.name}
          onChange={(e) => update('name', e.target.value)}
        />
      </label>

      <label>
        Descripción
        <input
          type="text"
          required
          pattern=".*\S.*"
          autoComplete="off"
          title="Escriba qué fotocopia, p. ej. Exámenes"
          value={fields.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </label>

      <label>
        Copias
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={fields.copias}
          onChange={(e) => update('copias', e.target.value)}
        />
      </label>

      <AnilladosField
        rows={anillados}
        sizes={lists.sizes}
        onChange={setAnillados}
        newKey={newKey}
      />

      <button type="submit" disabled={status.kind === 'saving'}>
        Guardar
      </button>

      {status.kind === 'saving' && <p>Guardando…</p>}
      {status.kind === 'saved' && <p>Guardada (n.º {status.id})</p>}
      {status.kind === 'failed' && <p>No se pudo guardar: {status.message}</p>}
    </form>
  )
}
