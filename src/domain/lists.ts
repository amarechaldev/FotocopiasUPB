// The operator's lists (#33): what the "Listas" screen shows, from the rows of the database.

import type { CommonDescription } from './descriptions'
import { normalizeName } from './names'

// One common description with all its departments (the table has one row per department).
export type GroupedDescription = { description: string; areaIds: number[] }

// Alphabetical, ignoring case and accents; departments in the order of the monthly report (id).
export function groupCommonDescriptions(rows: CommonDescription[]): GroupedDescription[] {
  const groups = new Map<string, GroupedDescription>()
  for (const row of rows) {
    const key = normalizeName(row.description)
    const group = groups.get(key) ?? { description: row.description, areaIds: [] }
    group.areaIds.push(row.areaId)
    groups.set(key, group)
  }
  return [...groups.values()]
    .map((group) => ({ ...group, areaIds: group.areaIds.sort((a, b) => a - b) }))
    .sort((a, b) => a.description.localeCompare(b.description, 'es', { sensitivity: 'base' }))
}

type AccountAreas = { name: string; areaIds: number[]; defaultAreaId: number; archived: boolean }

// The active accounts that have a department, as shown before archiving it (PO, 08/11): those
// whose main department it is must choose another; the others only get a warning.
export function affectedAccounts<A extends AccountAreas>(
  accounts: A[],
  areaId: number,
): { main: A[]; other: A[] } {
  const having = accounts.filter((a) => !a.archived && a.areaIds.includes(areaId))
  return {
    main: having.filter((a) => a.defaultAreaId === areaId),
    other: having.filter((a) => a.defaultAreaId !== areaId),
  }
}
