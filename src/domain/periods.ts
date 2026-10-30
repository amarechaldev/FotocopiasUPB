import { addDays } from './dates'

// Billing periods come from the database (migration 0011), where the operator can move their
// end dates; the rule that computes them lives only there. These helpers only look things up
// in the list it returns. Dates are ISO strings (YYYY-MM-DD), already in Bolivian time.

export type Period = {
  start: string
  end: string
}

export type BillingPeriod = Period & {
  month: string // its name: the first day of the month of its default end, e.g. 2026-11-01
  isCurrent: boolean // contains today
  changeable: boolean // the current period or the one before it: its end can still be moved
  earliestEnd: string // the dates its end can be moved to (from the database's rule)
  latestEnd: string
}

// The periods the operator can look at: from the first one up to the current one, oldest first
// (the list from the database also has the next period, which has no entries yet).
export function browsablePeriods(periods: BillingPeriod[]): BillingPeriod[] {
  const current = periods.findIndex((period) => period.isCurrent)
  return current === -1 ? [] : periods.slice(0, current + 1)
}

// True once the period's last day is over: its reports may already have been printed.
export function hasEnded(period: Period, today: string): boolean {
  return period.end < today // ISO dates compare correctly as text
}

// What the next period becomes if this period's end moves to `newEnd`: it starts the day after
// and keeps its own end. Null if it would be left with no day (the database refuses that).
export function nextAfterNewEnd(next: Period, newEnd: string): Period | null {
  const start = addDays(newEnd, 1)
  return start <= next.end ? { start, end: next.end } : null
}

// The period a date belongs to, or null if it is outside the list (e.g. before the first period).
export function periodContaining<P extends Period>(periods: P[], date: string): P | null {
  return periods.find((period) => period.start <= date && date <= period.end) ?? null
}
