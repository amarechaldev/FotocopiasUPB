import { describe, expect, test } from 'vitest'
import { exactMatch, filterByName, normalizeName, searchByName } from './names'

describe('normalizeName', () => {
  test('ignores case, accents and extra spaces', () => {
    expect(normalizeName('  María   López ')).toBe('maria lopez')
    expect(normalizeName('Ñuflo PEÑA')).toBe('nuflo pena')
  })
})

describe('searchByName', () => {
  const accounts = [{ name: 'María López' }, { name: 'Mario Rojas' }, { name: 'Ana Pérez' }]

  test('finds names containing the text, ignoring case and accents', () => {
    expect(searchByName(accounts, 'mari')).toEqual([{ name: 'María López' }, { name: 'Mario Rojas' }])
    expect(searchByName(accounts, 'LOPEZ')).toEqual([{ name: 'María López' }])
    expect(searchByName(accounts, 'pér')).toEqual([{ name: 'Ana Pérez' }])
  })

  describe('best matches first', () => {
    const people = [{ name: 'Alexis Marechal' }, { name: 'Luis Salinas' }, { name: 'Sandra Ali' }]

    test('a name starting with the text comes before one containing it', () => {
      expect(searchByName(people, 'l')).toEqual([
        { name: 'Luis Salinas' },
        { name: 'Alexis Marechal' },
        { name: 'Sandra Ali' },
      ])
    })

    test('then names with another word starting with it', () => {
      expect(searchByName(people, 'sa')).toEqual([{ name: 'Sandra Ali' }, { name: 'Luis Salinas' }])
    })
  })

  test('nothing typed shows no names', () => {
    expect(searchByName(accounts, '  ')).toEqual([])
  })

  test('no match gives an empty list', () => {
    expect(searchByName(accounts, 'zz')).toEqual([])
  })
})

describe('exactMatch', () => {
  const accounts = [{ name: 'María López' }, { name: 'Ana' }, { name: 'Ana María Pérez' }]

  test('the whole name, ignoring case, accents and spaces', () => {
    expect(exactMatch(accounts, 'maria lopez')).toEqual({ name: 'María López' })
    expect(exactMatch(accounts, '  MARÍA   LÓPEZ ')).toEqual({ name: 'María López' })
  })

  test('part of a name is not enough', () => {
    expect(exactMatch(accounts, 'maria lop')).toBeNull()
    expect(exactMatch(accounts, 'lopez')).toBeNull()
  })

  test('none while the name is also part of another one', () => {
    expect(exactMatch(accounts, 'ana')).toBeNull()
  })

  test('nothing typed or no account', () => {
    expect(exactMatch(accounts, '')).toBeNull()
    expect(exactMatch(accounts, 'maria lopez rojas')).toBeNull()
  })
})

describe('filterByName', () => {
  const accounts = [{ name: 'María López' }, { name: 'Ana Pérez' }]

  test('nothing typed: every account', () => {
    expect(filterByName(accounts, '')).toEqual(accounts)
    expect(filterByName(accounts, '  ')).toEqual(accounts)
  })

  test('typed: the matches, ignoring case and accents', () => {
    expect(filterByName(accounts, 'PEREZ')).toEqual([{ name: 'Ana Pérez' }])
    expect(filterByName(accounts, 'zz')).toEqual([])
  })
})
