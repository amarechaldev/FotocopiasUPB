import { formatDateTime } from './dates'

// A backup is due this long after the last one (decision log 2026-10-26: one a day).
export const BACKUP_DUE_HOURS = 23

// Due when there was never a backup, or the last one is BACKUP_DUE_HOURS old or more.
export function backupDue(lastBackup: Date | null, now: Date): boolean {
  return lastBackup === null || now.getTime() - lastBackup.getTime() >= BACKUP_DUE_HOURS * 3_600_000
}

// The downloaded file, named like the reports, with the Bolivian date and time it was made:
// copia-de-seguridad-fotocopias_08-11-2026_14-05.json
export function backupFileName(madeAt: Date): string {
  const [date, time] = formatDateTime(madeAt).split(' ')
  return `copia-de-seguridad-fotocopias_${date.replaceAll('/', '-')}_${time.replace(':', '-')}.json`
}
