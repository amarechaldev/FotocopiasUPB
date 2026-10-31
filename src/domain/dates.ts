export const BOLIVIA_TIME_ZONE = 'America/La_Paz'

// Today's date in Bolivia as YYYY-MM-DD (the format of <input type="date">),
// whatever the time zone of the device.
export function todayInBolivia(now: Date = new Date()): string {
  // The en-CA locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: BOLIVIA_TIME_ZONE }).format(now)
}

// The ISO date `days` days after (or before, if negative) the given one.
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  // Date.UTC carries day 32 or 0 into the next or previous month (and year).
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

// An ISO date (YYYY-MM-DD) as shown to users: 17/10/2026.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

// A saved moment (e.g. created_at) as shown to users, in Bolivian time: 17/10/2026 14:05.
export function formatDateTime(moment: Date): string {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: BOLIVIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(moment)
  return `${formatDate(todayInBolivia(moment))} ${time}`
}
