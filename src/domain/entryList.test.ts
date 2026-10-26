import { describe, expect, test } from 'vitest'
import {
  defaultSort,
  describeAnillados,
  filterEntries,
  isDefaultSort,
  nextSort,
  noFilters,
  sortEntries,
  type ListedEntry,
} from './entryList'

function entry(id: number, fields: Partial<ListedEntry>): ListedEntry {
  return {
    id,
    entryDate: '2026-10-20',
    createdAt: new Date(`2026-10-20T12:00:0${id}Z`),
    modifiedAt: null,
    manual: false,
    areaId: 1,
    areaName: 'VRA',
    accountId: 1,
    name: 'Ana Pérez',
    description: 'Exámenes',
    copias: 10,
    anillados: [],
    ...fields,
  }
}

const ids = (entries: ListedEntry[]) => entries.map((e) => e.id)

describe('filterEntries', () => {
  const entries = [
    entry(1, { name: 'María López', areaId: 1, description: 'Guía de práctica' }),
    entry(2, { name: 'Mario Ruiz', areaId: 2, description: 'Exámenes parciales' }),
    entry(3, { name: 'Juan Mamani', areaId: 1, description: 'Examen final' }),
  ]

  test('no filters: everything', () => {
    expect(ids(filterEntries(entries, noFilters))).toEqual([1, 2, 3])
  })

  test('name matches anywhere, ignoring case and accents', () => {
    expect(ids(filterEntries(entries, { ...noFilters, name: 'MARI' }))).toEqual([1, 2])
    expect(ids(filterEntries(entries, { ...noFilters, name: 'lopez' }))).toEqual([1])
  })

  test('description matches anywhere, ignoring accents', () => {
    expect(ids(filterEntries(entries, { ...noFilters, description: 'examen' }))).toEqual([2, 3])
  })

  test('all filters at the same time', () => {
    expect(
      ids(filterEntries(entries, { areaId: 1, name: 'ma', description: 'examen' })),
    ).toEqual([3])
  })
})

describe('sorting', () => {
  const entries = [
    entry(1, { entryDate: '2026-10-21', areaName: 'Marketing', name: 'Ñandú' }),
    entry(2, { entryDate: '2026-10-19', areaName: 'Administración', name: 'Zoe' }),
    entry(3, { entryDate: '2026-10-21', areaName: 'Empresariales', name: 'Álvaro' }),
  ]

  test('default: newest service date first, then newest saved first', () => {
    // 21/10: 3 saved after 1; then 19/10.
    expect(ids(sortEntries(entries, defaultSort))).toEqual([3, 1, 2])
  })

  test('by service date, same date keeps newest saved first', () => {
    expect(ids(sortEntries(entries, [{ key: 'entryDate', descending: true }]))).toEqual([3, 1, 2])
  })

  test('by name A to Z, accents in Spanish order', () => {
    expect(ids(sortEntries(entries, [{ key: 'name', descending: false }]))).toEqual([3, 1, 2])
  })

  test('by department', () => {
    expect(ids(sortEntries(entries, [{ key: 'area', descending: false }]))).toEqual([2, 3, 1])
  })

  test('department, then date: same date stays in department order', () => {
    const order = nextSort(nextSort(defaultSort, 'area'), 'entryDate')
    // 21/10: Empresariales (3) before Marketing (1); then 19/10.
    expect(ids(sortEntries(entries, order))).toEqual([3, 1, 2])
    const byMarketingFirst = nextSort(nextSort(nextSort(defaultSort, 'area'), 'area'), 'entryDate')
    expect(ids(sortEntries(entries, byMarketingFirst))).toEqual([1, 3, 2])
  })

  test('the column in charge flips; a new column takes charge in its natural order', () => {
    expect(nextSort(defaultSort, 'entryDate')).toEqual([
      { key: 'entryDate', descending: false },
      { key: 'createdAt', descending: true },
    ])
    expect(nextSort(defaultSort, 'name')).toEqual([
      { key: 'name', descending: false },
      { key: 'entryDate', descending: true },
      { key: 'createdAt', descending: true },
    ])
  })

  test('clicking an earlier column moves it to the front, without duplicates', () => {
    const order = nextSort(nextSort(defaultSort, 'area'), 'entryDate')
    expect(nextSort(order, 'area').map((sort) => sort.key)).toEqual([
      'area',
      'entryDate',
      'createdAt',
    ])
  })

  test('default order is recognised, and lost after any click', () => {
    expect(isDefaultSort(defaultSort)).toBe(true)
    expect(isDefaultSort(nextSort(defaultSort, 'entryDate'))).toBe(false)
    expect(isDefaultSort(nextSort(defaultSort, 'name'))).toBe(false)
  })
})

describe('describeAnillados', () => {
  test('one short line', () => {
    expect(
      describeAnillados([
        { sizeMm: 12, quantity: 2 },
        { sizeMm: 20, quantity: 1 },
      ]),
    ).toBe('2 × 12 mm, 1 × 20 mm')
  })

  test('none', () => {
    expect(describeAnillados([])).toBe('')
  })
})
