import { describe, expect, test } from 'vitest'
import { normalizeName, searchByName } from './names'

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
