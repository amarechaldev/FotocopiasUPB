import { describe, expect, test } from 'vitest'
import { buildDetailedReport, reportRange, sumAnillados } from './detailedReport'
import { describeAnillados, type ListedEntry } from './entryList'

function entry(id: number, fields: Partial<ListedEntry>): ListedEntry {
  return {
    id,
    entryDate: '2026-10-25',
    createdAt: new Date('2026-10-25T14:00:00Z'),
    modifiedAt: null,
    manual: false,
    areaId: 1,
    areaName: 'VRA',
    accountId: 1,
    name: 'Ana Pérez',
    description: 'Cartas',
    copias: 10,
    anillados: [],
    ...fields,
  }
}

const ids = (entries: ListedEntry[]) => entries.map((e) => e.id)

// Active departments as fetchAreas returns them: in id order, i.e. the order of the Excel report.
const areas = [
  { id: 1, name: 'VRA' },
  { id: 2, name: 'Administración' },
  { id: 10, name: 'DAAE Cultura' },
]
const november = { start: '2026-10-23', end: '2026-11-22', partial: false }

describe('reportRange', () => {
  const period = { start: '2026-10-23', end: '2026-11-22' }

  test('a closed period: the whole period', () => {
    expect(reportRange(period, '2026-11-25')).toEqual({ ...period, partial: false })
  })

  test('the current period: whole too, so entries dated after today are in, but partial', () => {
    expect(reportRange(period, '2026-10-31')).toEqual({ ...period, partial: true })
  })

  test('on its last day: the whole period, still partial (it is not over)', () => {
    expect(reportRange(period, '2026-11-22')).toEqual({ ...period, partial: true })
  })
})

describe('sumAnillados', () => {
  test('adds up by size, smallest first', () => {
    expect(
      sumAnillados([
        [{ sizeMm: 20, quantity: 1 }],
        [
          { sizeMm: 12, quantity: 2 },
          { sizeMm: 20, quantity: 1 },
        ],
      ]),
    ).toEqual([
      { sizeMm: 12, quantity: 2 },
      { sizeMm: 20, quantity: 2 },
    ])
  })

  test('nothing: no sizes', () => {
    expect(sumAnillados([[], []])).toEqual([])
  })
})

describe('buildDetailedReport', () => {
  test('every department, in the order of the monthly report (not the alphabet)', () => {
    const report = buildDetailedReport([], areas, november)
    expect(report.departments.map((d) => d.areaName)).toEqual(['VRA', 'Administración', 'DAAE Cultura'])
  })

  test('a department without entries has zero totals', () => {
    const report = buildDetailedReport([entry(1, { areaId: 1 })], areas, november)
    const administracion = report.departments[1]
    expect(administracion.entries).toEqual([])
    expect(administracion.totals).toEqual({ copias: 0, anillados: [] })
  })

  test('a hidden department with entries still appears, in its place', () => {
    const report = buildDetailedReport(
      [entry(1, { areaId: 5, areaName: 'DAAE Admisiones' })],
      areas,
      november,
    )
    expect(report.departments.map((d) => d.areaId)).toEqual([1, 2, 5, 10])
  })

  test('entries oldest first; on the same date, in the order they were saved', () => {
    const report = buildDetailedReport(
      [
        entry(1, { entryDate: '2026-10-28', createdAt: new Date('2026-10-28T15:00:00Z') }),
        entry(2, { entryDate: '2026-10-24', createdAt: new Date('2026-10-24T15:00:00Z') }),
        entry(3, { entryDate: '2026-10-28', createdAt: new Date('2026-10-28T13:00:00Z') }),
      ],
      areas,
      november,
    )
    expect(ids(report.departments[0].entries)).toEqual([2, 3, 1])
  })

  test('department totals add copias and merge anillados by size', () => {
    const report = buildDetailedReport(
      [
        entry(1, { copias: 50, anillados: [{ sizeMm: 12, quantity: 2 }] }),
        entry(2, {
          copias: 0,
          anillados: [
            { sizeMm: 12, quantity: 1 },
            { sizeMm: 20, quantity: 1 },
          ],
        }),
        entry(3, { copias: 25 }),
        entry(4, { areaId: 10, areaName: 'DAAE Cultura', copias: 7 }),
      ],
      areas,
      november,
    )
    const vra = report.departments[0].totals
    expect(vra.copias).toBe(75)
    expect(describeAnillados(vra.anillados)).toBe('3 × 12 mm, 1 × 20 mm')
    expect(report.departments[2].totals).toEqual({ copias: 7, anillados: [] })
  })

  test('overall totals are the sum of the department totals', () => {
    const report = buildDetailedReport(
      [
        entry(1, { copias: 50, anillados: [{ sizeMm: 12, quantity: 2 }] }),
        entry(2, { areaId: 2, areaName: 'Administración', copias: 30 }),
        entry(3, {
          areaId: 10,
          areaName: 'DAAE Cultura',
          copias: 5,
          anillados: [{ sizeMm: 7, quantity: 1 }],
        }),
      ],
      areas,
      november,
    )
    expect(report.totals.copias).toBe(85)
    expect(describeAnillados(report.totals.anillados)).toBe('1 × 7 mm, 2 × 12 mm')
  })

  test('an empty period: every department at zero, and zero overall', () => {
    const report = buildDetailedReport([], areas, november)
    expect(report.departments.every((d) => d.totals.copias === 0)).toBe(true)
    expect(report.totals).toEqual({ copias: 0, anillados: [] })
    expect(report.range).toBe(november)
  })
})
