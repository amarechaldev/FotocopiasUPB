import { useState } from 'react'
import { supabase } from './lib/supabase'

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; id: number }
  | { kind: 'failed'; message: string }

// Temporary (task #11): saves one hard-coded entry to prove the app can write
// to Supabase. Replaced by the real form in #12.
function App() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function saveTestEntry() {
    setStatus({ kind: 'saving' })
    const { data, error } = await supabase.rpc('register_entry', {
      p_entry_date: null, // null = today in Bolivia
      p_area_id: 7, // Internacionalización (7th row seeded in 0001_entries.sql)
      p_name: 'Prueba',
      p_description: 'Entrada de prueba',
      p_copias: 10,
      p_anillados: [{ size_mm: 12, quantity: 1 }],
    })
    if (error) {
      setStatus({ kind: 'failed', message: error.message })
    } else {
      setStatus({ kind: 'saved', id: data })
    }
  }

  return (
    <main>
      <h1>Fotocopias UPB</h1>
      <button
        type="button"
        onClick={saveTestEntry}
        disabled={status.kind === 'saving'}
      >
        Guardar entrada de prueba
      </button>
      {status.kind === 'saving' && <p>Guardando…</p>}
      {status.kind === 'saved' && <p>Guardada (n.º {status.id})</p>}
      {status.kind === 'failed' && <p>No se pudo guardar: {status.message}</p>}
    </main>
  )
}

export default App
