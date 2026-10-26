import { describe, expect, test } from 'vitest'
import { checkEntryContents, EMPTY_ENTRY_MESSAGE } from './entryRules'

describe('checkEntryContents', () => {
  test('copias only, anillados only, or both can be saved', () => {
    expect(checkEntryContents(5, [])).toBeNull()
    expect(checkEntryContents(0, [1])).toBeNull()
    expect(checkEntryContents(3, [2, 1])).toBeNull()
  })

  test('nothing at all is refused', () => {
    expect(checkEntryContents(0, [])).toBe(EMPTY_ENTRY_MESSAGE)
  })
})
