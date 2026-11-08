import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ConfirmPanel } from './ConfirmPanel'
import { groupCommonDescriptions, type GroupedDescription } from './domain/lists'
import { useScrolledIntoView } from './scrollToTop'
import { fetchCommonDescriptions, fetchVagueDescriptions } from './lib/entries'
import {
  deleteCommonDescription,
  deleteVagueDescription,
  fetchAllAreas,
  listErrorMessage,
  saveCommonDescription,
  saveVagueDescription,
  type ListedArea,
} from './lib/lists'

// The two description lists of #33: common descriptions (suggested on the forms, per department)
// and too-vague descriptions (refused). Never the same text in both; capitals, accents and spaces
// do not count (0021).

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'failed'; message: string }

// The confirmation or the error at the top of a section, which comes into view when it changes.
function useSectionMessages() {
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const top = useRef<HTMLElement>(null)
  useEffect(() => {
    if (confirmation || actionError) top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [confirmation, actionError])
  const messages = (
    <div className="result">
      {confirmation && (
        <div className="message success" role="status">
          <strong>{confirmation}</strong>
        </div>
      )}
      {actionError && (
        <div className="message error" role="alert">
          <strong>✗ No se guardó</strong>
          <p>{actionError}</p>
        </div>
      )}
    </div>
  )
  return { top, messages, setConfirmation, setActionError }
}

function FormButtons({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <div className="period-end-actions">
      <button type="submit" className="primary" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
      <button type="button" className="secondary" disabled={saving} onClick={onCancel}>
        Cancelar
      </button>
    </div>
  )
}

function Failure({ status }: { status: Status }) {
  if (status.kind !== 'failed') return null
  return (
    <div className="message error" role="alert">
      <strong>✗ No se guardó</strong>
      <p>{status.message}</p>
    </div>
  )
}

// Common descriptions ------------------------------------------------------------------------------

type CommonLoaded =
  | { kind: 'loading' }
  | { kind: 'loaded'; descriptions: GroupedDescription[]; areas: ListedArea[] }
  | { kind: 'failed'; message: string }

// What is open under the title: the form, for a new description (null) or the one being changed,
// or the question before deleting one.
type CommonOpen =
  | { kind: 'form'; editing: GroupedDescription | null }
  | { kind: 'delete'; item: GroupedDescription }

export function CommonDescriptionList({ version }: { version: number }) {
  const [loaded, setLoaded] = useState<CommonLoaded>({ kind: 'loading' })
  const [reloads, setReloads] = useState(0)
  const [open, setOpen] = useState<CommonOpen | null>(null)
  const { top, messages, setConfirmation, setActionError } = useSectionMessages()

  // version: the departments changed in their own section.
  useEffect(() => {
    Promise.all([fetchCommonDescriptions(), fetchAllAreas()])
      .then(([rows, areas]) =>
        setLoaded({ kind: 'loaded', descriptions: groupCommonDescriptions(rows), areas }),
      )
      .catch((error) => setLoaded({ kind: 'failed', message: listErrorMessage(error) }))
  }, [reloads, version])

  if (loaded.kind === 'loading') return <p className="notice">Cargando…</p>
  if (loaded.kind === 'failed') {
    return (
      <section className="entry-list lists">
        <div className="message error" role="alert">
          <strong>✗ No se pudieron cargar las descripciones usuales</strong>
          <p>{loaded.message}</p>
        </div>
      </section>
    )
  }

  const { descriptions, areas } = loaded
  const names = new Map(areas.map((area) => [area.id, area.name]))

  function done(message: string) {
    setOpen(null)
    setActionError(null)
    setConfirmation(message)
    setReloads((n) => n + 1)
  }
  function openForm(form: CommonOpen) {
    setConfirmation(null)
    setActionError(null)
    setOpen(form)
  }
  async function remove(item: GroupedDescription) {
    try {
      await deleteCommonDescription(item.description)
      done(`✓ Descripción usual «${item.description}» eliminada.`)
    } catch (error) {
      setOpen(null)
      setActionError(listErrorMessage(error))
    }
  }

  return (
    <section className="entry-list lists" ref={top}>
      <h2>Descripciones usuales</h2>
      <p className="hint">
        Se sugieren al escribir la descripción de un pedido, según el área elegida. Siempre se puede
        escribir otra.
      </p>
      {messages}

      {open === null && (
        <div className="list-actions">
          <button type="button" className="secondary" onClick={() => openForm({ kind: 'form', editing: null })}>
            + Agregar descripción usual
          </button>
        </div>
      )}
      {open?.kind === 'delete' && (
        <ConfirmPanel
          question={`¿Eliminar la descripción usual «${open.item.description}»?`}
          detail="Ya no se sugerirá en ningún área. Los pedidos guardados no cambian."
          onConfirm={() => remove(open.item)}
          onCancel={() => setOpen(null)}
        />
      )}
      {open?.kind === 'form' && (
        <CommonDescriptionForm
          editing={open.editing}
          areas={areas}
          onCancel={() => setOpen(null)}
          onSaved={(description) =>
            done(
              open.editing
                ? `✓ Descripción usual «${description}» guardada.`
                : `✓ Descripción usual «${description}» agregada.`,
            )
          }
        />
      )}

      {descriptions.length === 0 ? (
        <p className="notice">Todavía no hay descripciones usuales.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Áreas</th>
                <th>
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {descriptions.map((item) => (
                <tr key={item.description}>
                  <td>{item.description}</td>
                  <td>{item.areaIds.map((id) => names.get(id) ?? '?').join(', ')}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="secondary"
                      disabled={open !== null}
                      onClick={() => openForm({ kind: 'form', editing: item })}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={open !== null}
                      onClick={() => openForm({ kind: 'delete', item })}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// Text and departments. Archived departments are offered only if the description already has them.
function CommonDescriptionForm({
  editing,
  areas,
  onCancel,
  onSaved,
}: {
  editing: GroupedDescription | null
  areas: ListedArea[]
  onCancel: () => void
  onSaved: (description: string) => void
}) {
  const [description, setDescription] = useState(editing?.description ?? '')
  const [areaIds, setAreaIds] = useState<number[]>(editing?.areaIds ?? [])
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const panel = useScrolledIntoView<HTMLFormElement>()
  const offered = areas.filter((area) => !area.archivedFrom || editing?.areaIds.includes(area.id))

  function toggle(id: number) {
    setAreaIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (areaIds.length === 0) {
      setStatus({ kind: 'failed', message: listErrorMessage({ message: 'areas_required' }) })
      return
    }
    const clean = description.trim().replace(/\s+/g, ' ')
    setStatus({ kind: 'saving' })
    try {
      await saveCommonDescription(editing?.description ?? null, clean, areaIds)
      onSaved(clean)
    } catch (error) {
      setStatus({ kind: 'failed', message: listErrorMessage(error) })
    }
  }

  return (
    <form className="list-form" onSubmit={handleSubmit} ref={panel}>
      <strong>{editing ? `Editar «${editing.description}»` : 'Nueva descripción usual'}</strong>
      <Failure status={status} />
      <label>
        Descripción
        <input
          type="text"
          required
          pattern=".*\S.*"
          autoComplete="off"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <fieldset>
        <legend>Áreas</legend>
        <div className="choices">
          {offered.map((area) => (
            <label key={area.id} className="choice">
              <input type="checkbox" checked={areaIds.includes(area.id)} onChange={() => toggle(area.id)} />
              {area.name}
              {area.archivedFrom && ' (archivada)'}
            </label>
          ))}
        </div>
      </fieldset>
      <FormButtons saving={status.kind === 'saving'} onCancel={onCancel} />
    </form>
  )
}

// Too-vague descriptions --------------------------------------------------------------------------

type VagueLoaded =
  | { kind: 'loading' }
  | { kind: 'loaded'; descriptions: string[] }
  | { kind: 'failed'; message: string }

export function VagueDescriptionList() {
  const [loaded, setLoaded] = useState<VagueLoaded>({ kind: 'loading' })
  const [reloads, setReloads] = useState(0)
  // The form (a new description: null) or the question before deleting one.
  const [open, setOpen] = useState<
    { kind: 'form'; editing: string | null } | { kind: 'delete'; description: string } | null
  >(null)
  const { top, messages, setConfirmation, setActionError } = useSectionMessages()

  useEffect(() => {
    fetchVagueDescriptions()
      .then((rows) =>
        setLoaded({
          kind: 'loaded',
          descriptions: rows.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
        }),
      )
      .catch((error) => setLoaded({ kind: 'failed', message: listErrorMessage(error) }))
  }, [reloads])

  if (loaded.kind === 'loading') return <p className="notice">Cargando…</p>
  if (loaded.kind === 'failed') {
    return (
      <section className="entry-list lists">
        <div className="message error" role="alert">
          <strong>✗ No se pudieron cargar las descripciones demasiado vagas</strong>
          <p>{loaded.message}</p>
        </div>
      </section>
    )
  }

  function done(message: string) {
    setOpen(null)
    setActionError(null)
    setConfirmation(message)
    setReloads((n) => n + 1)
  }
  function openForm(form: NonNullable<typeof open>) {
    setConfirmation(null)
    setActionError(null)
    setOpen(form)
  }
  async function remove(description: string) {
    try {
      await deleteVagueDescription(description)
      done(`✓ «${description}» eliminada: ya se acepta como descripción.`)
    } catch (error) {
      setOpen(null)
      setActionError(listErrorMessage(error))
    }
  }

  return (
    <section className="entry-list lists" ref={top}>
      <h2>Descripciones demasiado vagas</h2>
      <p className="hint">
        Un pedido con solo una de estas descripciones no se guarda: no sirve como respaldo. Los pedidos
        ya guardados no cambian.
      </p>
      {messages}

      {open === null && (
        <div className="list-actions">
          <button type="button" className="secondary" onClick={() => openForm({ kind: 'form', editing: null })}>
            + Agregar descripción demasiado vaga
          </button>
        </div>
      )}
      {open?.kind === 'delete' && (
        <ConfirmPanel
          question={`¿Eliminar «${open.description}» de las descripciones demasiado vagas?`}
          detail="Desde ahora se aceptará como descripción. Los pedidos guardados no cambian."
          onConfirm={() => remove(open.description)}
          onCancel={() => setOpen(null)}
        />
      )}
      {open?.kind === 'form' && (
        <VagueDescriptionForm
          editing={open.editing}
          onCancel={() => setOpen(null)}
          onSaved={(description) =>
            done(open.editing ? `✓ «${description}» guardada.` : `✓ «${description}» agregada.`)
          }
        />
      )}

      {loaded.descriptions.length === 0 ? (
        <p className="notice">Todavía no hay descripciones demasiado vagas.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loaded.descriptions.map((description) => (
                <tr key={description}>
                  <td>{description}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="secondary"
                      disabled={open !== null}
                      onClick={() => openForm({ kind: 'form', editing: description })}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={open !== null}
                      onClick={() => openForm({ kind: 'delete', description })}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function VagueDescriptionForm({
  editing,
  onCancel,
  onSaved,
}: {
  editing: string | null
  onCancel: () => void
  onSaved: (description: string) => void
}) {
  const [description, setDescription] = useState(editing ?? '')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const panel = useScrolledIntoView<HTMLFormElement>()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const clean = description.trim().replace(/\s+/g, ' ')
    setStatus({ kind: 'saving' })
    try {
      await saveVagueDescription(editing, clean)
      onSaved(clean)
    } catch (error) {
      setStatus({ kind: 'failed', message: listErrorMessage(error) })
    }
  }

  return (
    <form className="list-form" onSubmit={handleSubmit} ref={panel}>
      <strong>{editing ? `Editar «${editing}»` : 'Nueva descripción demasiado vaga'}</strong>
      <Failure status={status} />
      <label>
        Descripción
        <input
          type="text"
          required
          pattern=".*\S.*"
          autoComplete="off"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <FormButtons saving={status.kind === 'saving'} onCancel={onCancel} />
    </form>
  )
}
