import { describe, expect, test } from 'vitest'
import { suggestDescriptions } from './descriptions'

const EMPRESARIALES = 3
const VRA = 1
const ADMINISTRACION = 2

const common = [
  { areaId: EMPRESARIALES, description: 'Prácticas' },
  { areaId: EMPRESARIALES, description: 'Exámenes' },
  { areaId: EMPRESARIALES, description: 'Control de lectura' },
  { areaId: EMPRESARIALES, description: 'Control' },
  { areaId: VRA, description: 'Cartas' },
  { areaId: VRA, description: 'Diplomas' },
]

describe('suggestDescriptions', () => {
  test('nothing typed: all of the department, alphabetical', () => {
    expect(suggestDescriptions(common, EMPRESARIALES, '')).toEqual([
      'Control',
      'Control de lectura',
      'Exámenes',
      'Prácticas',
    ])
  })

  test('only the selected department', () => {
    expect(suggestDescriptions(common, VRA, '')).toEqual(['Cartas', 'Diplomas'])
  })

  test('filtered by what is typed, ignoring capitals and accents', () => {
    expect(suggestDescriptions(common, EMPRESARIALES, 'con')).toEqual(['Control', 'Control de lectura'])
    expect(suggestDescriptions(common, EMPRESARIALES, 'EXAM')).toEqual(['Exámenes'])
    expect(suggestDescriptions(common, EMPRESARIALES, 'prac')).toEqual(['Prácticas'])
  })

  test('names starting with the text come first', () => {
    expect(suggestDescriptions(common, EMPRESARIALES, 'lec')).toEqual(['Control de lectura'])
    expect(suggestDescriptions(common, EMPRESARIALES, 'c')).toEqual([
      'Control',
      'Control de lectura',
      'Prácticas',
    ])
  })

  test('an exact match that is the only one left: nothing more to choose', () => {
    expect(suggestDescriptions(common, EMPRESARIALES, 'exámenes')).toEqual([])
  })

  test('an exact match that starts another one: both still shown', () => {
    expect(suggestDescriptions(common, EMPRESARIALES, 'control')).toEqual([
      'Control',
      'Control de lectura',
    ])
  })

  test('free text and departments without common descriptions: none', () => {
    expect(suggestDescriptions(common, EMPRESARIALES, 'Afiches')).toEqual([])
    expect(suggestDescriptions(common, ADMINISTRACION, '')).toEqual([])
    expect(suggestDescriptions(common, null, '')).toEqual([])
  })
})
