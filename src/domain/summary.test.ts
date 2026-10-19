import { describe, expect, test } from 'vitest'
import { describeContents } from './summary'

describe('describeContents', () => {
  test('copias only', () => {
    expect(describeContents(50, [])).toBe('50 copias')
  })

  test('singular forms', () => {
    expect(describeContents(1, [1])).toBe('1 copia · 1 anillado')
  })

  test('adds up the quantities of all anillado rows', () => {
    expect(describeContents(0, [2, 1])).toBe('3 anillados')
  })

  test('empty entry', () => {
    expect(describeContents(0, [])).toBe('sin copias ni anillados')
  })
})
