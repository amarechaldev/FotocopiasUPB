import { normalizeName } from './names'

// One entry as the operator sees it in her list.
export type ListedEntry = {
  id: number
  entryDate: string // YYYY-MM-DD, the service date
  createdAt: Date // when it was saved
  modifiedAt: Date | null // when the operator last edited it; null = never
  manual: boolean // registered by the operator on someone's behalf (e.g. from the notebook)
  areaId: number
  areaName: string
  accountId: number | null // null = saved before accounts existed (Sprint 1)
  name: string
  description: string
  copias: number
  anillados: { sizeMm: number; quantity: number }[]
}

export type EntryFilters = {
  areaId: number | null // null = all departments
  name: string
  description: string
}

export const noFilters: EntryFilters = { areaId: null, name: '', description: '' }

// Entries matching every filter at once. Name and description match anywhere in the
// text, ignoring case, accents and extra spaces; empty text filters nothing.
export function filterEntries(entries: ListedEntry[], filters: EntryFilters): ListedEntry[] {
  const name = normalizeName(filters.name)
  const description = normalizeName(filters.description)
  return entries.filter(
    (entry) =>
      (filters.areaId === null || entry.areaId === filters.areaId) &&
      normalizeName(entry.name).includes(name) &&
      normalizeName(entry.description).includes(description),
  )
}

export type SortKey = 'createdAt' | 'entryDate' | 'area' | 'name'
export type Sort = { key: SortKey; descending: boolean }

// The columns clicked, most recent first: the first one decides the order, the
// earlier ones break its ties (like sorting a spreadsheet several times).
export type SortOrder = Sort[]

// Newest service date first; on the same date, newest saved first.
export const defaultSort: SortOrder = [
  { key: 'entryDate', descending: true },
  { key: 'createdAt', descending: true },
]

export function isDefaultSort(order: SortOrder): boolean {
  return (
    order.length === defaultSort.length &&
    order.every(
      (sort, i) => sort.key === defaultSort[i].key && sort.descending === defaultSort[i].descending,
    )
  )
}

// Clicking a column: the column already in charge flips its direction; another column
// takes charge, newest first for dates and A to Z for text, and the previous ones
// become tie-breakers.
export function nextSort(current: SortOrder, key: SortKey): SortOrder {
  const [first, ...rest] = current
  if (first?.key === key) return [{ key, descending: !first.descending }, ...rest]
  return [
    { key, descending: key === 'createdAt' || key === 'entryDate' },
    ...current.filter((sort) => sort.key !== key),
  ]
}

const collator = new Intl.Collator('es', { sensitivity: 'base' })

function compare(a: ListedEntry, b: ListedEntry, key: SortKey): number {
  switch (key) {
    case 'createdAt':
      return a.createdAt.getTime() - b.createdAt.getTime()
    case 'entryDate':
      return a.entryDate.localeCompare(b.entryDate)
    case 'area':
      return collator.compare(a.areaName, b.areaName)
    case 'name':
      return collator.compare(a.name, b.name)
  }
}

// A sorted copy. Entries equal on every column in the order keep newest saved first.
export function sortEntries(entries: ListedEntry[], order: SortOrder): ListedEntry[] {
  return [...entries].sort((a, b) => {
    for (const sort of order) {
      const result = (sort.descending ? -1 : 1) * compare(a, b, sort.key)
      if (result !== 0) return result
    }
    return b.createdAt.getTime() - a.createdAt.getTime()
  })
}

// Anillados in one short line: "2 × 12 mm, 1 × 20 mm"; empty if none.
export function describeAnillados(anillados: ListedEntry['anillados']): string {
  return anillados.map((a) => `${a.quantity} × ${a.sizeMm} mm`).join(', ')
}
