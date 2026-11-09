import { useEffect, useState } from 'react'
import { backupDue, backupFileName } from './domain/backup'
import { formatDateTime } from './domain/dates'
import { adminErrorMessage } from './lib/adminErrors'
import { downloadJson, fetchBackup, fetchLastBackup, recordBackup } from './lib/backups'

type Last = { kind: 'loading' } | { kind: 'loaded'; at: Date | null } | { kind: 'failed'; message: string }

type Status =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'done' }
  | { kind: 'failed'; message: string }
  // The file was downloaded, but its date could not be recorded: the reminder stays on.
  | { kind: 'not_recorded'; message: string }

// The operator's daily backup (#51), at the top of every admin screen so the reminder is always seen.
export function BackupPanel() {
  const [last, setLast] = useState<Last>({ kind: 'loading' })
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  // She stays logged in for days: "now" moves on by itself, so the reminder appears without a reload.
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    fetchLastBackup()
      .then((at) => setLast({ kind: 'loaded', at }))
      .catch((error) => setLast({ kind: 'failed', message: adminErrorMessage(error) }))
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  async function handleBackup() {
    setStatus({ kind: 'working' })
    let data: unknown
    try {
      data = await fetchBackup()
    } catch (error) {
      setStatus({ kind: 'failed', message: adminErrorMessage(error) })
      return
    }
    // The file first, then the date: a backup counts only once its file exists.
    downloadJson(data, backupFileName(new Date()))
    try {
      const at = await recordBackup()
      setLast({ kind: 'loaded', at })
      setNow(new Date())
      setStatus({ kind: 'done' })
    } catch (error) {
      setStatus({ kind: 'not_recorded', message: adminErrorMessage(error) })
    }
  }

  const lastAt = last.kind === 'loaded' ? last.at : null
  const due = last.kind === 'loaded' && backupDue(lastAt, now)
  return (
    <div className="backup">
      <div className="session">
        <span>
          {last.kind === 'loading' && 'Última copia de seguridad: cargando…'}
          {last.kind === 'failed' && 'Última copia de seguridad: no se pudo consultar.'}
          {last.kind === 'loaded' &&
            (lastAt ? (
              <>
                Última copia de seguridad: <strong>{formatDateTime(lastAt)}</strong>
              </>
            ) : (
              'Todavía no se hizo ninguna copia de seguridad.'
            ))}
        </span>
        <button
          type="button"
          className={due ? 'primary' : 'secondary'}
          disabled={status.kind === 'working'}
          onClick={handleBackup}
        >
          {status.kind === 'working' ? 'Preparando copia de seguridad…' : 'Descargar copia de seguridad'}
        </button>
      </div>

      {due && status.kind !== 'working' && (
        <div className="warning" role="status">
          <p>
            {lastAt
              ? 'Ya pasó un día desde la última copia de seguridad. Descargue una nueva y guárdela en su computadora.'
              : 'Descargue la primera copia de seguridad y guárdela en su computadora.'}
          </p>
        </div>
      )}
      {status.kind === 'done' && (
        <div className="message success" role="status">
          <strong>✓ Copia de seguridad descargada</strong>
          <p>
            El archivo está en la carpeta de Descargas. Muévalo a su carpeta de copias de seguridad y no lo
            comparta: tiene todos los datos.
          </p>
        </div>
      )}
      {status.kind === 'failed' && (
        <div className="message error" role="alert">
          <strong>✗ No se pudo hacer la copia de seguridad</strong>
          <p>{status.message}</p>
        </div>
      )}
      {status.kind === 'not_recorded' && (
        <div className="message error" role="alert">
          <strong>✗ El archivo se descargó, pero no se pudo registrar la fecha</strong>
          <p>
            {status.message} El archivo descargado sirve. Para que el aviso se quite, vuelva a descargar la copia
            de seguridad cuando tenga conexión.
          </p>
        </div>
      )}
      {last.kind === 'failed' && (
        <div className="message error" role="alert">
          <strong>✗ No se pudo consultar la última copia de seguridad</strong>
          <p>{last.message}</p>
        </div>
      )}
    </div>
  )
}
