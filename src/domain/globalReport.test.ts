import { describe, expect, test } from 'vitest'
import { buildDetailedReport, type ReportRange } from './detailedReport'
import type { ListedEntry } from './entryList'
import { buildGlobalReport, type Prices } from './globalReport'

const areas = [
  { id: 1, name: 'VRA' },
  { id: 2, name: 'Administración' },
  { id: 3, name: 'Empresariales' },
]
const range: ReportRange = { start: '2026-10-23', end: '2026-11-22', partial: false }
const prices: Prices = {
  copiaCentavos: 30,
  anilladoCentavos: new Map([
    [12, 500],
    [20, 650],
  ]),
}

let nextId = 1
function entry(areaId: number, copias: number, anillados: ListedEntry['anillados'] = []): ListedEntry {
  const id = nextId++
  return {
    id,
    entryDate: '2026-10-25',
    createdAt: new Date('2026-10-25T14:00:00Z'),
    modifiedAt: null,
    manual: false,
    areaId,
    areaName: areas.find((area) => area.id === areaId)?.name ?? 'Oculta',
    accountId: 1,
    name: 'Ana Pérez',
    description: 'Cartas',
    copias,
    anillados,
  }
}

function report(entries: ListedEntry[], range_ = range) {
  return buildGlobalReport(buildDetailedReport(entries, areas, range_), prices)
}

describe('buildGlobalReport', () => {
  test('a department without entries is a row of zeros', () => {
    const row = report([entry(1, 10)]).rows[1]
    expect(row).toEqual({
      areaId: 2,
      areaName: 'Administración',
      copias: 0,
      copiasCentavos: 0,
      anillados: 0,
      anilladosCentavos: 0,
      totalCentavos: 0,
    })
  })

  test('copies at 30 centavos each', () => {
    const row = report([entry(1, 41_000), entry(1, 184)]).rows[0]
    expect(row.copias).toBe(41_184)
    expect(row.copiasCentavos).toBe(1_235_520) // Bs 12 355,20
  })

  test('anillados of several sizes: one count, each priced by its size', () => {
    const row = report([
      entry(1, 0, [{ sizeMm: 12, quantity: 2 }]),
      entry(1, 0, [
        { sizeMm: 20, quantity: 1 },
        { sizeMm: 12, quantity: 1 },
      ]),
    ]).rows[0]
    expect(row.anillados).toBe(4)
    expect(row.anilladosCentavos).toBe(3 * 500 + 650)
  })

  test('a row total is the copies amount plus the anillados amount', () => {
    const row = report([entry(1, 100, [{ sizeMm: 20, quantity: 2 }])]).rows[0]
    expect(row.totalCentavos).toBe(100 * 30 + 2 * 650)
  })

  test('the totals add up each column, and rows keep the order of the monthly report', () => {
    const global = report([
      entry(3, 50, [{ sizeMm: 12, quantity: 1 }]),
      entry(1, 100),
      entry(3, 10, [{ sizeMm: 20, quantity: 2 }]),
    ])
    expect(global.rows.map((row) => row.areaName)).toEqual(['VRA', 'Administración', 'Empresariales'])
    expect(global.totals).toEqual({
      copias: 160,
      copiasCentavos: 4_800,
      anillados: 3,
      anilladosCentavos: 500 + 2 * 650,
      totalCentavos: 4_800 + 500 + 2 * 650,
    })
  })

  test('a hidden department with entries gets its row too', () => {
    const global = report([entry(7, 5)])
    expect(global.rows.map((row) => row.areaId)).toEqual([1, 2, 3, 7])
  })

  test('a size without a price stops the report instead of billing 0', () => {
    expect(() => report([entry(1, 0, [{ sizeMm: 50, quantity: 1 }])])).toThrow('50 mm')
  })

  test('keeps the range of the detailed report, partial included', () => {
    const open: ReportRange = { start: '2026-10-23', end: '2026-10-31', partial: true }
    expect(report([], open).range).toEqual(open)
  })
})
