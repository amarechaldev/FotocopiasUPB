import { describe, expect, test } from 'vitest'
import { chooseDefault, noAreas, toggleArea, withNewDefault } from './areaSelection'

describe('toggleArea', () => {
  test('the first department ticked is the default', () => {
    const one = toggleArea(noAreas, 7)
    expect(one).toEqual({ areaIds: [7], defaultAreaId: 7 })
    expect(toggleArea(one, 9)).toEqual({ areaIds: [7, 9], defaultAreaId: 7 })
  })

  test('unticking another department keeps the default', () => {
    expect(toggleArea({ areaIds: [7, 9], defaultAreaId: 7 }, 9)).toEqual({
      areaIds: [7],
      defaultAreaId: 7,
    })
  })

  test('unticking the default moves it to the first remaining department', () => {
    expect(toggleArea({ areaIds: [7, 9, 3], defaultAreaId: 7 }, 7)).toEqual({
      areaIds: [9, 3],
      defaultAreaId: 9,
    })
  })

  test('unticking the last department leaves no default', () => {
    expect(toggleArea({ areaIds: [7], defaultAreaId: 7 }, 7)).toEqual(noAreas)
  })
})

describe('chooseDefault', () => {
  test('any ticked department can be the default', () => {
    expect(chooseDefault({ areaIds: [7, 9], defaultAreaId: 7 }, 9)).toEqual({
      areaIds: [7, 9],
      defaultAreaId: 9,
    })
  })

  test('a department that is not ticked cannot be the default', () => {
    const selection = { areaIds: [7, 9], defaultAreaId: 7 }
    expect(chooseDefault(selection, 3)).toBe(selection)
  })
})

describe('withNewDefault', () => {
  const active = [1, 2, 3, 5]

  test('the chosen department becomes the default; archived ones are dropped', () => {
    // 4 was the main department, archived; 2 stays.
    expect(withNewDefault([4, 2], active, 3)).toEqual({ areaIds: [3, 2], defaultAreaId: 3 })
  })

  test('choosing one the account already had does not repeat it', () => {
    expect(withNewDefault([4, 2, 5], active, 2)).toEqual({ areaIds: [2, 5], defaultAreaId: 2 })
  })

  test('other archived departments are dropped too', () => {
    expect(withNewDefault([4, 6, 1], active, 1)).toEqual({ areaIds: [1], defaultAreaId: 1 })
  })
})
