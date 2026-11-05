// The operator's list of staff accounts (#31): how departments are shown, filtering and sorting.

type ListedAccount = {
  name: string
  areaIds: number[]
  defaultAreaId: number
  entryCount: number
  archived: boolean
}

// A department missing from the names: archived later (#33).
const ARCHIVED_AREA = '(área archivada)'

// The main department first, marked when there are several: "VRA (principal), Marketing".
export function describeAreas(
  account: Pick<ListedAccount, 'areaIds' | 'defaultAreaId'>,
  areaNames: Map<number, string>,
): string {
  const others = account.areaIds.filter((id) => id !== account.defaultAreaId)
  const main = areaNames.get(account.defaultAreaId) ?? ARCHIVED_AREA
  return [
    others.length > 0 ? `${main} (principal)` : main,
    ...others.map((id) => areaNames.get(id) ?? ARCHIVED_AREA),
  ].join(', ')
}

// Which accounts are shown: all, only active ones, or only archived ones.
export type ArchivedFilter = 'all' | 'active' | 'archived'

export function filterArchived<T extends ListedAccount>(accounts: T[], filter: ArchivedFilter): T[] {
  if (filter === 'all') return accounts
  return accounts.filter((a) => a.archived === (filter === 'archived'))
}

export type AccountSortKey = 'name' | 'area' | 'entries'
export type AccountSort = { key: AccountSortKey; descending: boolean }

// The columns clicked, most recent first: the first one decides the order, the earlier ones
// break its ties (like sorting a spreadsheet several times), as in the entry list.
export type AccountSortOrder = AccountSort[]

export const defaultAccountSort: AccountSortOrder = [{ key: 'name', descending: false }]

export function isDefaultAccountSort(order: AccountSortOrder): boolean {
  return order.length === 1 && order[0].key === 'name' && !order[0].descending
}

// Clicking a column: the column already in charge flips its direction; another one takes
// charge, A to Z for text and most first for the number of entries, and the previous ones
// become tie-breakers.
export function nextAccountSort(current: AccountSortOrder, key: AccountSortKey): AccountSortOrder {
  const [first, ...rest] = current
  if (first?.key === key) return [{ key, descending: !first.descending }, ...rest]
  return [{ key, descending: key === 'entries' }, ...current.filter((sort) => sort.key !== key)]
}

const collator = new Intl.Collator('es', { sensitivity: 'base' })

// A sorted copy. Archived accounts always come last, sorted the same way among themselves.
// Area: by the main department. Equal on every column clicked: by name, A to Z.
export function sortAccounts<T extends ListedAccount>(
  accounts: T[],
  order: AccountSortOrder,
  areaNames: Map<number, string>,
): T[] {
  const mainArea = (a: T) => areaNames.get(a.defaultAreaId) ?? ARCHIVED_AREA
  const compare = (a: T, b: T, key: AccountSortKey): number => {
    switch (key) {
      case 'name':
        return collator.compare(a.name, b.name)
      case 'area':
        return collator.compare(mainArea(a), mainArea(b))
      case 'entries':
        return a.entryCount - b.entryCount
    }
  }
  return [...accounts].sort((a, b) => {
    if (a.archived !== b.archived) return a.archived ? 1 : -1
    for (const sort of order) {
      const result = (sort.descending ? -1 : 1) * compare(a, b, sort.key)
      if (result !== 0) return result
    }
    return collator.compare(a.name, b.name)
  })
}
