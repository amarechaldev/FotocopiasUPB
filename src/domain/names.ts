// The same rule as normalize_name in the database (0002_accounts.sql): two names
// match if they only differ in case, accents or spaces. 'María  López' -> 'maria lopez'.
export function normalizeName(name: string): string {
  return name
    .normalize('NFD') // 'í' -> 'i' + a separate accent mark
    .replace(/\p{M}/gu, '') // drop the accent marks
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

// How well a name matches what was typed: 0 = the name starts with it,
// 1 = another word starts with it, 2 = it appears elsewhere, null = no match.
function matchRank(name: string, typed: string): number | null {
  if (name.startsWith(typed)) return 0
  if (name.includes(' ' + typed)) return 1
  if (name.includes(typed)) return 2
  return null
}

// The accounts whose name contains what was typed, ignoring case and accents,
// best matches first; within each group, in the order given (alphabetical).
// Nothing typed yet: no results, so the list does not show every name at once.
export function searchByName<T extends { name: string }>(items: T[], query: string): T[] {
  const typed = normalizeName(query)
  if (typed === '') return []
  return items
    .map((item) => ({ item, rank: matchRank(normalizeName(item.name), typed) }))
    .filter((match): match is { item: T; rank: number } => match.rank !== null)
    .sort((a, b) => a.rank - b.rank) // stable: keeps alphabetical order within a rank
    .map((match) => match.item)
}

// The operator's list (#31): every item while nothing is typed, otherwise as searchByName.
export function filterByName<T extends { name: string }>(items: T[], query: string): T[] {
  return normalizeName(query) === '' ? items : searchByName(items, query)
}

// The account whose whole name was typed (ignoring case, accents and spaces), so it can be
// chosen without tapping it (#56). None if another name also contains the text: 'Ana' must not
// be chosen while Ana María is still typing.
export function exactMatch<T extends { name: string }>(items: T[], query: string): T | null {
  const matches = searchByName(items, query)
  if (matches.length !== 1) return null
  return normalizeName(matches[0].name) === normalizeName(query) ? matches[0] : null
}
