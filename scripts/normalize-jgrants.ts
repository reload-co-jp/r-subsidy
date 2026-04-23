import fs from 'fs'
import path from 'path'
import type { JGrantsDetailResponse, NormalizedSubsidy } from '../lib/types'
import { normalizeJGrantsDetail } from '../lib/normalize'

const DETAIL_DIR = path.join(process.cwd(), 'data', 'raw', 'jgrants-details')
const OUT_DIR = path.join(process.cwd(), 'data', 'normalized')
const OUT_FILE = path.join(OUT_DIR, 'jgrants-normalized.json')

function readPreviousSubsidies() {
  try {
    if (!fs.existsSync(OUT_FILE)) return new Map<string, NormalizedSubsidy>()

    const previous = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8')) as {
      subsidies?: NormalizedSubsidy[]
    }

    return new Map((previous.subsidies ?? []).map((subsidy) => [subsidy.id, subsidy]))
  } catch {
    return new Map<string, NormalizedSubsidy>()
  }
}

async function main() {
  if (!fs.existsSync(DETAIL_DIR)) {
    console.error('Run fetch-jgrants-details.ts first')
    process.exit(1)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })

  const files = fs.readdirSync(DETAIL_DIR).filter((f) => f.endsWith('.json'))
  console.log(`Normalizing ${files.length} subsidies...`)

  const previousSubsidies = readPreviousSubsidies()
  const results: NormalizedSubsidy[] = []
  let warnings = 0

  for (const file of files) {
    try {
      const raw = JSON.parse(
        fs.readFileSync(path.join(DETAIL_DIR, file), 'utf-8')
      ) as JGrantsDetailResponse
      const detail = Array.isArray(raw.result) ? raw.result[0] : raw.result
      if (!detail) {
        throw new Error('empty result')
      }
      const normalized = normalizeJGrantsDetail(detail)
      const previous = previousSubsidies.get(normalized.id)
      if (!detail.updated_date && previous?.updatedAt) {
        normalized.updatedAt = previous.updatedAt
      }
      results.push(normalized)
    } catch (err) {
      console.warn(`  Warning: ${file} - ${err}`)
      warnings++
    }
  }

  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        normalizedAt: new Date().toISOString(),
        count: results.length,
        warnings,
        subsidies: results,
      },
      null,
      2
    )
  )

  console.log(`Normalized ${results.length} subsidies (${warnings} warnings)`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
