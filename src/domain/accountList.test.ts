import { describe, expect, test } from 'vitest'
import {
  defaultAccountSort,
  describeAreas,
  filterArchived,
  filterByArea,
  isDefaultAccountSort,
  nextAccountSort,
  sortAccounts,
} from './accountList'

const areaNames = new Map([
  [1, 'VRA'],
  [2, 'Empresariales'],
  [3, 'Marketing'],
])

const account = (
  name: string,
  defaultAreaId: number,
  entryCount: number,
  archived = false,
  areaIds = [defaultAreaId],
) => ({ name, areaIds, defaultAreaId, entryCount, archived })

const names = (list: { name: string }[]) => list.map((a) => a.name)

describe('describeAreas', () => {
  test('one department: its name only', () => {
    expect(describeAreas(account('Ana', 1, 0), areaNames)).toBe('VRA')
  })

  test('several: the main one first, marked', () => {
    expect(describeAreas(account('Ana', 3, 0, false, [1, 2, 3]), areaNames)).toBe(
      'Marketing (principal), VRA, Empresariales',
    )
  })

  test('a department no longer listed shows as archived', () => {
    expect(describeAreas(account('Ana', 1, 0, false, [1, 9]), areaNames)).toBe(
      'VRA (principal), (área archivada)',
    )
  })
})

describe('sortAccounts', () => {
  const accounts = [
    account('Óscar', 1, 5),
    account('ana', 3, 40),
    account('Beatriz', 2, 5),
    account('Carla', 2, 12),
    account('Zoe', 1, 30, true), // archived
    account('Abel', 2, 1, true), // archived
  ]

  test('by name, A to Z ignoring accents and case, by default; archived last', () => {
    expect(names(sortAccounts(accounts, defaultAccountSort, areaNames))).toEqual([
      'ana',
      'Beatriz',
      'Carla',
      'Óscar',
      'Abel',
      'Zoe',
    ])
  })

  test('by number of entries, most first; ties by name; archived last, sorted the same way', () => {
    const order = nextAccountSort(defaultAccountSort, 'entries')
    expect(names(sortAccounts(accounts, order, areaNames))).toEqual([
      'ana',
      'Carla',
      'Beatriz',
      'Óscar',
      'Zoe',
      'Abel',
    ])
  })

  test('entries, then area: within each department, the number of entries still decides', () => {
    const order = nextAccountSort(nextAccountSort(defaultAccountSort, 'entries'), 'area')
    expect(names(sortAccounts(accounts, order, areaNames))).toEqual([
      'Carla', // Empresariales, 12
      'Beatriz', // Empresariales, 5
      'ana', // Marketing
      'Óscar', // VRA
      'Abel', // archived: Empresariales
      'Zoe', // archived: VRA
    ])
  })

  test('does not change the list it is given', () => {
    sortAccounts(accounts, [{ key: 'entries', descending: true }], areaNames)
    expect(names(accounts)).toEqual(['Óscar', 'ana', 'Beatriz', 'Carla', 'Zoe', 'Abel'])
  })
})

describe('nextAccountSort', () => {
  test('the same column flips; another one takes charge and keeps the earlier as tie-breakers', () => {
    expect(nextAccountSort(defaultAccountSort, 'name')).toEqual([{ key: 'name', descending: true }])
    expect(nextAccountSort(defaultAccountSort, 'entries')).toEqual([
      { key: 'entries', descending: true },
      { key: 'name', descending: false },
    ])
    expect(nextAccountSort(nextAccountSort(defaultAccountSort, 'entries'), 'area')).toEqual([
      { key: 'area', descending: false },
      { key: 'entries', descending: true },
      { key: 'name', descending: false },
    ])
  })

  test('the default order is recognised', () => {
    expect(isDefaultAccountSort(defaultAccountSort)).toBe(true)
    expect(isDefaultAccountSort(nextAccountSort(defaultAccountSort, 'area'))).toBe(false)
  })
})

describe('filterArchived', () => {
  const accounts = [account('Ana', 1, 0), account('Zoe', 1, 0, true)]

  test('all, only active, only archived', () => {
    expect(names(filterArchived(accounts, 'all'))).toEqual(['Ana', 'Zoe'])
    expect(names(filterArchived(accounts, 'active'))).toEqual(['Ana'])
    expect(names(filterArchived(accounts, 'archived'))).toEqual(['Zoe'])
  })
})

describe('filterByArea', () => {
  const accounts = [
    { name: 'Ana', areaIds: [1, 2] },
    { name: 'Beto', areaIds: [3] },
    { name: 'Carla', areaIds: [2] },
  ]

  test('the accounts with the department, as main or as another one', () => {
    expect(filterByArea(accounts, 2).map((a) => a.name)).toEqual(['Ana', 'Carla'])
  })

  test('no department chosen: every account', () => {
    expect(filterByArea(accounts, null)).toEqual(accounts)
  })

  test('nobody has it', () => {
    expect(filterByArea(accounts, 9)).toEqual([])
  })
})
