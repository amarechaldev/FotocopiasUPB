// The detailed report (story #7): every entry of a billing period, grouped by department,
// for the University. Pure logic; the PDF is drawn elsewhere.

import type { ListedEntry } from './entryList'
import type { Period } from './periods'

// The dates the report covers. partial = the period is still open, so it stops at today.
export type ReportRange = Period & { partial: boolean }

export type AnilladoCount = { sizeMm: number; quantity: number }

export type ReportTotals = {
  copias: number
  anillados: AnilladoCount[] // one per size used, smallest first
}

export type DepartmentSection = {
  areaId: number
  areaName: string
  entries: ListedEntry[] // oldest first
  totals: ReportTotals
}

export type DetailedReport = {
  range: ReportRange
  departments: DepartmentSection[] // every department, in the order of the monthly report
  totals: ReportTotals
}

// A closed period is reported whole; the current one up to today, to review it before closing.
export function reportRange(period: Period, today: string): ReportRange {
  const open = period.start <= today && today <= period.end
  return open ? { start: period.start, end: today, partial: true } : { ...period, partial: false }
}

// Quantities added up by size, smallest first (e.g. 2 × 12 mm and 1 × 12 mm give 3 × 12 mm).
export function sumAnillados(lists: AnilladoCount[][]): AnilladoCount[] {
  const bySize = new Map<number, number>()
  for (const list of lists) {
    for (const { sizeMm, quantity } of list) {
      bySize.set(sizeMm, (bySize.get(sizeMm) ?? 0) + quantity)
    }
  }
  return [...bySize]
    .map(([sizeMm, quantity]) => ({ sizeMm, quantity }))
    .sort((a, b) => a.sizeMm - b.sizeMm)
}

function totalsOf(items: { copias: number; anillados: AnilladoCount[] }[]): ReportTotals {
  return {
    copias: items.reduce((sum, item) => sum + item.copias, 0),
    anillados: sumAnillados(items.map((item) => item.anillados)),
  }
}

// Oldest service date first; on the same date, in the order they were saved.
function byDate(a: ListedEntry, b: ListedEntry): number {
  return a.entryDate.localeCompare(b.entryDate) || a.createdAt.getTime() - b.createdAt.getTime()
}

// `entries` are those of the range (list_entries). `areas` are the active departments; every one
// gets a section, even without entries, and so does a hidden department that has entries.
// Department ids follow the order of the operator's Excel report (seeded so by migration 0001).
export function buildDetailedReport(
  entries: ListedEntry[],
  areas: { id: number; name: string }[],
  range: ReportRange,
): DetailedReport {
  const names = new Map(areas.map((area) => [area.id, area.name]))
  for (const entry of entries) {
    if (!names.has(entry.areaId)) names.set(entry.areaId, entry.areaName)
  }

  const departments = [...names]
    .sort(([a], [b]) => a - b)
    .map(([areaId, areaName]) => {
      const own = entries.filter((entry) => entry.areaId === areaId).sort(byDate)
      return { areaId, areaName, entries: own, totals: totalsOf(own) }
    })

  // From the department totals, so the bottom line always agrees with them.
  return { range, departments, totals: totalsOf(departments.map((section) => section.totals)) }
}
