import { readFileSync, writeFileSync } from 'node:fs'
import { parseBackup, restoreSql } from './restore.ts'

// npm run restore-sql -- <backup .json>: writes <backup>.restore.sql next to it, to paste in the SQL
// Editor (docs/maintenance.md, "Restore a backup"). Next to the backup, not in the repo: it holds the
// PIN hashes.

const [path] = process.argv.slice(2)
if (!path) {
  console.error('Usage: npm run restore-sql -- <backup file .json>')
  process.exit(1)
}

let backup
try {
  backup = parseBackup(readFileSync(path, 'utf8'))
} catch (error) {
  console.error(`${path}: ${(error as Error).message}`)
  process.exit(1)
}

const output = path.replace(/\.json$/i, '') + '.restore.sql'
writeFileSync(output, restoreSql(backup))

console.log(`Backup made on ${backup.created_at} (UTC), at migration ${backup.migration}:`)
for (const [table, rows] of Object.entries(backup.tables)) {
  console.log(`  ${table}: ${rows.length} rows`)
}
console.log(`Written: ${output}`)
console.log('The database must be at the same migration. Delete the file after the restore.')
