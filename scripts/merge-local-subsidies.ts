import fs from 'fs'
import path from 'path'
import type { NormalizedSubsidy } from '../lib/types'

const NORMALIZED_FILE = path.join(process.cwd(), 'data', 'normalized', 'jgrants-normalized.json')
const TOKYO_FILE = path.join(process.cwd(), 'data', 'source', 'tokyo-subsidies.json')
const NATIONAL_FILE = path.join(process.cwd(), 'data', 'source', 'national-subsidies.json')
const OVERRIDES_FILE = path.join(process.cwd(), 'data', 'source', 'manual-overrides.json')
const OUT_DIR = path.join(process.cwd(), 'data', 'normalized')

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const jgrants: NormalizedSubsidy[] = fs.existsSync(NORMALIZED_FILE)
    ? JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf-8')).subsidies
    : []

  const tokyo: NormalizedSubsidy[] = fs.existsSync(TOKYO_FILE)
    ? JSON.parse(fs.readFileSync(TOKYO_FILE, 'utf-8'))
    : []

  const national: NormalizedSubsidy[] = fs.existsSync(NATIONAL_FILE)
    ? JSON.parse(fs.readFileSync(NATIONAL_FILE, 'utf-8'))
    : []

  const overrides: Partial<NormalizedSubsidy>[] = fs.existsSync(OVERRIDES_FILE)
    ? JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf-8'))
    : []

  // Deduplicate: jgrants IDs take priority
  const jgrantsIds = new Set(jgrants.map((s) => s.id))
  const tokyoFiltered = tokyo.filter((s) => !jgrantsIds.has(s.id))
  const nationalFiltered = national.filter((s) => !jgrantsIds.has(s.id))

  let merged: NormalizedSubsidy[] = [...jgrants, ...nationalFiltered, ...tokyoFiltered]

  // Apply manual overrides
  for (const override of overrides) {
    if (!override.id) continue
    const idx = merged.findIndex((s) => s.id === override.id)
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], ...override } as NormalizedSubsidy
    }
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'merged.json'),
    JSON.stringify(
      {
        mergedAt: new Date().toISOString(),
        counts: {
          jgrants: jgrants.length,
          national: nationalFiltered.length,
          tokyo: tokyoFiltered.length,
          overrides: overrides.length,
          total: merged.length,
        },
        subsidies: merged,
      },
      null,
      2
    )
  )

  console.log(
    `Merged: ${jgrants.length} JGrants + ${nationalFiltered.length} National + ${tokyoFiltered.length} Tokyo = ${merged.length} total`
  )
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
