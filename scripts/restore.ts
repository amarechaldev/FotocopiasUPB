import { readFileSync } from 'node:fs'

// Turns a backup file (backup_data(), migration 0024) into SQL for the SQL Editor (#106). The restore
// itself is SQL in restore-template.sql, which reads the tables from the database's catalog; this
// only checks the file and embeds it.

export type Backup = {
  app: string
  format: number
  migration: string
  created_at: string
  tables: Record<string, unknown[]>
}

const TEMPLATE = readFileSync(new URL('./restore-template.sql', import.meta.url), 'utf8')

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// The file's contents as a Backup, or an error saying why it is not one this script can restore.
export function parseBackup(fileText: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(fileText)
  } catch {
    throw new Error('Not a JSON file.')
  }
  if (!isObject(data) || data.app !== 'fotocopias-upb') {
    throw new Error('Not a Fotocopias UPB backup.')
  }
  if (data.format !== 1) {
    throw new Error(`Backup format ${String(data.format)}: this script reads format 1.`)
  }
  if (typeof data.migration !== 'string' || typeof data.created_at !== 'string') {
    throw new Error('Backup without its migration or date.')
  }
  if (!isObject(data.tables) || !Object.values(data.tables).every(Array.isArray)) {
    throw new Error('Backup without its tables.')
  }
  return data as Backup
}

// A dollar-quoted SQL literal: no escaping needed, as long as the tag does not occur in the text.
// The text is JSON, so it starts with { and ends with }: a tag cannot run into it at either end.
export function dollarQuote(text: string): string {
  let tag = '$backup$'
  for (let i = 1; text.includes(tag); i++) tag = `$backup${i}$`
  return tag + text + tag
}

// The SQL file to paste in the SQL Editor. The JSON is minified (the download is indented).
export function restoreSql(backup: Backup): string {
  const values: Record<string, string> = {
    CREATED_AT: backup.created_at,
    MIGRATION: backup.migration,
    BACKUP: dollarQuote(JSON.stringify(backup)),
  }
  // One pass with a function: the inserted text is never searched again, and "$&" in the data is not
  // a replacement pattern.
  return TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, name: string) => values[name])
}
