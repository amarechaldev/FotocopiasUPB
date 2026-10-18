export const BOLIVIA_TIME_ZONE = 'America/La_Paz'

// Today's date in Bolivia as YYYY-MM-DD (the format of <input type="date">),
// whatever the time zone of the device.
export function todayInBolivia(now: Date = new Date()): string {
  // The en-CA locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: BOLIVIA_TIME_ZONE }).format(now)
}
