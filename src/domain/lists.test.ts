import { describe, expect, test } from 'vitest'
import { affectedAccounts, groupCommonDescriptions } from './lists'

describe('groupCommonDescriptions', () => {
  test('one line per description with its departments, alphabetical', () => {
    const grouped = groupCommonDescriptions([
      { areaId: 4, description: 'Exámenes' },
      { areaId: 9, description: 'Rendición' },
      { areaId: 3, description: 'Exámenes' },
      { areaId: 11, description: 'Rendición' },
      { areaId: 3, description: 'Control' },
    ])
    expect(grouped).toEqual([
      { description: 'Control', areaIds: [3] },
      { description: 'Exámenes', areaIds: [3, 4] },
      { description: 'Rendición', areaIds: [9, 11] },
    ])
  })

  test('the same text with other capitals or accents is the same description', () => {
    expect(
      groupCommonDescriptions([
        { areaId: 1, description: 'Exámenes' },
        { areaId: 2, description: 'examenes' },
      ]),
    ).toEqual([{ description: 'Exámenes', areaIds: [1, 2] }])
  })

  test('accents do not change the order', () => {
    const grouped = groupCommonDescriptions([
      { areaId: 1, description: 'Títulos' },
      { areaId: 1, description: 'Cartas' },
      { areaId: 1, description: 'Ácidos' },
    ])
    expect(grouped.map((g) => g.description)).toEqual(['Ácidos', 'Cartas', 'Títulos'])
  })
})

describe('affectedAccounts', () => {
  const accounts = [
    { name: 'Ana', areaIds: [1, 2], defaultAreaId: 1, archived: false },
    { name: 'Beto', areaIds: [2], defaultAreaId: 2, archived: false },
    { name: 'Carla', areaIds: [2, 3], defaultAreaId: 3, archived: false },
    { name: 'Dina', areaIds: [2], defaultAreaId: 2, archived: true },
    { name: 'Eva', areaIds: [3], defaultAreaId: 3, archived: false },
  ]

  test('active accounts with the department: main department or another one', () => {
    const affected = affectedAccounts(accounts, 2)
    expect(affected.main.map((a) => a.name)).toEqual(['Beto'])
    expect(affected.other.map((a) => a.name)).toEqual(['Ana', 'Carla'])
  })

  test('nobody has it', () => {
    expect(affectedAccounts(accounts, 7)).toEqual({ main: [], other: [] })
  })
})
