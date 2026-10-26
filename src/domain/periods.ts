// Billing periods run from the 23rd of one month to the 22nd of the next, both included.
// Dates are ISO strings (YYYY-MM-DD), already in Bolivian time.

export type Period = {
  start: string // the 23rd
  end: string // the 22nd of the next month
}

function iso(year: number, month: number, day: number): string {
  // month may be 0 or 13: let Date carry it into the year.
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toISOString().slice(0, 10)
}

// The period a date belongs to.
export function periodOf(date: string): Period {
  const [year, month, day] = date.split('-').map(Number)
  const startMonth = day >= 23 ? month : month - 1
  return { start: iso(year, startMonth, 23), end: iso(year, startMonth + 1, 22) }
}

// The period `count` periods after (or before, if negative) the given one.
export function shiftPeriod(period: Period, count: number): Period {
  const [year, month] = period.start.split('-').map(Number)
  return periodOf(iso(year, month + count, 23))
}
