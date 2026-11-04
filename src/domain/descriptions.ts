import { normalizeName, searchByName } from './names'

// A common description of one department (migration 0016).
export type CommonDescription = { areaId: number; description: string }

// The suggestions under the description field (#32): the department's common descriptions,
// alphabetical; once something is typed, those containing it, ignoring case and accents, best
// matches first. None once the text is exactly the only one left: nothing more to choose.
export function suggestDescriptions(
  common: CommonDescription[],
  areaId: number | null,
  typed: string,
): string[] {
  const own = common
    .filter((row) => row.areaId === areaId)
    .map((row) => row.description)
    .sort((a, b) => a.localeCompare(b, 'es'))
  if (normalizeName(typed) === '') return own

  const matches = searchByName(
    own.map((name) => ({ name })),
    typed,
  ).map((match) => match.name)
  const chosen = matches.length === 1 && normalizeName(matches[0]) === normalizeName(typed)
  return chosen ? [] : matches
}
