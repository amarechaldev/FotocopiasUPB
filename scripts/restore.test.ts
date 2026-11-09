import { describe, expect, test } from 'vitest'
import { dollarQuote, parseBackup, restoreSql } from './restore.ts'

const backup = {
  app: 'fotocopias-upb',
  format: 1,
  migration: '0024',
  created_at: '2026-11-08T18:05:00.123+00:00',
  tables: {
    areas: [{ id: 1, name: 'VRA', archived_from: null }],
    entries: [{ id: 7, description: "Examen de 'Cálculo' $& {{MIGRATION}}" }],
  },
}

describe('parseBackup', () => {
  test('reads a backup, indented as downloaded', () => {
    expect(parseBackup(JSON.stringify(backup, null, 2))).toEqual(backup)
  })

  test('refuses anything else', () => {
    expect(() => parseBackup('not json')).toThrow('Not a JSON file.')
    expect(() => parseBackup('[]')).toThrow('Not a Fotocopias UPB backup.')
    expect(() => parseBackup(JSON.stringify({ ...backup, app: 'other' }))).toThrow('Not a Fotocopias UPB backup.')
    expect(() => parseBackup(JSON.stringify({ ...backup, format: 2 }))).toThrow('Backup format 2')
    expect(() => parseBackup(JSON.stringify({ ...backup, migration: undefined }))).toThrow('migration or date')
    expect(() => parseBackup(JSON.stringify({ ...backup, tables: { areas: {} } }))).toThrow('without its tables')
  })
})

describe('dollarQuote', () => {
  test('uses $backup$ when the text does not contain it', () => {
    expect(dollarQuote('{"a":1}')).toBe('$backup${"a":1}$backup$')
  })

  test('picks another tag when the text contains it', () => {
    expect(dollarQuote('{"a":"$backup$"}')).toBe('$backup1${"a":"$backup$"}$backup1$')
    expect(dollarQuote('{"a":"$backup$ $backup1$"}')).toBe('$backup2${"a":"$backup$ $backup1$"}$backup2$')
  })
})

describe('restoreSql', () => {
  const sql = restoreSql(backup)

  test('embeds the backup minified and unchanged', () => {
    const literal = sql.match(/select \$backup\$(.*)\$backup\$::jsonb/)
    expect(literal?.[1]).toBe(JSON.stringify(backup))
  })

  test('fills the header and leaves no placeholder outside the data', () => {
    expect(sql).toContain('made on 2026-11-08T18:05:00.123+00:00 (UTC) at migration 0024')
    expect(sql.replace(JSON.stringify(backup), '')).not.toContain('{{')
  })
})
