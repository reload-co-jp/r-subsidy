import fs from 'fs'
import path from 'path'
import type { NormalizedSubsidy } from '../lib/types'

const NORMALIZED_FILE = path.join(process.cwd(), 'data', 'normalized', 'jgrants-normalized.json')
const OUT_DIR = path.join(process.cwd(), 'data', 'normalized')

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const jgrants: NormalizedSubsidy[] = fs.existsSync(NORMALIZED_FILE)
    ? JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf-8')).subsidies
    : []
  const merged: NormalizedSubsidy[] = [...jgrants]

  fs.writeFileSync(
    path.join(OUT_DIR, 'merged.json'),
    JSON.stringify(
      {
        mergedAt: new Date().toISOString(),
        counts: {
          jgrants: jgrants.length,
          national: 0,
          tokyo: 0,
          overrides: 0,
          total: merged.length,
        },
        subsidies: merged,
      },
      null,
      2
    )
  )

  console.log(`Merged: ${jgrants.length} JGrants = ${merged.length} total`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
