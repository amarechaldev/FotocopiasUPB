import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnilladosField, type AnilladoRow } from './AnilladosField'
import { todayInBolivia } from './domain/dates'
import { describeContents } from './domain/summary'
import { fetchAnilladoSizes, fetchAreas, registerEntry, type Area } from './lib/entries'
import { errorDetail } from './lib/errorDetail'

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; id: number; areaName: string; contents: string }
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

  // The Guardar button is at the bottom of a long form, so the result message
  // would appear off screen: bring it into view whenever a save ends.
  const messageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (status.kind === 'saved' || status.kind === 'failed') {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [status.kind])

  // The confirmation belongs to the previous person: hide it as soon as
  // someone starts a new entry. A failure message stays until the next save.
  function clearConfirmation() {
    setStatus((current) => (current.kind === 'saved' ? { kind: 'idle' } : current))
  }

  function update(field: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
    clearConfirmation()
  }

  function updateAnillados(rows: AnilladoRow[]) {
    setAnillados(rows)
    clearConfirmation()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault() // stop the browser from reloading the page
    setStatus({ kind: 'saving' })
    const entry = {
      entryDate: fields.entryDate,
      areaId: Number(fields.areaId),
      name: fields.name.trim(),
      description: fields.description.trim(),
      copias: fields.copias === '' ? 0 : Number(fields.copias),
      anillados: anillados.map((row) => ({
        sizeMm: Number(row.sizeMm),
        quantity: Number(row.quantity),
      })),
    }
    try {
      const id = await registerEntry(entry)
      setStatus({
        kind: 'saved',
        id,
        areaName: lists?.areas.find((area) => area.id === entry.areaId)?.name ?? '',
        contents: describeContents(
          entry.copias,
          entry.anillados.map((a) => a.quantity),
        ),
      })
      setFields(emptyFields()) // ready for the next person
      setAnillados([])
    } catch (error) {
      // The form keeps what was typed, so it can be copied into the notebook.
      setStatus({ kind: 'failed', message: errorDetail(error) })
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
      <div ref={messageRef} className="result">
        {status.kind === 'saved' && (
          <div className="message success" role="status">
            <strong>✓ Registro guardado (n.º {status.id})</strong>
            <p>
              {status.areaName} · {status.contents}
            </p>
          </div>
        )}
        {status.kind === 'failed' && (
          <div className="message error" role="alert">
            <strong>✗ No se pudo guardar</strong>
            <p>Por favor, anote este pedido en el cuaderno.</p>
            <small>Detalle: {status.message}</small>
          </div>
        )}
      </div>

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
        onChange={updateAnillados}
        newKey={newKey}
      />

      <button type="submit" disabled={status.kind === 'saving'}>
        {status.kind === 'saving' ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}
