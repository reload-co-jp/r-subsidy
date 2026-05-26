import fs from 'fs'
import path from 'path'
import type { NormalizedSubsidy } from '../lib/types'

const NORMALIZED_FILE = path.join(process.cwd(), 'data', 'normalized', 'jgrants-normalized.json')
const MANUAL_FILE = path.join(process.cwd(), 'data', 'source', 'manual-subsidies.json')
const OUT_DIR = path.join(process.cwd(), 'data', 'normalized')
const MERGED_FILE = path.join(OUT_DIR, 'merged.json')

function stringifyJson(data: unknown) {
  return JSON.stringify(data, null, 2)
}

function readPreviousMergedAt(nextPayload: unknown) {
  try {
    if (!fs.existsSync(MERGED_FILE)) return null

    const previous = JSON.parse(fs.readFileSync(MERGED_FILE, 'utf-8'))
    const previousComparable = { ...previous }
    delete previousComparable.mergedAt

    if (stringifyJson(previousComparable) === stringifyJson(nextPayload)) {
      return typeof previous.mergedAt === 'string' ? previous.mergedAt : null
    }
  } catch {
    // Ignore broken previous output and regenerate below.
  }

  return null
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const jgrants: NormalizedSubsidy[] = fs.existsSync(NORMALIZED_FILE)
    ? JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf-8')).subsidies
    : []
  const manual: NormalizedSubsidy[] = fs.existsSync(MANUAL_FILE)
    ? JSON.parse(fs.readFileSync(MANUAL_FILE, 'utf-8'))
    : []
  const merged: NormalizedSubsidy[] = [...jgrants, ...manual]
  const payload = {
    counts: {
      jgrants: jgrants.length,
      national: 0,
      tokyo: 0,
      overrides: 0,
      manual: manual.length,
      total: merged.length,
    },
    subsidies: merged,
  }

  fs.writeFileSync(
    MERGED_FILE,
    stringifyJson({
      mergedAt: readPreviousMergedAt(payload) ?? new Date().toISOString(),
      ...payload,
    })
  )

  console.log(`Merged: ${jgrants.length} JGrants + ${manual.length} manual = ${merged.length} total`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
