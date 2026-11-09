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

// The warning on the staff form for departments of the person that were archived (#115).
export function archivedAreasNotice(names: string[]): string {
  if (names.length === 1) return `El área ${names[0]} fue archivada: ya no se puede usar en los pedidos.`
  const list = `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
  return `Las áreas ${list} fueron archivadas: ya no se pueden usar en los pedidos.`
}

// The warning before archiving a department, from the names of the active accounts that have it,
// with the verbs in singular or plural (null: nobody in that group).
export function affectedAccountsWarning(
  main: string[],
  other: string[],
): { main: string | null; other: string | null } {
  const one = (names: string[]) => names.length === 1
  return {
    main:
      main.length === 0
        ? null
        : one(main)
          ? `Es el área principal de: ${main[0]}. La próxima vez que elija su nombre en la tablet, deberá elegir otra área principal.`
          : `Es el área principal de: ${main.join(', ')}. La próxima vez que elijan su nombre en la tablet, deberán elegir otra área principal.`,
    other:
      other.length === 0
        ? null
        : one(other)
          ? `También la tiene: ${other[0]}. Verá un aviso la próxima vez que elija su nombre.`
          : `También la tienen: ${other.join(', ')}. Verán un aviso la próxima vez que elijan su nombre.`,
  }
}
