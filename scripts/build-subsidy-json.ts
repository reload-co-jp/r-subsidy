import fs from 'fs'
import path from 'path'
import type { NormalizedSubsidy, SubsidyIndexItem, UpdateHistory } from '../lib/types'

const MERGED_FILE = path.join(process.cwd(), 'data', 'normalized', 'merged.json')
const OUT_DIR = path.join(process.cwd(), 'data', 'generated')
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'data')

function ensureDirs() {
  for (const dir of [
    OUT_DIR,
    path.join(OUT_DIR, 'subsidies-detail'),
    PUBLIC_DIR,
    path.join(PUBLIC_DIR, 'subsidies-detail'),
  ]) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, stringifyJson(data))
}

function stringifyJson(data: unknown) {
  return JSON.stringify(data, null, 2)
}

function writeJsonIfChanged(filePath: string, data: unknown) {
  const next = stringifyJson(data)
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null

  if (current === next) return false

  fs.writeFileSync(filePath, next)
  return true
}

function readPreviousHistory(): UpdateHistory | null {
  for (const file of [
    path.join(OUT_DIR, 'update-history.json'),
    path.join(PUBLIC_DIR, 'update-history.json'),
  ]) {
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf-8'))
      }
    } catch {
      // Ignore broken history and regenerate below.
    }
  }

  return null
}

async function main() {
  if (!fs.existsSync(MERGED_FILE)) {
    console.error('Run merge-local-subsidies.ts first')
    process.exit(1)
  }

  ensureDirs()

  const { subsidies, counts } = JSON.parse(fs.readFileSync(MERGED_FILE, 'utf-8')) as {
    subsidies: NormalizedSubsidy[]
    counts: { jgrants: number; national: number; tokyo: number; total: number }
  }

  console.log(`Building JSON for ${subsidies.length} subsidies...`)

  // subsidies-index.json (lightweight list)
  const index: SubsidyIndexItem[] = subsidies.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    overview: s.overview,
    region: s.region,
    prefectures: s.prefectures,
    status: s.status,
    industries: s.industries,
    purposes: s.purposes,
    upperLimit: s.upperLimit,
    source: s.source,
    startDate: s.startDate,
    endDate: s.endDate,
    updatedAt: s.updatedAt,
  }))

  let dataChanged = false

  dataChanged = writeJsonIfChanged(path.join(OUT_DIR, 'subsidies-index.json'), index) || dataChanged
  writeJson(path.join(PUBLIC_DIR, 'subsidies-index.json'), index)

  // subsidies-master.json (full data for client-side scoring)
  dataChanged = writeJsonIfChanged(path.join(OUT_DIR, 'subsidies-master.json'), subsidies) || dataChanged
  writeJson(path.join(PUBLIC_DIR, 'subsidies-master.json'), subsidies)

  // subsidies-detail/{slug}.json
  for (const subsidy of subsidies) {
    const detailData = subsidy
    dataChanged =
      writeJsonIfChanged(path.join(OUT_DIR, 'subsidies-detail', `${subsidy.slug}.json`), detailData) ||
      dataChanged
    writeJson(path.join(PUBLIC_DIR, 'subsidies-detail', `${subsidy.slug}.json`), detailData)
  }

  // update-history.json
  const previousHistory = readPreviousHistory()
  const history: UpdateHistory = {
    lastUpdated:
      dataChanged || !previousHistory ? new Date().toISOString() : previousHistory.lastUpdated,
    totalCount: subsidies.length,
    sources: {
      jgrants: counts.jgrants,
      national: counts.national ?? 0,
      tokyo: counts.tokyo,
      manual: 0,
    },
  }
  writeJsonIfChanged(path.join(OUT_DIR, 'update-history.json'), history)
  writeJsonIfChanged(path.join(PUBLIC_DIR, 'update-history.json'), history)

  console.log(`Built:`)
  console.log(`  subsidies-index.json (${index.length} items)`)
  console.log(`  subsidies-master.json (${subsidies.length} items)`)
  console.log(`  subsidies-detail/ (${subsidies.length} files)`)
  console.log(`  update-history.json`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
